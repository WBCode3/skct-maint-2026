import React from 'react';
import { ChartData, TableData } from '../types/exam';

interface DataVisualProps {
  table?: TableData;
  chart?: ChartData;
}

const CHART_COLORS = ['#EA002C', '#334155', '#F47725', '#64748B', '#94A3B8'];

const BarChartSvg: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const width = 560;
  const height = 240;
  const pad = { top: 28, right: 20, bottom: 38, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allValues = chart.series.flatMap((s) => s.values);
  const rawMax = Math.max(...allValues, 1);
  const step = Math.pow(10, Math.floor(Math.log10(rawMax))) / 2;
  const maxVal = Math.ceil((rawMax * 1.12) / step) * step;

  const numGroups = chart.labels.length;
  const numSeries = chart.series.length;
  const groupW = plotW / Math.max(numGroups, 1);
  const barW = Math.min(34, (groupW * 0.72) / Math.max(numSeries, 1));
  const totalBarsW = barW * numSeries + (numSeries - 1) * 4;

  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxHeight: '240px', display: 'block' }}>
      {/* Grid & Y axis */}
      {Array.from({ length: ticks + 1 }).map((_, idx) => {
        const ratio = idx / ticks;
        const y = pad.top + plotH * (1 - ratio);
        const tickVal = Math.round(maxVal * ratio * 10) / 10;
        return (
          <g key={idx}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {tickVal.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke="#94a3b8" strokeWidth={1.2} />
      <line x1={pad.left} y1={pad.top + plotH} x2={width - pad.right} y2={pad.top + plotH} stroke="#94a3b8" strokeWidth={1.2} />

      {/* Bars */}
      {chart.labels.map((label, gIdx) => {
        const groupStart = pad.left + gIdx * groupW + (groupW - totalBarsW) / 2;
        return (
          <g key={gIdx}>
            {chart.series.map((s, sIdx) => {
              const val = s.values[gIdx] ?? 0;
              const barH = (val / maxVal) * plotH;
              const x = groupStart + sIdx * (barW + 4);
              const y = pad.top + plotH - barH;
              const color = CHART_COLORS[sIdx % CHART_COLORS.length];
              return (
                <g key={sIdx}>
                  <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} fill={color} rx={2} />
                  <text
                    x={x + barW / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="600"
                    fill="#1e293b"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
            <text
              x={pad.left + gIdx * groupW + groupW / 2}
              y={pad.top + plotH + 18}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="600"
              fill="#334155"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LineChartSvg: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const width = 560;
  const height = 240;
  const pad = { top: 28, right: 26, bottom: 38, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allValues = chart.series.flatMap((s) => s.values);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues, 1);
  const minVal = rawMin > 0 && rawMin > rawMax * 0.4 ? Math.floor(rawMin * 0.8) : 0;
  const maxVal = Math.ceil(rawMax * 1.1);
  const span = Math.max(maxVal - minVal, 1);

  const count = Math.max(chart.labels.length, 2);
  const getX = (idx: number) =>
    chart.labels.length === 1
      ? pad.left + plotW / 2
      : pad.left + (idx / (count - 1)) * plotW;
  const getY = (val: number) => pad.top + plotH - ((val - minVal) / span) * plotH;

  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxHeight: '240px', display: 'block' }}>
      {Array.from({ length: ticks + 1 }).map((_, idx) => {
        const ratio = idx / ticks;
        const y = pad.top + plotH * (1 - ratio);
        const tickVal = Math.round((minVal + span * ratio) * 10) / 10;
        return (
          <g key={idx}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {tickVal.toLocaleString()}
            </text>
          </g>
        );
      })}

      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke="#94a3b8" strokeWidth={1.2} />
      <line x1={pad.left} y1={pad.top + plotH} x2={width - pad.right} y2={pad.top + plotH} stroke="#94a3b8" strokeWidth={1.2} />

      {chart.labels.map((label, idx) => (
        <text
          key={idx}
          x={getX(idx)}
          y={pad.top + plotH + 18}
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="600"
          fill="#334155"
        >
          {label}
        </text>
      ))}

      {chart.series.map((s, sIdx) => {
        const color = CHART_COLORS[sIdx % CHART_COLORS.length];
        const pts = s.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
        return (
          <g key={sIdx}>
            <polyline fill="none" stroke={color} strokeWidth={2.2} points={pts} />
            {s.values.map((v, i) => {
              const cx = getX(i);
              const cy = getY(v);
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke={color} strokeWidth={2} />
                  <text
                    x={cx}
                    y={cy - 9}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill={color}
                  >
                    {v}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

const PieChartSvg: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const values = chart.series[0]?.values ?? [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = 105;
  const cy = 105;
  const r = 82;

  let cumulative = 0;
  const slices = values.map((val, idx) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += val;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = val / total > 0.5 ? 1 : 0;
    const midAngle = (startAngle + endAngle) / 2;
    const lx = cx + r * 0.62 * Math.cos(midAngle);
    const ly = cy + r * 0.62 * Math.sin(midAngle);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const pct = Math.round((val / total) * 1000) / 10;
    return {
      d,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      label: chart.labels[idx] ?? '',
      val,
      pct,
      lx,
      ly,
    };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 210 210" style={{ width: '195px', height: '195px', flexShrink: 0 }}>
        {slices.map((sl, i) => (
          <g key={i}>
            <path d={sl.d} fill={sl.color} stroke="#ffffff" strokeWidth={2} />
            {sl.pct >= 8 && (
              <text
                x={sl.lx}
                y={sl.ly + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#ffffff"
              >
                {sl.pct}%
              </text>
            )}
          </g>
        ))}
      </svg>
      <table className="dv-table" style={{ width: 'auto', minWidth: '220px' }}>
        <thead>
          <tr>
            <th>항목</th>
            <th>수치</th>
            <th>비중</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((sl, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="legend-swatch" style={{ background: sl.color }} />
                {sl.label}
              </td>
              <td>{sl.val.toLocaleString()}</td>
              <td>{sl.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DataVisual: React.FC<DataVisualProps> = ({ table, chart }) => {
  return (
    <>
      {table && (
        <div className="data-visual-box">
          {(table.title || table.unit) && (
            <div className="dv-header">
              <span className="dv-title">{table.title || '자료 표'}</span>
              {table.unit && <span className="dv-unit">(단위: {table.unit})</span>}
            </div>
          )}
          <div className="dv-table-wrap">
            <table className="dv-table">
              <thead>
                <tr>
                  {table.headers.map((h, idx) => (
                    <th key={idx}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>
                        {typeof cell === 'number' ? cell.toLocaleString() : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.note && <div className="dv-note">※ {table.note}</div>}
        </div>
      )}

      {chart && (
        <div className="data-visual-box">
          <div className="dv-header">
            <span className="dv-title">{chart.title}</span>
            {chart.unit && <span className="dv-unit">(단위: {chart.unit})</span>}
          </div>

          {chart.type === 'bar' && <BarChartSvg chart={chart} />}
          {chart.type === 'line' && <LineChartSvg chart={chart} />}
          {chart.type === 'pie' && <PieChartSvg chart={chart} />}

          {chart.type !== 'pie' && chart.series.length > 1 && (
            <div className="chart-legend">
              {chart.series.map((s, idx) => (
                <span key={idx} className="legend-item">
                  <span
                    className="legend-swatch"
                    style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
          )}
          {chart.note && <div className="dv-note">※ {chart.note}</div>}
        </div>
      )}
    </>
  );
};
