import { TF_DISPLAY } from '../utils/format';

function getSignalColor(score) {
  if (score == null) return 'var(--amber)';
  if (score <= 40) return 'var(--red)';
  if (score >= 60) return 'var(--green)';
  return 'var(--amber)';
}

function valColor(label, val) {
  if (val == null) return 'var(--text-body)';
  switch (label) {
    case 'RSI':
      if (val > 55) return 'var(--green)';
      if (val < 45) return 'var(--red)';
      return 'var(--amber)';
    case 'MACD':
      return val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--amber)';
    case 'VOL':
      if (val >= 1.5) return 'var(--green)';
      if (val < 0.5) return 'var(--red)';
      return 'var(--amber)';
    case 'ATR%':
      return 'var(--text-body)';
    case 'BB%':
      if (val > 80) return 'var(--green)';
      if (val < 20) return 'var(--red)';
      return 'var(--amber)';
    case 'SCORE':
      return getSignalColor(val);
    default:
      return 'var(--text-body)';
  }
}

export default function SignalCardsGrid({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const cards = [
    { label: 'RSI', value: active.rsi, sub: active.rsiZone?.toLowerCase() || '--' },
    { label: 'MACD', value: active.macd?.histogram != null ? (active.macd.histogram > 0 ? '+' : '') + active.macd.histogram.toFixed(4) : '--', raw: active.macd?.histogram, sub: active.macdDirection?.toLowerCase() || '--' },
    { label: 'VOL', value: active.volRatio != null ? `${active.volRatio}x` : '--', raw: active.volRatio, sub: 'vs 20-avg' },
    { label: 'ATR%', value: active.atrPct != null ? `${active.atrPct}%` : '--', raw: active.atrPct, sub: 'range' },
    { label: 'BB%', value: active.bbPct != null ? `${active.bbPct}%` : '--', raw: active.bbPct, sub: 'position' },
    { label: 'SCORE', value: active.score, sub: TF_DISPLAY[activeTf] },
  ];

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <span style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          SIGNAL CARDS · {TF_DISPLAY[activeTf]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {cards.map((card) => {
          const colorVal = card.raw !== undefined ? card.raw : card.value;
          const color = valColor(card.label, typeof colorVal === 'string' ? parseFloat(colorVal) || null : colorVal);
          return (
            <div key={card.label} className="rounded-[7px] py-3 px-2 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.07em', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-body)', marginTop: 4 }}>{card.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
