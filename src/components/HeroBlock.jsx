import { TF_DISPLAY } from '../utils/format';
import Tooltip from './Tooltip';

function getActionLabel(score, hasConflict) {
  if (hasConflict) {
    if (score <= 45) return 'BEAR BIAS';
    if (score <= 55) return 'NEUTRAL';
    return 'BULL BIAS';
  }
  if (score <= 20) return 'STRONG SHORT';
  if (score <= 35) return 'SHORT BIAS';
  if (score <= 45) return 'LEAN SHORT';
  if (score <= 55) return 'NEUTRAL';
  if (score <= 65) return 'LEAN LONG';
  return 'STRONG LONG';
}

function getDescription(label) {
  const map = {
    'STRONG SHORT': 'High conviction bearish. Short on bounces, trail stop tight.',
    'SHORT BIAS': 'Indicators lean bearish. Tighten longs, favor short setups.',
    'LEAN SHORT': 'Slight bearish edge. Small positions, wait for confirmation.',
    'NEUTRAL': 'Mixed signals. Monitor closely, avoid sizing in.',
    'LEAN LONG': 'Slight bullish edge. Small positions, scale with confirmation.',
    'BULL BIAS': 'Indicators lean bullish. Favor long setups, scale in with R.',
    'BEAR BIAS': 'Indicators lean bearish. Favor short setups, tight risk management.',
    'STRONG LONG': 'High conviction bullish. All indicators aligned, full R.',
  };
  return map[label] || '';
}

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

function getBreakdown(signals) {
  if (!signals) return [];
  return [
    { label: 'EMA Stack', value: signals.emaStack === 'BULL' ? 20 : signals.emaStack === 'BEAR' ? 0 : 5, max: 20, detail: signals.emaStack },
    { label: 'SMMA 99', value: signals.smma99 === 'ABOVE' ? 20 : 0, max: 20, detail: signals.smma99 },
    { label: 'RSI Zone', value: signals.rsiZone === 'BULLISH' ? 20 : signals.rsiZone === 'BEARISH' ? 0 : 10, max: 20, detail: `${signals.rsi} (${signals.rsiZone})` },
    { label: 'MACD', value: signals.macdDirection === 'BULL' ? 20 : signals.macdDirection === 'BEAR' ? 0 : 10, max: 20, detail: signals.macdDirection },
    { label: 'Pattern', value: signals.pattern ? (signals.pattern.direction === 'BULL' ? 20 : signals.pattern.direction === 'BEAR' ? 0 : 10) : 10, max: 20, detail: signals.pattern ? signals.pattern.name : 'None' },
  ];
}

export default function HeroBlock({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const score = active.score;
  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  const label = getActionLabel(score, hasConflict);
  const desc = getDescription(label);
  const color = getSignalColor(score);
  const breakdown = getBreakdown(active);

  const scoreTooltip = (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Score Breakdown — {TF_DISPLAY[activeTf]}</div>
      {breakdown.map((b) => (
        <div key={b.label} className="flex items-center justify-between" style={{ padding: '2px 0' }}>
          <span>{b.label}</span>
          <span style={{ fontWeight: 600, color: b.value >= b.max * 0.75 ? 'var(--green)' : b.value >= b.max * 0.25 ? 'var(--amber)' : 'var(--red)' }}>
            {b.value}/{b.max} — {b.detail}
          </span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border-inner)', marginTop: 6, paddingTop: 6, fontWeight: 700, color: 'var(--text-primary)' }}>
        Total: {score}/100
      </div>
    </div>
  );

  const metrics = [
    {
      label: 'SCORE', value: score, color: getSignalColor(score),
      sub: `/ 100 · ${TF_DISPLAY[activeTf]}`,
      tip: scoreTooltip,
    },
    {
      label: 'ADX', value: active.adx ?? '--', color: 'var(--text-body)',
      sub: adxLabel(active.adx),
      tip: <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Average Directional Index</div>Measures trend strength regardless of direction. Below 20 = weak/ranging, 20–40 = moderate trend, above 40 = strong trend.</div>,
    },
    {
      label: 'VOL', value: active.volRatio != null ? `${active.volRatio}x` : '--',
      color: volColor(active.volRatio), sub: volLabel(active.volRatio),
      tip: <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Volume Ratio</div>Current volume vs 20-period average. Below 0.8x = low conviction, 0.8–1.2x = average, above 1.5x = high conviction.</div>,
    },
  ];

  return (
    <div style={{ padding: '4px 16px 14px' }}>
      {/* Metrics row: SCORE, ADX, VOL */}
      <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 10 }}>
        {metrics.map((m) => (
          <Tooltip key={m.label} content={m.tip}>
            <div className="rounded-[7px] py-3 px-3 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-body)', marginTop: 4 }}>{m.sub}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>
        {desc}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 10 }}>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
        </div>
      </div>

      {/* Conflict warning */}
      {hasConflict && (() => {
        const h4Side = h4Score >= 50 ? 'bullish' : 'bearish';
        const dSide = dScore >= 50 ? 'bullish' : 'bearish';
        return (
          <div className="flex items-start gap-2" style={{ marginTop: 10 }}>
            <span style={{ color: 'var(--amber)', fontSize: 14, lineHeight: 1 }}>!</span>
            <span style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.5 }}>
              Conflict — 4H {h4Side}, Daily {dSide}. Await resolution before sizing in.
            </span>
          </div>
        );
      })()}
    </div>
  );
}
