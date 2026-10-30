import React, { useState } from 'react';
import {
  Plus,
  Thermometer,
  Activity,
  Heart,
  Droplets,
  Calendar,
  Clock,
  Check,
} from 'lucide-react';
import { JournalEntry } from '../../types';

interface SymptomEntryFormProps {
  onSaveEntry: (entry: JournalEntry) => void;
  onCancel: () => void;
  initialSymptom?: string;
}

export const SymptomEntryForm: React.FC<SymptomEntryFormProps> = ({
  onSaveEntry,
  onCancel,
  initialSymptom = '',
}) => {
  const [symptom, setSymptom] = useState(initialSymptom || 'Viral Fever');
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [temperature, setTemperature] = useState<string>('');
  const [systolicBP, setSystolicBP] = useState<string>('');
  const [diastolicBP, setDiastolicBP] = useState<string>('');
  const [bloodSugar, setBloodSugar] = useState<string>('');
  const [notes, setNotes] = useState('');

  const PRESET_SYMPTOMS = [
    { label: 'Viral Fever', category: 'Infection' },
    { label: 'Headache', category: 'Neurology' },
    { label: 'Dry Cough', category: 'Respiratory' },
    { label: 'Acid Reflux', category: 'Digestive' },
    { label: 'Loose Motions', category: 'Digestive' },
    { label: 'Skin Rash', category: 'Dermatology' },
    { label: 'Body Fatigue', category: 'General' },
    { label: 'Joint Pain', category: 'Musculoskeletal' },
    { label: 'High BP / Dizziness', category: 'Cardiovascular' },
    { label: 'Normal Checkup', category: 'Wellness' },
    { label: 'Other', category: 'Custom' },
  ];

  const getSeverityMeta = (val: number) => {
    if (val >= 9) return { label: 'Critical / Extreme Pain', color: 'text-rose-600 bg-rose-50 border-rose-300', emoji: '😫' };
    if (val >= 7) return { label: 'Severe / Urgent Discomfort', color: 'text-orange-600 bg-orange-50 border-orange-300', emoji: '😣' };
    if (val >= 5) return { label: 'Moderate / Interfering with Activity', color: 'text-amber-600 bg-amber-50 border-amber-300', emoji: '😐' };
    if (val >= 3) return { label: 'Mild / Noticeable Discomfort', color: 'text-sky-600 bg-sky-50 border-sky-300', emoji: '🙂' };
    return { label: 'Very Mild / Nearly Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-300', emoji: '😊' };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymptom = symptom === 'Other' ? (customSymptom.trim() || 'Unspecified Symptom') : symptom;
    const foundPreset = PRESET_SYMPTOMS.find((p) => p.label === finalSymptom);
    const category = foundPreset ? foundPreset.category : 'General';

    const timestamp = new Date(`${date}T${time}`).getTime() || Date.now();

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      date,
      time,
      timestamp,
      symptom: finalSymptom,
      category,
      severity,
      temperature: temperature ? parseFloat(temperature) : undefined,
      systolicBP: systolicBP ? parseInt(systolicBP, 10) : undefined,
      diastolicBP: diastolicBP ? parseInt(diastolicBP, 10) : undefined,
      bloodSugar: bloodSugar ? parseInt(bloodSugar, 10) : undefined,
      notes: notes.trim() || undefined,
      tags: [category, finalSymptom],
    };

    onSaveEntry(newEntry);
  };

  const severityMeta = getSeverityMeta(severity);

  return (
    <form onSubmit={handleSave} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800">Log Daily Symptom</h3>
          <p className="text-xs text-slate-500">Track frequency and severity over time to detect health trends</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500 font-medium"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Time of Day
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500 font-medium"
            required
          />
        </div>
      </div>

      {/* Primary Symptom Presets */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2">
          Select Primary Symptom
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SYMPTOMS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setSymptom(preset.label)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                symptom === preset.label
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {symptom === 'Other' && (
          <div className="mt-2.5">
            <input
              type="text"
              placeholder="Enter custom symptom (e.g. Earache, Chest tightness...)"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500"
              required
            />
          </div>
        )}
      </div>

      {/* Severity Slider (1 - 10) */}
      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">
            Symptom Severity Rating (1 - 10)
          </label>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${severityMeta.color}`}>
            <span>{severityMeta.emoji}</span>
            <span>{severity}/10 : {severityMeta.label}</span>
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={severity}
          onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
          className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
          <span>1 (Very Mild)</span>
          <span>5 (Moderate)</span>
          <span>10 (Emergency)</span>
        </div>
      </div>

      {/* Optional Vitals (Temperature, BP, Sugar) */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2">
          Optional Vitals & Measurements
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Thermometer className="w-3 h-3 text-orange-500" />
              Body Temp (°F)
            </span>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 101.2"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-sky-500" />
              Blood Pressure (Sys/Dia)
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="120"
                value={systolicBP}
                onChange={(e) => setSystolicBP(e.target.value)}
                className="w-1/2 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500"
              />
              <span className="text-slate-400">/</span>
              <input
                type="number"
                placeholder="80"
                value={diastolicBP}
                onChange={(e) => setDiastolicBP(e.target.value)}
                className="w-1/2 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Droplets className="w-3 h-3 text-red-500" />
              Blood Sugar (mg/dL)
            </span>
            <input
              type="number"
              placeholder="e.g. 110"
              value={bloodSugar}
              onChange={(e) => setBloodSugar(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Notes & Triggers */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">
          Daily Notes, Triggers & Medications
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Took paracetamol at 9am, shivering reduced after warm soup, felt tired in evening..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-emerald-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Save Journal Entry</span>
        </button>
      </div>
    </form>
  );
};
