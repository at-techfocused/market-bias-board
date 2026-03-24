import { TF_DISPLAY } from '../utils/format';

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
    { label: 'SCORE', value: active.score, color: getSignalColor(active.score), sub: `/ 100 · ${TF_DISPLAY[activeTf]}` },
    { label: 'ADX', value: active.adx ?? '--', color: 'var(--text-body)', sub: adxLabel(active.adx) },
    { label: 'VOL', value: active.volRatio != null ? `${active.volRatio}x` : '--', color: volColor(active.volRatio), sub: volLabel(active.volRatio) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" style={{ padding: '14px 16px' }}>
      {cards.map((card) => (
        <div key={card.label} className="rounded-[7px] py-3 px-3 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            {card.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-body)', marginTop: 4 }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
