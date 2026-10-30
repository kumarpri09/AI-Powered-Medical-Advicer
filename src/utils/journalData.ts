import { JournalEntry } from '../types';

/**
 * Generates 14 realistic sample entries leading up to today
 */
export function getSampleJournalEntries(): JournalEntry[] {
  const now = new Date();
  const entries: JournalEntry[] = [];

  const illnessProgression = [
    { daysAgo: 13, symptom: 'Viral Fever', category: 'Infection', severity: 8, temp: 102.4, notes: 'Sudden onset of fever with body chills and shivering' },
    { daysAgo: 12, symptom: 'Viral Fever', category: 'Infection', severity: 9, temp: 102.8, notes: 'Peak fever, severe body ache and fatigue. Started paracetamol and ORS' },
    { daysAgo: 11, symptom: 'Headache', category: 'Neurology', severity: 7, temp: 101.5, notes: 'Throbbing headache behind eyes, warm fluids helping' },
    { daysAgo: 10, symptom: 'Dry Cough', category: 'Respiratory', severity: 6, temp: 100.8, notes: 'Cough began, throat tickle and scratchy pain' },
    { daysAgo: 9, symptom: 'Dry Cough', category: 'Respiratory', severity: 6, temp: 100.2, notes: 'Steam inhalation twice daily, ginger honey tea' },
    { daysAgo: 8, symptom: 'Body Fatigue', category: 'General', severity: 5, temp: 99.4, notes: 'Fever breaking, feeling drained of energy' },
    { daysAgo: 7, symptom: 'Sore Throat', category: 'ENT', severity: 5, temp: 98.8, notes: 'Warm saline gargles helping with throat irritation' },
    { daysAgo: 6, symptom: 'Headache', category: 'Neurology', severity: 4, notes: 'Mild tension headache in the afternoon after screen work' },
    { daysAgo: 5, symptom: 'Acid Reflux', category: 'Digestive', severity: 4, notes: 'Mild chest acidity after dinner, avoided spicy foods' },
    { daysAgo: 4, symptom: 'Dry Cough', category: 'Respiratory', severity: 3, notes: 'Occasional morning cough, energy levels recovering' },
    { daysAgo: 3, symptom: 'Body Fatigue', category: 'General', severity: 2, notes: 'Went for a 20-min morning walk, felt fresh' },
    { daysAgo: 2, symptom: 'Headache', category: 'Neurology', severity: 2, notes: 'Very light forehead pressure, resolved after hydration' },
    { daysAgo: 1, symptom: 'Normal Checkup', category: 'Wellness', severity: 1, temp: 98.4, notes: 'Normal temperature, appetite fully returned' },
    { daysAgo: 0, symptom: 'Normal Checkup', category: 'Wellness', severity: 1, temp: 98.6, notes: 'Feeling completely back to normal routine' },
  ];

  for (const item of illnessProgression) {
    const d = new Date(now);
    d.setDate(d.getDate() - item.daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = '10:30';

    entries.push({
      id: `sample-entry-${item.daysAgo}`,
      date: dateStr,
      time: timeStr,
      timestamp: d.getTime(),
      symptom: item.symptom,
      category: item.category,
      severity: item.severity,
      temperature: item.temp,
      systolicBP: 120 + Math.floor(Math.sin(item.daysAgo) * 6),
      diastolicBP: 80 + Math.floor(Math.sin(item.daysAgo) * 4),
      notes: item.notes,
      tags: [item.category, item.symptom],
    });
  }

  return entries;
}

export function calculateJournalStats(entries: JournalEntry[]) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      avgSeverity: 0,
      peakSeverity: 0,
      topSymptom: 'None',
      trend: 'stable' as 'improving' | 'worsening' | 'stable',
    };
  }

  const total = entries.length;
  const avg = Number((entries.reduce((acc, curr) => acc + curr.severity, 0) / total).toFixed(1));
  const peak = Math.max(...entries.map((e) => e.severity));

  // Count frequencies
  const freqMap: Record<string, number> = {};
  for (const e of entries) {
    freqMap[e.symptom] = (freqMap[e.symptom] || 0) + 1;
  }
  let topSymptom = entries[0]?.symptom || 'None';
  let topCount = 0;
  for (const [sym, count] of Object.entries(freqMap)) {
    if (count > topCount) {
      topCount = count;
      topSymptom = sym;
    }
  }

  // Trend detection (compare first half to second half of timeline)
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (sorted.length >= 4) {
    const mid = Math.floor(sorted.length / 2);
    const firstHalfAvg = sorted.slice(0, mid).reduce((a, b) => a + b.severity, 0) / mid;
    const secondHalfAvg = sorted.slice(mid).reduce((a, b) => a + b.severity, 0) / (sorted.length - mid);
    if (secondHalfAvg < firstHalfAvg - 0.7) trend = 'improving';
    else if (secondHalfAvg > firstHalfAvg + 0.7) trend = 'worsening';
  }

  return {
    totalEntries: total,
    avgSeverity: avg,
    peakSeverity: peak,
    topSymptom,
    trend,
  };
}
