import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { Disease } from '../types';

interface DiseaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  diseases: Disease[];
  onSelectDiseaseForChat: (disease: Disease) => void;
}

export const DiseaseGuideModal: React.FC<DiseaseGuideModalProps> = ({
  isOpen,
  onClose,
  diseases,
  onSelectDiseaseForChat,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDisease, setActiveDisease] = useState<Disease | null>(diseases[0] || null);

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(diseases.map((d) => d.category)))];

  const filteredDiseases = diseases.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.nameHi.toLowerCase().includes(search.toLowerCase()) ||
      d.symptoms.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      d.category.toLowerCase().includes(search.toLowerCase());

    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const displayedDisease = activeDisease || filteredDiseases[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">General Disease Encyclopedia & Advisory</h2>
              <p className="text-xs text-emerald-100">Quick clinical reference, symptoms, home care & red flags</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search diseases, symptoms (fever, rash...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-emerald-500 text-slate-800 shadow-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Disease List Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-2 space-y-1">
            {filteredDiseases.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-500">No diseases found matching your search.</p>
            ) : (
              filteredDiseases.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveDisease(d)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 border ${
                    displayedDisease?.id === d.id
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-100/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs truncate">{d.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {d.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{d.nameHi}</span>
                </button>
              ))
            )}
          </div>

          {/* Disease Detail Pane */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
            {displayedDisease ? (
              <div className="space-y-5">
                {/* Title & Ask in Chat Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {displayedDisease.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{displayedDisease.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{displayedDisease.nameHi}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectDiseaseForChat(displayedDisease);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Ask AarogyaAI About This</span>
                  </button>
                </div>

                {/* Symptoms */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Common Symptoms
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayedDisease.symptoms.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Home Care & Relief */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Home Care & First Relief Measures
                  </h4>
                  <ul className="space-y-2">
                    {displayedDisease.homeCare.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Red Flags / Emergency Warnings */}
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Emergency Signs - Seek Immediate Doctor / Hospital Care
                  </h4>
                  <ul className="space-y-1.5 text-xs text-rose-900/90">
                    {displayedDisease.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">⚠</span>
                        <span className="leading-relaxed">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Doctor to consult */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                  <Stethoscope className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-bold">Recommended Specialist: </span>
                    <span className="font-semibold text-teal-800">{displayedDisease.doctor}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Medical information aligned with general public health guidelines</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
