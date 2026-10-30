import React from 'react';
import {
  HeartPulse,
  BookOpen,
  PhoneCall,
  Volume2,
  VolumeX,
  RotateCcw,
  Languages,
  CalendarHeart,
} from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../types';

interface NavbarProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  fontSize: 'sm' | 'md' | 'lg';
  onChangeFontSize: (size: 'sm' | 'md' | 'lg') => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onOpenDiseaseGuide: () => void;
  onOpenHealthJournal: () => void;
  onOpenEmergency: () => void;
  onResetChat: () => void;
  messageCount: number;
  journalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onSelectLanguage,
  fontSize,
  onChangeFontSize,
  autoSpeak,
  onToggleAutoSpeak,
  onOpenDiseaseGuide,
  onOpenHealthJournal,
  onOpenEmergency,
  onResetChat,
  messageCount,
  journalCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-100">
            <HeartPulse className="w-6 h-6 animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                Aarogya<span className="text-emerald-600">AI</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                Health Advisor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Voice • Photo • Video • Regional Language Disease Triage
            </p>
          </div>
        </div>

        {/* Action Controls & Accessibility */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Selector */}
          <div className="relative group">
            <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer">
              <Languages className="w-4 h-4 text-emerald-700 mr-1.5" />
              <select
                aria-label="Select consultation language"
                value={currentLanguage.code}
                onChange={(e) => {
                  const found = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                  if (found) onSelectLanguage(found);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Size Accessibility Controls */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onChangeFontSize('sm')}
              title="Standard text size"
              className={`px-2 py-1 rounded font-medium transition-all ${
                fontSize === 'sm' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize('md')}
              title="Large text size"
              className={`px-2 py-1 rounded font-medium transition-all ${
                fontSize === 'md' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize('lg')}
              title="Extra large text size"
              className={`px-2 py-1 rounded font-medium transition-all ${
                fontSize === 'lg' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A++
            </button>
          </div>

          {/* Auto-read voice speech toggle */}
          <button
            type="button"
            onClick={onToggleAutoSpeak}
            title={autoSpeak ? 'Auto-speak replies is ON (Click to turn off)' : 'Auto-speak replies is OFF (Click to turn on)'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              autoSpeak
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Voice: On' : 'Voice: Off'}</span>
          </button>

          {/* Health Journal & D3 Trends */}
          <button
            type="button"
            onClick={onOpenHealthJournal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-all shadow-xs"
            title="Open Health Journal & D3 Symptom Trend Visualization"
          >
            <CalendarHeart className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">Health Journal</span>
            <span className="md:hidden">Journal</span>
            {journalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                {journalCount}
              </span>
            )}
          </button>

          {/* Disease Guide Encyclopedia */}
          <button
            type="button"
            onClick={onOpenDiseaseGuide}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold transition-all shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Disease Library</span>
            <span className="md:hidden">Library</span>
          </button>

          {/* Emergency SOS button */}
          <button
            type="button"
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-rose-600/30 ring-1 ring-rose-400 active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>SOS</span>
          </button>

          {/* Reset / New Chat */}
          {messageCount > 0 && (
            <button
              type="button"
              onClick={onResetChat}
              title="Start a new consultation"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
