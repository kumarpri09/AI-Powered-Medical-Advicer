import React, { useState } from 'react';
import {
  CalendarHeart,
  X,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus,
  Download,
  Trash2,
  Sparkles,
  BarChart3,
  List,
  RefreshCw,
  Thermometer,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { JournalEntry, Language } from '../../types';
import { D3TrendChart } from './D3TrendChart';
import { D3FrequencyChart } from './D3FrequencyChart';
import { SymptomEntryForm } from './SymptomEntryForm';
import { calculateJournalStats, getSampleJournalEntries } from '../../utils/journalData';

interface HealthJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onLoadSampleData: () => void;
  onClearAllEntries: () => void;
  onAskAIAboutTrends: (summaryText: string) => void;
  currentLanguage: Language;
}

export const HealthJournalModal: React.FC<HealthJournalModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
  onDeleteEntry,
  onLoadSampleData,
  onClearAllEntries,
  onAskAIAboutTrends,
  currentLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'history'>('trends');
  const [isLoggingNew, setIsLoggingNew] = useState(false);
  const [symptomFilter, setSymptomFilter] = useState<string>('All');
  const [showVitalsOverlay, setShowVitalsOverlay] = useState(true);

  if (!isOpen) return null;

  const stats = calculateJournalStats(entries);

  // Unique list of logged symptoms for filtering
  const uniqueSymptoms = ['All', ...Array.from(new Set(entries.map((e) => e.symptom)))];

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Date', 'Time', 'Symptom', 'Category', 'Severity (1-10)', 'Temperature (°F)', 'Systolic BP', 'Diastolic BP', 'Blood Sugar (mg/dL)', 'Notes'];
    const rows = entries.map((e) => [
      e.date,
      e.time,
      `"${e.symptom}"`,
      `"${e.category}"`,
      e.severity,
      e.temperature || '',
      e.systolicBP || '',
      e.diastolicBP || '',
      e.bloodSugar || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Health_Journal_Log_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAskAI = () => {
    const summary = `Here is my recent Health Journal trend data over ${entries.length} logged entries:
- Average Severity: ${stats.avgSeverity}/10
- Peak Severity: ${stats.peakSeverity}/10
- Most Frequent Symptom: ${stats.topSymptom}
- Overall Trajectory: ${stats.trend}
- Recent Log Details:
${entries
  .slice(-6)
  .map(
    (e) =>
      `• Date: ${e.date} | ${e.symptom} (Severity: ${e.severity}/10)${
        e.temperature ? `, Temp: ${e.temperature}°F` : ''
      }${e.notes ? ` - Notes: "${e.notes}"` : ''}`
  )
  .join('\n')}

Based on these symptoms over time, please provide clinical health insights, recovery trajectory analysis, self-care suggestions, and advise whether I should consult a doctor.`;

    onAskAIAboutTrends(summary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <CalendarHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Health Journal & Symptom Tracker</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-emerald-100">
                  D3 Interactive Visualization
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Log daily symptoms, track recovery curves, and spot health trends over time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Stats Pill Counters */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs py-0.5">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Logs</span>
              <span className="font-bold text-slate-800 text-sm">{stats.totalEntries}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg Severity</span>
              <span className={`font-bold text-sm ${stats.avgSeverity >= 7 ? 'text-rose-600' : stats.avgSeverity >= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {stats.avgSeverity}/10
              </span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Top Symptom</span>
              <span className="font-bold text-slate-800 text-sm truncate max-w-[100px] block">
                {stats.topSymptom}
              </span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Trend</span>
                <span className="font-bold text-xs capitalize text-slate-700 flex items-center gap-1">
                  {stats.trend === 'improving' && (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Improving</span>
                    </>
                  )}
                  {stats.trend === 'worsening' && (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-rose-700">Worsening</span>
                    </>
                  )}
                  {stats.trend === 'stable' && (
                    <>
                      <Minus className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-sky-700">Stable</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isLoggingNew && (
              <button
                type="button"
                onClick={() => setIsLoggingNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Log Symptom</span>
              </button>
            )}

            {entries.length > 0 && (
              <button
                type="button"
                onClick={handleAskAI}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02]"
                title="Send journal trends to AarogyaAI for personalized medical insights"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">AI Trend Analysis</span>
                <span className="sm:hidden">Analyze</span>
              </button>
            )}

            {entries.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                title="Export Journal to CSV spreadsheet"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-2 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('trends');
                setIsLoggingNew(false);
              }}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'trends' && !isLoggingNew
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>D3 Trend Charts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setIsLoggingNew(false);
              }}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'history' && !isLoggingNew
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Log History ({entries.length})</span>
            </button>
          </div>

          {/* Quick Symptom filter selector for D3 */}
          {activeTab === 'trends' && !isLoggingNew && uniqueSymptoms.length > 2 && (
            <div className="flex items-center gap-1.5 pb-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Filter:</span>
              <select
                aria-label="Filter chart by symptom"
                value={symptomFilter}
                onChange={(e) => setSymptomFilter(e.target.value)}
                className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 font-semibold outline-none cursor-pointer"
              >
                {uniqueSymptoms.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-5">
          {/* If Logging Form is active */}
          {isLoggingNew ? (
            <SymptomEntryForm
              onSaveEntry={(entry) => {
                onSaveEntry(entry);
                setIsLoggingNew(false);
                setActiveTab('trends');
              }}
              onCancel={() => setIsLoggingNew(false)}
            />
          ) : activeTab === 'trends' ? (
            /* D3 Visualizations Tab */
            <div className="space-y-5">
              {entries.length === 0 ? (
                /* Empty state with Load Sample Demo button */
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 p-8 space-y-4 max-w-lg mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CalendarHeart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">No Journal Entries Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Start logging your daily symptoms or load our realistic 14-day sample recovery log to see the interactive D3 chart visualizations immediately.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLoggingNew(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Log First Symptom
                    </button>
                    <button
                      type="button"
                      onClick={onLoadSampleData}
                      className="w-full sm:w-auto px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold transition-all"
                    >
                      Load 14-Day Sample Recovery Log
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Primary D3 Trend Chart */}
                  <D3TrendChart
                    entries={entries}
                    selectedSymptomFilter={symptomFilter}
                    showVitals={showVitalsOverlay}
                  />

                  {/* Secondary D3 Frequency Bar Chart */}
                  <D3FrequencyChart
                    entries={entries}
                    selectedSymptomFilter={symptomFilter}
                    onSelectSymptom={(sym) => setSymptomFilter(sym)}
                  />

                  {/* Clinical Insights Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 border border-emerald-200/80 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                        Health Trend Summary
                      </span>
                      <p className="font-medium text-slate-700">
                        {stats.trend === 'improving'
                          ? `Your symptom severity has decreased from peak (${stats.peakSeverity}/10) toward mild levels. Continue adequate hydration and rest.`
                          : stats.trend === 'worsening'
                          ? `Your symptom frequency or severity has increased recently. Consider consulting a doctor if symptoms persist.`
                          : `Symptom severity has remained steady. Keep logging daily changes to monitor patterns.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAskAI}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all whitespace-nowrap shrink-0"
                    >
                      Ask Doctor AI About This →
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Log History Tab */
            <div className="space-y-3">
              {entries.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No log entries yet. Click "Log Symptom" to record your first entry.
                </div>
              ) : (
                [...entries]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{entry.symptom}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {entry.category}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              entry.severity >= 8
                                ? 'bg-rose-100 text-rose-700'
                                : entry.severity >= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Severity: {entry.severity}/10
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            {new Date(entry.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at {entry.time}
                          </span>

                          {entry.temperature && (
                            <span className="flex items-center gap-1 text-orange-600 font-semibold">
                              <Thermometer className="w-3 h-3" />
                              {entry.temperature}°F
                            </span>
                          )}

                          {entry.systolicBP && (
                            <span className="flex items-center gap-1 text-sky-600 font-semibold">
                              <Activity className="w-3 h-3" />
                              {entry.systolicBP}/{entry.diastolicBP} mmHg
                            </span>
                          )}
                        </div>

                        {entry.notes && (
                          <p className="text-xs text-slate-600 italic pt-1">"{entry.notes}"</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadSampleData}
              className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Load Sample 14-Day Log
            </button>
            {entries.length > 0 && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all journal entries?')) {
                      onClearAllEntries();
                    }
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600"
                >
                  Clear All Data
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Close Journal
          </button>
        </div>
      </div>
    </div>
  );
};
