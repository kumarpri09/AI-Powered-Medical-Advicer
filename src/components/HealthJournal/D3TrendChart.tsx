import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { JournalEntry } from '../../types';

interface D3TrendChartProps {
  entries: JournalEntry[];
  selectedSymptomFilter?: string;
  showVitals?: boolean;
}

export const D3TrendChart: React.FC<D3TrendChartProps> = ({
  entries,
  selectedSymptomFilter = 'All',
  showVitals = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<JournalEntry | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Filter and sort entries
  const filteredData = React.useMemo(() => {
    let list = [...entries];
    if (selectedSymptomFilter && selectedSymptomFilter !== 'All') {
      list = list.filter((e) => e.symptom === selectedSymptomFilter);
    }
    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [entries, selectedSymptomFilter]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.length === 0) return;

    const width = containerRef.current.clientWidth || 650;
    const height = 300;
    const margin = { top: 25, right: 30, bottom: 45, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // X Scale: Date
    const dates = filteredData.map((d) => new Date(d.date));
    const minDate = d3.min(dates) || new Date();
    const maxDate = d3.max(dates) || new Date();

    // Add 0.5 day padding to both ends so endpoints don't clip
    const paddedMin = new Date(minDate.getTime() - 12 * 60 * 60 * 1000);
    const paddedMax = new Date(maxDate.getTime() + 12 * 60 * 60 * 1000);

    const xScale = d3
      .scaleTime()
      .domain([paddedMin, paddedMax])
      .range([margin.left, width - margin.right]);

    // Y Scale: Severity (0 to 10)
    const yScale = d3
      .scaleLinear()
      .domain([0, 10])
      .range([height - margin.bottom, margin.top]);

    // Defs: Gradients and Filters
    const defs = svg.append('defs');

    // Severity Area Gradient
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'severity-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.45);
    areaGradient.append('stop').attr('offset', '50%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.25);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.05);

    // Colored Background Severity Bands
    const bands = [
      { y0: 0, y1: 3, color: '#ecfdf5', label: 'Mild (1-3)' },
      { y0: 3, y1: 6, color: '#fffbeb', label: 'Moderate (4-6)' },
      { y0: 6, y1: 8, color: '#fff7ed', label: 'Severe (7-8)' },
      { y0: 8, y1: 10, color: '#fff1f2', label: 'Critical (9-10)' },
    ];

    bands.forEach((band) => {
      svg
        .append('rect')
        .attr('x', margin.left)
        .attr('y', yScale(band.y1))
        .attr('width', width - margin.left - margin.right)
        .attr('height', yScale(band.y0) - yScale(band.y1))
        .attr('fill', band.color)
        .attr('opacity', 0.6);
    });

    // Horizontal Grid Lines
    const yTicks = [2, 4, 6, 8, 10];
    svg
      .append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '2,3');

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(filteredData.length + 1, width > 500 ? 7 : 4))
      .tickFormat((d: any) => d3.timeFormat('%b %d')(d));

    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([0, 2, 4, 6, 8, 10])
      .tickFormat((d) => `${d}`);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-family', 'sans-serif');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('font-family', 'sans-serif');

    // Y Axis Title
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 14)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#64748b')
      .text('Severity (0-10)');

    // D3 Area
    const areaGenerator = d3
      .area<JournalEntry>()
      .x((d) => xScale(new Date(d.date)))
      .y0(height - margin.bottom)
      .y1((d) => yScale(d.severity))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(filteredData)
      .attr('fill', 'url(#severity-area-gradient)')
      .attr('d', areaGenerator);

    // D3 Line
    const lineGenerator = d3
      .line<JournalEntry>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => yScale(d.severity))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', '#0d9488')
      .attr('stroke-width', 3)
      .attr('d', lineGenerator);

    // Temperature Trend Line (Optional Secondary Metric)
    const hasTempData = filteredData.some((d) => d.temperature);
    if (showVitals && hasTempData) {
      const validTempData = filteredData.filter((d) => d.temperature && d.temperature > 95);
      if (validTempData.length >= 2) {
        // Temperature mapped from 97°F to 104°F onto chart scale
        const tempScale = d3
          .scaleLinear()
          .domain([97, 104])
          .range([height - margin.bottom, margin.top]);

        const tempLineGenerator = d3
          .line<JournalEntry>()
          .x((d) => xScale(new Date(d.date)))
          .y((d) => tempScale(d.temperature!))
          .curve(d3.curveMonotoneX);

        svg
          .append('path')
          .datum(validTempData)
          .attr('fill', 'none')
          .attr('stroke', '#f97316')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4')
          .attr('d', tempLineGenerator);
      }
    }

    // Data points (Dots)
    const dotsGroup = svg.append('g').attr('class', 'dots');

    dotsGroup
      .selectAll('circle')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(new Date(d.date)))
      .attr('cy', (d) => yScale(d.severity))
      .attr('r', 5)
      .attr('fill', (d) => {
        if (d.severity >= 8) return '#e11d48'; // Rose-600
        if (d.severity >= 5) return '#f59e0b'; // Amber-500
        if (d.severity >= 3) return '#0ea5e9'; // Sky-500
        return '#10b981'; // Emerald-500
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).transition().duration(150).attr('r', 8);
        const [x, y] = d3.pointer(event, containerRef.current);
        setHoveredEntry(d);
        setTooltipPos({ x, y });
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).transition().duration(150).attr('r', 5);
        setHoveredEntry(null);
        setTooltipPos(null);
      });

    // Vertical hover crosshair line
    const focusLine = svg
      .append('line')
      .attr('class', 'focus-line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    // Interactive Overlay for smooth hover tracking
    svg
      .append('rect')
      .attr('class', 'overlay')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [pointerX, pointerY] = d3.pointer(event);
        const xDate = xScale.invert(pointerX);
        const bisect = d3.bisector((d: JournalEntry) => new Date(d.date)).center;
        const index = bisect(filteredData, xDate);
        const selected = filteredData[index];

        if (selected) {
          const cx = xScale(new Date(selected.date));
          focusLine
            .attr('x1', cx)
            .attr('x2', cx)
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .style('opacity', 1);

          setHoveredEntry(selected);
          const [divX, divY] = d3.pointer(event, containerRef.current);
          setTooltipPos({ x: divX, y: divY });
        }
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        setHoveredEntry(null);
        setTooltipPos(null);
      });
  }, [filteredData, showVitals]);

  if (filteredData.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs">
        No symptom logs available for this filter. Start logging symptoms to see your health trajectory.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
      {/* Legend & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-600"></span>
            <span className="font-semibold text-slate-700">Symptom Severity (0-10)</span>
          </div>
          {showVitals && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-orange-500"></span>
              <span className="text-slate-600 font-medium">Temperature (°F)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Mild (1-3)
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span> Mod (4-6)
          <span className="inline-block w-2 h-2 rounded-full bg-rose-600"></span> Critical (7-10)
        </div>
      </div>

      {/* SVG Canvas */}
      <svg ref={svgRef} className="overflow-visible" />

      {/* Interactive Tooltip Card */}
      {hoveredEntry && tooltipPos && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[210px] transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${Math.max(110, Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 300) - 110))}px`,
            top: `${Math.max(10, tooltipPos.y - 12)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
            <span className="font-bold text-emerald-300">
              {new Date(hoveredEntry.date).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hoveredEntry.severity >= 8
                  ? 'bg-rose-500 text-white'
                  : hoveredEntry.severity >= 5
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              Severity: {hoveredEntry.severity}/10
            </span>
          </div>

          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span>{hoveredEntry.symptom}</span>
            <span className="text-[10px] text-slate-400">({hoveredEntry.category})</span>
          </div>

          {hoveredEntry.temperature && (
            <div className="text-[11px] text-orange-300">
              Temp: <strong className="text-white">{hoveredEntry.temperature}°F</strong>
            </div>
          )}

          {hoveredEntry.systolicBP && (
            <div className="text-[11px] text-sky-300">
              BP: <strong className="text-white">{hoveredEntry.systolicBP}/{hoveredEntry.diastolicBP} mmHg</strong>
            </div>
          )}

          {hoveredEntry.notes && (
            <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800 line-clamp-2">
              "{hoveredEntry.notes}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};
