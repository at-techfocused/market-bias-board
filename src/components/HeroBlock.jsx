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

function buildReasoning(signals) {
  if (!signals) return 'Awaiting data.';

  const bull = [];
  const bear = [];
  const neutral = [];

  // EMA Stack
  if (signals.emaStack === 'BULL') bull.push('EMA stack bullish aligned');
  else if (signals.emaStack === 'BEAR') bear.push('EMA stack bearish aligned');
  else neutral.push('EMA stack mixed');

  // SMMA
  if (signals.smma99 === 'ABOVE') bull.push('price above SMMA 99');
  else bear.push('price below SMMA 99');

  // RSI
  if (signals.rsiZone === 'BULLISH') bull.push(`RSI bullish at ${signals.rsi}`);
  else if (signals.rsiZone === 'BEARISH') bear.push(`RSI bearish at ${signals.rsi}`);
  else neutral.push(`RSI neutral at ${signals.rsi}`);

  // MACD
  if (signals.macdDirection === 'BULL') bull.push('MACD bullish crossover');
  else if (signals.macdDirection === 'BEAR') bear.push('MACD bearish crossover');
  else neutral.push('MACD neutral');

  // Pattern
  if (signals.pattern) {
    if (signals.pattern.direction === 'BULL') bull.push(`${signals.pattern.name} pattern`);
    else if (signals.pattern.direction === 'BEAR') bear.push(`${signals.pattern.name} pattern`);
    else neutral.push(`${signals.pattern.name} (neutral)`);
  }

  const parts = [];
  if (bull.length > 0) parts.push(bull.join(', '));
  if (bear.length > 0) parts.push((bull.length > 0 ? 'but ' : '') + bear.join(', '));
  if (neutral.length > 0 && parts.length === 0) parts.push(neutral.join(', '));

  const score = signals.score;
  let prefix;
  if (score >= 80) prefix = 'Strong bullish conviction —';
  else if (score >= 60) prefix = 'Bullish lean —';
  else if (score <= 20) prefix = 'Strong bearish conviction —';
  else if (score <= 40) prefix = 'Bearish lean —';
  else prefix = 'Mixed signals —';

  return `${prefix} ${parts.join('; ')}.`;
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

export default function HeroBlock({ signals, activeTf, tickerName, tickerShort }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const score = active.score;
  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  const label = getActionLabel(score, hasConflict);
  const reasoning = buildReasoning(active);
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
      {/* Ticker identity */}
      {tickerName && (
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{tickerShort || tickerName}</span>
          {tickerShort && tickerName !== tickerShort && (
            <span style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5 }}>{tickerName}</span>
          )}
        </div>
      )}
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

      {/* Action label + reasoning */}
      <div style={{ marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color }}>{label}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.5, opacity: 0.8 }}>
        {reasoning}
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
