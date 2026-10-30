import React from 'react';
import {
  PhoneCall,
  AlertTriangle,
  X,
  Ambulance,
  HeartCrack,
  Activity,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const EMERGENCY_CONTACTS = [
    { title: 'National Emergency', number: '112', desc: 'All-in-one Police, Fire, Ambulance', icon: ShieldAlert, color: 'from-rose-500 to-red-600' },
    { title: 'Ambulance (Medical)', number: '108', desc: 'Toll-free emergency medical services & transport', icon: Ambulance, color: 'from-red-600 to-rose-700' },
    { title: 'Disaster / Trauma (Alt)', number: '102', desc: 'Maternity, infant & patient transit ambulance', icon: Activity, color: 'from-amber-600 to-orange-600' },
    { title: 'Women Helpline', number: '1091', desc: 'Women safety & crisis assistance', icon: PhoneCall, color: 'from-purple-600 to-indigo-600' },
    { title: 'Mental Health (Tele-MANAS)', number: '14416', desc: 'Free 24x7 psychiatric distress support (Govt of India)', icon: HeartCrack, color: 'from-teal-600 to-emerald-600' },
    { title: 'National Poison Information', number: '1800116117', desc: 'AIIMS Poison emergency helpline (Toll-free)', icon: Flame, color: 'from-blue-600 to-cyan-600' },
  ];

  const RED_FLAGS = [
    'Crushing chest pain, tightness or pressure radiating to left arm, neck, or jaw',
    'Severe breathing difficulty (cannot finish a sentence, lips turning bluish/cyanotic)',
    'Sudden numbness or facial drooping, arm weakness, or slurred speech (Stroke FAST test)',
    'Sudden loss of consciousness, fainting, or prolonged epileptic seizures (>3 mins)',
    'Coughing up blood or vomiting bright red blood / coffee-ground material',
    'High fever (>103°F / 39.5°C) with neck stiffness and sensitivity to light (Meningitis sign)',
    'Deep penetrating wounds, uncontrollable bleeding, or severe chemical/thermal burns',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <PhoneCall className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Emergency & Urgent Care Directory</h2>
              <p className="text-xs text-rose-100">Immediate assistance contacts & life-threatening red flags</p>
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Quick Helplines Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              One-Touch Emergency Dial (Toll-Free)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMERGENCY_CONTACTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={idx}
                    href={`tel:${item.number}`}
                    className="group relative flex items-center p-3.5 rounded-xl border border-slate-200 hover:border-red-300 bg-slate-50/70 hover:bg-red-50/50 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shrink-0 mr-3 shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{item.title}</span>
                        <span className="text-base font-extrabold text-red-600 font-mono tracking-wider ml-2">
                          {item.number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Red Flag Warning Box */}
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>When NOT to wait for chatbot advice: Visit Hospital ER immediately if:</span>
            </div>
            <ul className="space-y-2 text-xs text-rose-900/90 leading-relaxed">
              {RED_FLAGS.map((flag, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold shrink-0">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">Helplines active 24x7 in India & compatible networks</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
