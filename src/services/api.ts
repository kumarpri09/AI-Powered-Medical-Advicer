import { Disease, MediaItem, Message, SeverityLevel } from '../types';

export interface ChatResponse {
  reply: string;
  spokenSummary: string;
  severity: SeverityLevel;
  specialist: string;
  audioBase64?: string;
  language: string;
}

export async function sendChatMessage(
  message: string,
  language: string,
  media: MediaItem[] = [],
  history: Message[] = [],
  voiceRequested: boolean = true
): Promise<ChatResponse> {
  const payloadMedia = media.map((m) => ({
    mimeType: m.mimeType,
    data: m.data,
    name: m.name,
  }));

  const payloadHistory = history.map((h) => ({
    role: h.role,
    text: h.content,
  }));

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      language,
      media: payloadMedia,
      history: payloadHistory,
      voiceRequested,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function transcribeAudio(audioData: string, mimeType: string, languageHint?: string): Promise<string> {
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioData,
      mimeType,
      languageHint,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to transcribe audio');
  }

  const data = await res.json();
  return data.transcript || '';
}

export async function generateSpeechAudio(text: string, voice = 'Kore'): Promise<string> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate voice audio');
  }

  const data = await res.json();
  return data.audioBase64;
}

export async function fetchDiseases(): Promise<Disease[]> {
  try {
    const res = await fetch('/api/diseases');
    if (!res.ok) throw new Error('Failed to load diseases');
    const data = await res.json();
    return data.diseases || [];
  } catch (error) {
    console.warn('Fallback to local disease catalog', error);
    return [];
  }
}
