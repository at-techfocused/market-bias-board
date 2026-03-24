import { TF_DISPLAY } from '../utils/format';
import Tooltip from './Tooltip';

function valColor(label, val) {
  if (val == null) return 'var(--text-body)';
  switch (label) {
    case 'RSI':
      if (val > 55) return 'var(--green)';
      if (val < 45) return 'var(--red)';
      return 'var(--amber)';
    case 'MACD':
      return val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--amber)';
    case 'ATR%':
      return 'var(--text-body)';
    case 'BB%':
      if (val > 80) return 'var(--green)';
      if (val < 20) return 'var(--red)';
      return 'var(--amber)';
    default:
      return 'var(--text-body)';
  }
}

export default function SignalCardsGrid({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const cards = [
    {
      label: 'RSI', value: active.rsi, sub: active.rsiZone?.toLowerCase() || '--',
      tip: 'Relative Strength Index (14). Measures momentum on a 0–100 scale. Above 70 = overbought, below 30 = oversold.',
    },
    {
      label: 'MACD',
      value: active.macd?.histogram != null ? (active.macd.histogram > 0 ? '+' : '') + active.macd.histogram.toFixed(4) : '--',
      raw: active.macd?.histogram, sub: active.macdDirection?.toLowerCase() || '--',
      tip: 'MACD Histogram (12/26/9). Positive & expanding = bullish momentum. Negative & contracting = bearish momentum fading.',
    },
    {
      label: 'ATR%',
      value: active.atrPct != null ? `${active.atrPct}%` : '--',
      raw: active.atrPct, sub: 'range',
      tip: 'Average True Range as % of price. Measures volatility. Higher = wider swings. Used to calculate stop (1.5× ATR) and target (3× ATR).',
    },
    {
      label: 'BB%',
      value: active.bbPct != null ? `${active.bbPct}%` : '--',
      raw: active.bbPct, sub: 'position',
      tip: 'Bollinger Band position. 0% = at lower band, 100% = at upper band. Above 80% = stretched high, below 20% = stretched low.',
    },
  ];

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
        SIGNAL CARDS · {TF_DISPLAY[activeTf]}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => {
          const colorVal = card.raw !== undefined ? card.raw : card.value;
          const color = valColor(card.label, typeof colorVal === 'string' ? parseFloat(colorVal) || null : colorVal);
          return (
            <Tooltip key={card.label} content={
              <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{card.label}</div>{card.tip}</div>
            }>
              <div className="rounded-[7px] py-3 px-3 text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.07em', marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-body)', marginTop: 4 }}>{card.sub}</div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
