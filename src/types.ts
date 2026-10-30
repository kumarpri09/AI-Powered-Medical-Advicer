export interface Language {
  code: string;
  name: string;
  native: string;
  speechCode: string;
  description: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  data: string; // base64 string without data URL prefix
  mimeType: string;
  name: string;
  previewUrl: string; // full data URL for previewing in <img>, <video>, <audio>
}

export type SeverityLevel = 'low' | 'moderate' | 'urgent' | 'emergency';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  media?: MediaItem[];
  severity?: SeverityLevel;
  specialist?: string;
  spokenSummary?: string;
  audioBase64?: string;
  isAudioPlaying?: boolean;
}

export interface Disease {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  symptoms: string[];
  homeCare: string[];
  redFlags: string[];
  doctor: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number;
  symptom: string;
  category: string;
  severity: number; // 1 to 10 scale
  temperature?: number; // °F
  systolicBP?: number;
  diastolicBP?: number;
  bloodSugar?: number; // mg/dL
  notes?: string;
  tags?: string[];
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', speechCode: 'en-US', description: 'Universal English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN', description: 'भारतीय राष्ट्रभाषा' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish (Hindi in English Script)', speechCode: 'hi-IN', description: 'Bilingual Hindi-English mix' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speechCode: 'bn-IN', description: 'পশ্চিমবঙ্গ ও ত্রিপুরা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN', description: 'தமிழ்நாடு' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN', description: 'ఆంధ్రప్రదేశ్ & తెలంగాణ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speechCode: 'mr-IN', description: 'महाराष्ट्र' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', speechCode: 'gu-IN', description: 'ગુજરાત' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speechCode: 'kn-IN', description: 'ಕರ್ನಾಟಕ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', speechCode: 'ml-IN', description: 'കേരളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN', description: 'ਪੰਜਾਬ' },
  { code: 'ur', name: 'Urdu', native: 'اردو', speechCode: 'ur-PK', description: 'اردو زبان' },
  { code: 'od', name: 'Odia', native: 'ଓଡ଼ିଆ', speechCode: 'or-IN', description: 'ଓଡ଼ିଶା' },
];

