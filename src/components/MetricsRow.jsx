import { TF_DISPLAY } from '../utils/format';
import Tooltip from './Tooltip';

function getSignalColor(score) {
  if (score == null) return 'var(--amber)';
  if (score <= 40) return 'var(--red)';
  if (score >= 60) return 'var(--green)';
  return 'var(--amber)';
}

function adxLabel(adx) {
  if (adx == null) return '--';
  if (adx < 20) return 'weak trend';
  if (adx < 40) return 'moderate trend';
  return 'strong trend';
}

function volLabel(ratio) {
  if (ratio == null) return '--';
  if (ratio < 0.8) return 'low conv.';
  if (ratio < 1.2) return 'average';
  return 'confirmed';
}

function volColor(ratio) {
  if (ratio == null) return 'var(--text-body)';
  if (ratio >= 1.5) return 'var(--green)';
  if (ratio < 0.5) return 'var(--red)';
  return 'var(--amber)';
}

export default function MetricsRow({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const cards = [
    {
      label: 'SCORE', value: active.score, color: getSignalColor(active.score),
      sub: `/ 100 · ${TF_DISPLAY[activeTf]}`,
      tip: <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Composite Score</div>Weighted sum of EMA stack (20), SMMA 99 (20), RSI zone (20), MACD direction (20), and pattern (20). Click the hero score above for full breakdown.</div>,
    },
    {
      label: 'ADX', value: active.adx ?? '--', color: 'var(--text-body)',
      sub: adxLabel(active.adx),
      tip: <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Average Directional Index</div>Measures trend strength regardless of direction. Below 20 = weak/ranging, 20–40 = moderate trend, above 40 = strong trend. Does not indicate bullish or bearish.</div>,
    },
    {
      label: 'VOL', value: active.volRatio != null ? `${active.volRatio}x` : '--',
      color: volColor(active.volRatio), sub: volLabel(active.volRatio),
      tip: <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Volume Ratio</div>Current volume vs 20-period average. Below 0.8x = low conviction, 0.8–1.2x = average, above 1.5x = high conviction confirming the move.</div>,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" style={{ padding: '14px 16px' }}>
      {cards.map((card) => (
        <Tooltip key={card.label} content={card.tip}>
          <div className="rounded-[7px] py-3 px-3 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-body)', marginTop: 4 }}>{card.sub}</div>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
