import { getScoreColor } from '../utils/format';

export default function Sparkline({ points, width = 80, height = 24 }) {
  if (!points || points.length < 2) return null;

  const scores = points.map((p) => p.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;

  const coords = scores.map((s, i) => ({
    x: (i / (scores.length - 1)) * width,
    y: height - ((s - min) / range) * height,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const lastScore = scores[scores.length - 1];
  const color = getScoreColor(lastScore);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* 50-line reference */}
      <line x1="0" y1={height - ((50 - min) / range) * height} x2={width} y2={height - ((50 - min) / range) * height}
        stroke="var(--border-inner)" strokeWidth="0.5" strokeDasharray="2,2" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current dot */}
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2" fill={color} />
    </svg>
  );
}
