import React, { useState } from 'react';
import { AlertCircle, X, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="bg-emerald-50/70 border-b border-emerald-100/80 px-3 py-1 flex items-center justify-between text-[11px] text-emerald-800">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          AarogyaAI Medical Advisory: For guidance and first aid only. In medical emergency, call 108/112 immediately.
        </span>
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="underline hover:text-emerald-950 font-semibold text-[10px] ml-2"
        >
          View Full Notice
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 transition-all">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-950">Medical & Health Disclaimer:</strong> AarogyaAI provides informational health assessment, first-aid, and home relief guidance based on your photo, video, audio, or text query. It is <em>not</em> a substitute for professional clinical diagnosis. If experiencing chest pain, severe breathlessness, or trauma, seek emergency medical care immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-950 p-1 hover:bg-amber-200/50 rounded transition-colors shrink-0"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
