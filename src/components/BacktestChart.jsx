import { useMemo, useState } from 'react';
import { getScoreColor } from '../utils/format';

const PADDING = { top: 8, right: 40, bottom: 28, left: 56 };

function formatPrice(val) {
  if (val >= 10000) return val.toFixed(0);
  if (val >= 100) return val.toFixed(1);
  return val.toFixed(2);
}

function formatDate(ts) {
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function BacktestChart({ results, width = 460, height = 200 }) {
  const [hover, setHover] = useState(null);

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const { pricePath, scorePath, scoreAreaPath, priceMin, priceMax, xLabels } = useMemo(() => {
    if (!results || results.length < 2) return {};

    const closes = results.map((r) => r.close);
    const pMin = Math.min(...closes);
    const pMax = Math.max(...closes);
    const pRange = pMax - pMin || 1;

    const xScale = (i) => PADDING.left + (i / (results.length - 1)) * chartW;
    const yPrice = (v) => PADDING.top + (1 - (v - pMin) / pRange) * chartH;
    const yScore = (s) => PADDING.top + (1 - s / 100) * chartH;

    const priceCoords = results.map((r, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yPrice(r.close).toFixed(1)}`);
    const scoreCoords = results.map((r, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScore(r.score).toFixed(1)}`);

    // Score area fill (from 50-line to score)
    const y50 = yScore(50);
    const areaCoords = results.map((r, i) => `${xScale(i).toFixed(1)},${yScore(r.score).toFixed(1)}`);
    const areaBase = results.map((_, i) => `${xScale(results.length - 1 - i).toFixed(1)},${y50.toFixed(1)}`);
    const areaPath = `M${areaCoords.join(' L')} L${areaBase.join(' L')} Z`;

    // X-axis labels (every ~20% of data)
    const labels = [];
    const step = Math.max(1, Math.floor(results.length / 5));
    for (let i = 0; i < results.length; i += step) {
      labels.push({ x: xScale(i), label: formatDate(results[i].time) });
    }

    return {
      pricePath: priceCoords.join(' '),
      scorePath: scoreCoords.join(' '),
      scoreAreaPath: areaPath,
      priceMin: pMin,
      priceMax: pMax,
      xLabels: labels,
    };
  }, [results, chartW, chartH]);

  if (!results || results.length < 2) {
    return (
      <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-body)' }}>
        Not enough data for backtest
      </div>
    );
  }

  const xScale = (i) => PADDING.left + (i / (results.length - 1)) * chartW;
  const yPrice = (v) => {
    const range = priceMax - priceMin || 1;
    return PADDING.top + (1 - (v - priceMin) / range) * chartH;
  };
  const yScore = (s) => PADDING.top + (1 - s / 100) * chartH;

  const hoverData = hover != null ? results[hover] : null;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING.left;
    const idx = Math.round((x / chartW) * (results.length - 1));
    if (idx >= 0 && idx < results.length) setHover(idx);
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width={width} height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Background grid */}
        <line x1={PADDING.left} y1={yScore(50)} x2={width - PADDING.right} y2={yScore(50)}
          stroke="var(--border-inner)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1={PADDING.left} y1={yScore(25)} x2={width - PADDING.right} y2={yScore(25)}
          stroke="var(--border-inner)" strokeWidth="0.3" strokeDasharray="2,4" />
        <line x1={PADDING.left} y1={yScore(75)} x2={width - PADDING.right} y2={yScore(75)}
          stroke="var(--border-inner)" strokeWidth="0.3" strokeDasharray="2,4" />

        {/* Score area fill */}
        <path d={scoreAreaPath} fill="rgba(91,201,138,0.04)" />

        {/* Price line */}
        <path d={pricePath} fill="none" stroke="var(--text-body)" strokeWidth="1.2" opacity="0.5" />

        {/* Score line */}
        <path d={scorePath} fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Left axis labels (price) */}
        <text x={PADDING.left - 4} y={PADDING.top + 4} textAnchor="end"
          style={{ fontSize: 9, fill: 'var(--text-body)', opacity: 0.5 }}>{formatPrice(priceMax)}</text>
        <text x={PADDING.left - 4} y={PADDING.top + chartH + 2} textAnchor="end"
          style={{ fontSize: 9, fill: 'var(--text-body)', opacity: 0.5 }}>{formatPrice(priceMin)}</text>

        {/* Right axis labels (score) */}
        <text x={width - PADDING.right + 4} y={yScore(100) + 3} textAnchor="start"
          style={{ fontSize: 9, fill: 'var(--green)', opacity: 0.6 }}>100</text>
        <text x={width - PADDING.right + 4} y={yScore(50) + 3} textAnchor="start"
          style={{ fontSize: 9, fill: 'var(--amber)', opacity: 0.6 }}>50</text>
        <text x={width - PADDING.right + 4} y={yScore(0) + 3} textAnchor="start"
          style={{ fontSize: 9, fill: 'var(--red)', opacity: 0.6 }}>0</text>

        {/* X-axis labels */}
        {xLabels?.map((l, i) => (
          <text key={i} x={l.x} y={height - 6} textAnchor="middle"
            style={{ fontSize: 9, fill: 'var(--text-body)', opacity: 0.5 }}>{l.label}</text>
        ))}

        {/* Hover crosshair */}
        {hover != null && (
          <>
            <line x1={xScale(hover)} y1={PADDING.top} x2={xScale(hover)} y2={PADDING.top + chartH}
              stroke="var(--text-body)" strokeWidth="0.5" opacity="0.4" />
            <circle cx={xScale(hover)} cy={yPrice(results[hover].close)} r="3"
              fill="var(--text-body)" opacity="0.7" />
            <circle cx={xScale(hover)} cy={yScore(results[hover].score)} r="3"
              fill={getScoreColor(results[hover].score)} />
          </>
        )}
      </svg>

      {/* Hover tooltip */}
      {hoverData && (
        <div style={{
          position: 'absolute', top: 4, left: PADDING.left,
          background: 'rgba(15,25,35,0.92)', border: '1px solid var(--border)',
          borderRadius: 5, padding: '5px 8px', pointerEvents: 'none',
          display: 'flex', gap: 12, fontSize: 10,
        }}>
          <span style={{ color: 'var(--text-body)' }}>{formatDate(hoverData.time)}</span>
          <span style={{ color: 'var(--text-body)' }}>${formatPrice(hoverData.close)}</span>
          <span style={{ color: getScoreColor(hoverData.score), fontWeight: 700 }}>Score {hoverData.score}</span>
          {hoverData.fwdReturn != null && (
            <span style={{ color: hoverData.fwdReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {hoverData.fwdReturn >= 0 ? '+' : ''}{hoverData.fwdReturn.toFixed(2)}%
            </span>
          )}
          {hoverData.pattern && (
            <span style={{ color: 'var(--amber)' }}>{hoverData.pattern}</span>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4, fontSize: 9, color: 'var(--text-body)', opacity: 0.6 }}>
        <span><span style={{ color: 'var(--text-body)' }}>—</span> Price</span>
        <span><span style={{ color: 'var(--green)' }}>—</span> Bias Score</span>
      </div>
    </div>
  );
}
