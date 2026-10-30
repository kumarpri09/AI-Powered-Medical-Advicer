/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { DiseaseGuideModal } from './components/DiseaseGuideModal';
import { EmergencyModal } from './components/EmergencyModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { Disease, Language, MediaItem, Message, SUPPORTED_LANGUAGES } from './types';
import { sendChatMessage, fetchDiseases } from './services/api';
import { playSpokenVoice, stopSpokenVoice } from './utils/speech';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('aarogya_lang');
    if (saved) {
      const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
      if (found) return found;
    }
    return SUPPORTED_LANGUAGES[0]; // English default, easy switch to Hindi / Hinglish / regional
  });

  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('aarogya_font_size') as any) || 'md';
  });

  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    const saved = localStorage.getItem('aarogya_autospeak');
    return saved !== null ? saved === 'true' : true; // Default auto-speak on for high accessibility
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('aarogya_messages');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isDiseaseGuideOpen, setIsDiseaseGuideOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [diseases, setDiseases] = useState<Disease[]>([]);

  // Save state in localStorage
  useEffect(() => {
    localStorage.setItem('aarogya_lang', currentLanguage.code);
  }, [currentLanguage]);

  useEffect(() => {
    localStorage.setItem('aarogya_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('aarogya_autospeak', autoSpeak ? 'true' : 'false');
  }, [autoSpeak]);

  useEffect(() => {
    try {
      localStorage.setItem('aarogya_messages', JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  // Load disease encyclopedia catalog on mount
  useEffect(() => {
    fetchDiseases().then((list) => {
      if (list && list.length > 0) setDiseases(list);
    });
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    stopSpokenVoice();
    setActivePlayingId(null);
  };

  const handlePlayVoice = (message: Message) => {
    const speechText = message.spokenSummary || message.content;
    setActivePlayingId(message.id);
    playSpokenVoice(
      speechText,
      message.audioBase64,
      currentLanguage,
      () => setActivePlayingId(message.id),
      () => setActivePlayingId(null)
    );
  };

  const handleStopVoice = () => {
    stopSpokenVoice();
    setActivePlayingId(null);
  };

  const handleSendMessage = async (text: string, media: MediaItem[] = []) => {
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      media,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);
    handleStopVoice();

    try {
      const response = await sendChatMessage(
        text,
        currentLanguage.code,
        media,
        nextMessages,
        autoSpeak // Request TTS audio from server if autoSpeak is on
      );

      const aiMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: Date.now(),
        severity: response.severity,
        specialist: response.specialist,
        spokenSummary: response.spokenSummary,
        audioBase64: response.audioBase64,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);

      // Auto-speak voice if enabled
      if (autoSpeak && (response.spokenSummary || response.reply)) {
        setTimeout(() => {
          handlePlayVoice(aiMessage);
        }, 300);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        content: `⚠️ We encountered an issue processing your query: ${error.message || 'Please check your connection and try again.'}\n\nIf you are experiencing an acute medical emergency, please call **108** or **112** without delay.`,
        timestamp: Date.now(),
        severity: 'urgent',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleResetChat = () => {
    handleStopVoice();
    setMessages([]);
    localStorage.removeItem('aarogya_messages');
  };

  const handleSelectDiseaseForChat = (disease: Disease) => {
    const query =
      currentLanguage.code === 'hi'
        ? `कृपया मुझे ${disease.nameHi} (${disease.name}) के कारण, लक्षण, घरेलू प्राथमिक उपचार और कब डॉक्टर के पास जाना चाहिए, इसके बारे में विस्तार से बताएं।`
        : currentLanguage.code === 'hinglish'
        ? `Please mujhe ${disease.name} (${disease.nameHi}) ke symptoms, safe home care tips aur doctor consult ke baare me detail advice dijiye.`
        : `Please provide comprehensive medical advice about ${disease.name}: common symptoms, home relief measures, emergency red flags, and doctor consultation.`;

    handleSendMessage(query);
  };

  const handleAttachCameraPhoto = (item: MediaItem) => {
    handleSendMessage('Please analyze this photo and advise on possible skin/symptom condition and first aid.', [item]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onOpenDiseaseGuide={() => setIsDiseaseGuideOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onResetChat={handleResetChat}
        messageCount={messages.length}
      />

      {/* Medical Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Chat Stream */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          currentLanguage={currentLanguage}
          onPlayVoice={handlePlayVoice}
          onStopVoice={handleStopVoice}
          activePlayingId={activePlayingId}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          fontSize={fontSize}
        />

        {/* Input Bar */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentLanguage={currentLanguage}
          onOpenLiveCamera={() => setIsLiveCameraOpen(true)}
          fontSize={fontSize}
        />
      </main>

      {/* Disease Library Modal */}
      <DiseaseGuideModal
        isOpen={isDiseaseGuideOpen}
        onClose={() => setIsDiseaseGuideOpen(false)}
        diseases={diseases}
        onSelectDiseaseForChat={handleSelectDiseaseForChat}
      />

      {/* Emergency SOS Directory Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Live Camera Snapshot Modal */}
      <CameraCaptureModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={handleAttachCameraPhoto}
      />
    </div>
  );
}
