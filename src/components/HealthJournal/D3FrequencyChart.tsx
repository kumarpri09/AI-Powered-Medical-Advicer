import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { JournalEntry } from '../../types';

interface D3FrequencyChartProps {
  entries: JournalEntry[];
  selectedSymptomFilter: string;
  onSelectSymptom: (symptom: string) => void;
}

export const D3FrequencyChart: React.FC<D3FrequencyChartProps> = ({
  entries,
  selectedSymptomFilter,
  onSelectSymptom,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Compute frequencies and average severity per symptom
  const frequencyData = React.useMemo(() => {
    const map: Record<string, { count: number; totalSeverity: number; category: string }> = {};
    for (const e of entries) {
      if (!map[e.symptom]) {
        map[e.symptom] = { count: 0, totalSeverity: 0, category: e.category };
      }
      map[e.symptom].count += 1;
      map[e.symptom].totalSeverity += e.severity;
    }

    return Object.entries(map)
      .map(([symptom, val]) => ({
        symptom,
        count: val.count,
        avgSeverity: Number((val.totalSeverity / val.count).toFixed(1)),
        category: val.category,
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || frequencyData.length === 0) return;

    const width = containerRef.current.clientWidth || 550;
    const barHeight = 36;
    const margin = { top: 15, right: 45, bottom: 25, left: 110 };
    const height = Math.max(160, frequencyData.length * barHeight + margin.top + margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Y Scale: Symptoms (band)
    const yScale = d3
      .scaleBand()
      .domain(frequencyData.map((d) => d.symptom))
      .range([margin.top, height - margin.bottom])
      .padding(0.28);

    // X Scale: Count (linear)
    const maxCount = d3.max(frequencyData, (d) => d.count) || 5;
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(maxCount, 4)])
      .nice()
      .range([margin.left, width - margin.right]);

    // Defs for gradient
    const defs = svg.append('defs');
    const barGradient = defs
      .append('linearGradient')
      .attr('id', 'freq-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    barGradient.append('stop').attr('offset', '0%').attr('stop-color', '#14b8a6');
    barGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0d9488');

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(maxCount, 6))
      .tickFormat((d) => `${d}`);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#94a3b8')
      .selectAll('text')
      .style('font-size', '10px');

    const yAxis = d3.axisLeft(yScale).tickSize(0);

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#334155');

    // Render Bars
    svg
      .selectAll('.bar')
      .data(frequencyData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d) => yScale(d.symptom) || 0)
      .attr('x', margin.left)
      .attr('height', yScale.bandwidth())
      .attr('width', 0)
      .attr('rx', 6)
      .attr('fill', (d) => (d.symptom === selectedSymptomFilter ? '#0f766e' : 'url(#freq-bar-gradient)'))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onSelectSymptom(d.symptom === selectedSymptomFilter ? 'All' : d.symptom);
      })
      .transition()
      .duration(600)
      .attr('width', (d) => xScale(d.count) - margin.left);

    // Count and severity text labels inside/beside bars
    svg
      .selectAll('.count-label')
      .data(frequencyData)
      .enter()
      .append('text')
      .attr('class', 'count-label')
      .attr('x', (d) => xScale(d.count) + 8)
      .attr('y', (d) => (yScale(d.symptom) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', '#0f766e')
      .text((d) => `${d.count}x (Avg Sev: ${d.avgSeverity})`);
  }, [frequencyData, selectedSymptomFilter]);

  if (frequencyData.length === 0) return null;

  return (
    <div ref={containerRef} className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Symptom Frequency Distribution
          </h4>
          <p className="text-[11px] text-slate-500">
            Click any bar to filter the trend timeline above
          </p>
        </div>
        {selectedSymptomFilter !== 'All' && (
          <button
            type="button"
            onClick={() => onSelectSymptom('All')}
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <svg ref={svgRef} className="overflow-visible" />
    </div>
  );
};
