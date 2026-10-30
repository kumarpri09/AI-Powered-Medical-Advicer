import React, { useRef, useState, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Camera,
  X,
  FileImage,
  Video,
  Music,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Language, MediaItem } from '../types';
import { isSpeechRecognitionSupported, startSpeechRecognition } from '../utils/speech';
import { transcribeAudio } from '../services/api';

interface InputAreaProps {
  onSendMessage: (text: string, media: MediaItem[]) => void;
  isLoading: boolean;
  currentLanguage: Language;
  onOpenLiveCamera: () => void;
  fontSize: 'sm' | 'md' | 'lg';
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading,
  currentLanguage,
  onOpenLiveCamera,
  fontSize,
}) => {
  const [text, setText] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionControllerRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // Clean up timers & speech recognition
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionControllerRef.current) recognitionControllerRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartVoice = async () => {
    if (isRecording) {
      handleStopVoice();
      return;
    }

    setIsRecording(true);
    setRecordingDuration(0);

    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    // First try Web Speech Recognition for instant feedback
    if (isSpeechRecognitionSupported()) {
      let recognizedTextSoFar = text;
      const controller = startSpeechRecognition(
        currentLanguage.speechCode,
        (interimOrFinal) => {
          setText((prev) => {
            const base = recognizedTextSoFar ? `${recognizedTextSoFar} ` : '';
            return `${base}${interimOrFinal}`;
          });
        },
        (err) => {
          console.warn('Web speech error, falling back to MediaRecorder:', err);
          startMediaRecorderFallback();
        },
        () => {
          setIsRecording(false);
          clearInterval(timerIntervalRef.current);
        }
      );

      if (controller) {
        recognitionControllerRef.current = controller;
        return;
      }
    }

    // Fallback: Use MediaRecorder + Gemini 3.5 Transcribe
    startMediaRecorderFallback();
  };

  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          await transcribeBlob(audioBlob);
        }
      };

      recorder.start();
    } catch (err) {
      console.error('Microphone recording error:', err);
      alert('Microphone access is needed for voice advisory. Please grant permission or type your symptoms.');
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        if (base64Data) {
          const transcript = await transcribeAudio(base64Data, 'audio/webm', currentLanguage.name);
          if (transcript) {
            setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
        setIsTranscribing(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Transcription failed:', e);
      setIsTranscribing(false);
    }
  };

  const handleStopVoice = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recognitionControllerRef.current) {
      recognitionControllerRef.current.stop();
      recognitionControllerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // 30MB limit per file
      if (file.size > 30 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 30MB. Please select a smaller file.`);
        return;
      }

      let type: 'image' | 'video' | 'audio' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        const newItem: MediaItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type,
          data: base64Data,
          mimeType: file.type || (type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/webm'),
          name: file.name,
          previewUrl: dataUrl,
        };
        setMediaItems((prev) => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSend = () => {
    if ((!text.trim() && mediaItems.length === 0) || isLoading) return;
    onSendMessage(text.trim(), mediaItems);
    setText('');
    setMediaItems([]);
    if (isRecording) {
      handleStopVoice();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const quickSymptoms = [
    { label: 'High Fever & Chills', query: 'I have had a high fever (102°F) with shivering and body ache for 2 days.' },
    { label: 'Chest Acidity & Burning', query: 'I have a painful burning sensation in my chest and throat after dinner.' },
    { label: 'Skin Itching / Red Rash', query: 'I have a red, itchy circular rash on my skin with irritation.' },
    { label: 'Severe Headache & Nausea', query: 'Throbbing one-sided headache with nausea and light sensitivity.' },
  ];

  return (
    <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 sm:p-4 shadow-lg">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Quick Symptom Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Quick query:
          </span>
          {quickSymptoms.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(chip.query)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 whitespace-nowrap transition-colors text-[11px] font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Media Attachments Preview */}
        {mediaItems.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="relative group shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-900 shadow-sm"
              >
                {item.type === 'image' && (
                  <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                )}
                {item.type === 'video' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white p-1">
                    <Video className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-[9px] truncate max-w-full">{item.name}</span>
                  </div>
                )}
                {item.type === 'audio' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-teal-900 text-white p-1">
                    <Music className="w-6 h-6 text-teal-300 mb-1" />
                    <span className="text-[9px] truncate max-w-full">{item.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMediaItem(item.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live Recording Bar if Voice is active */}
        {isRecording && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span className="font-bold">Listening in {currentLanguage.native} ({currentLanguage.name})...</span>
              <span className="font-mono text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
                {formatTimer(recordingDuration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 h-6 px-2">
              <span className="w-1 bg-rose-500 rounded-full animate-soundwave-1"></span>
              <span className="w-1 bg-rose-600 rounded-full animate-soundwave-2"></span>
              <span className="w-1 bg-rose-500 rounded-full animate-soundwave-3"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-soundwave-4"></span>
              <span className="w-1 bg-rose-600 rounded-full animate-soundwave-5"></span>
            </div>

            <button
              type="button"
              onClick={handleStopVoice}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              Done Speaking
            </button>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Processing and transcribing your speech via Gemini...</span>
          </div>
        )}

        {/* Main Input Control Bar */}
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-2 transition-all shadow-inner">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Media Attachment Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 pb-1">
            {/* File Upload Button (Photo, Video, Audio) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-xl transition-colors"
              title="Attach photo of symptom/rash, video, or audio file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Live Camera Button */}
            <button
              type="button"
              onClick={onOpenLiveCamera}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-xl transition-colors"
              title="Take a live photo of skin rash, throat, eye, or medicine"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={handleStartVoice}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                  : 'text-slate-500 hover:text-emerald-700 hover:bg-white'
              }`}
              title={isRecording ? 'Stop recording voice' : `Speak in ${currentLanguage.native} or English`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentLanguage.code === 'hi'
                ? 'अपने लक्षण बताएं, फोटो या आवाज भेजें (उदा. 2 दिन से बुखार और बदन दर्द है)...'
                : currentLanguage.code === 'hinglish'
                ? 'Apne symptoms batayein ya photo bhejein (e.g. 2 din se bukhar aur gale me dard hai)...'
                : `Describe your symptoms, disease query, or attach a photo/video/audio in ${currentLanguage.name}...`
            }
            rows={1}
            className={`w-full bg-transparent resize-none border-0 focus:ring-0 p-1.5 text-slate-800 placeholder-slate-400 outline-none leading-relaxed ${
              fontSize === 'lg' ? 'text-base' : fontSize === 'md' ? 'text-sm' : 'text-xs'
            }`}
          />

          {/* Send Button */}
          <button
            type="button"
            disabled={(!text.trim() && mediaItems.length === 0) || isLoading}
            onClick={handleSend}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20 shrink-0 pb-2.5 active:scale-95"
            title="Send Consultation Query"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {/* Input Helper Footnote */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="hidden sm:inline">
            Speak or type in <strong>{currentLanguage.native}</strong> • Attach photos of rash/eyes/medicine • Press Enter to send
          </span>
          <span className="text-[10px] text-slate-400">
            Powered by Gemini 3.8 Flash Multimodal & TTS
          </span>
        </div>
      </div>
    </div>
  );
};
