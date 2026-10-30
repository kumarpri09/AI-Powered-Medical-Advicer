import { Language } from '../types';

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Plays base64 audio from Gemini TTS or falls back to Web Speech API
 */
export async function playSpokenVoice(
  text: string,
  audioBase64?: string,
  language?: Language,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  // Stop any currently playing audio
  stopSpokenVoice();

  // 1. If we have Gemini generated audio (base64 WAV)
  if (audioBase64) {
    try {
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onplay = () => {
        onStart?.();
      };

      audio.onended = () => {
        currentAudio = null;
        onEnd?.();
      };

      audio.onerror = () => {
        currentAudio = null;
        // Fallback to browser synthesis
        fallbackSpeechSynthesis(text, language, onStart, onEnd);
      };

      await audio.play();
      return;
    } catch (e) {
      console.warn('Audio element play failed, trying Web Speech API fallback:', e);
    }
  }

  // 2. Fallback to Web Speech Synthesis
  fallbackSpeechSynthesis(text, language, onStart, onEnd);
}

function fallbackSpeechSynthesis(
  text: string,
  language?: Language,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported on this browser');
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    // Clean up text from emojis, special symbols, and excess markdown
    const cleanedText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~>]/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    currentUtterance = utterance;

    const speechCode = language?.speechCode || 'en-US';
    utterance.lang = speechCode;
    utterance.rate = 0.95; // Slightly slower, comfortable for medical advice
    utterance.pitch = 1.0;

    // Try finding a matching native voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith(speechCode.toLowerCase().split('-')[0])
    ) || voices.find((v) => v.lang.includes('IN') || v.lang.includes('en'));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      currentUtterance = null;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Web Speech API execution error:', err);
    onEnd?.();
  }
}

/**
 * Stops any speech playback currently in progress
 */
export function stopSpokenVoice(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * Checks if browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Creates and starts speech recognition with target language
 */
export function startSpeechRecognition(
  languageCode: string,
  onResult: (text: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
): { stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = languageCode || 'en-IN';

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onResult(finalTranscript || interim);
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition warning:', e);
      onError(e);
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (_) {}
      },
    };
  } catch (err) {
    onError(err);
    return null;
  }
}
