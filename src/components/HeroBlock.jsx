import { TF_KEYS, TF_DISPLAY, getBiasLabel } from '../utils/format';
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

  const allScores = TF_KEYS.map((t) => signals?.[t]?.score).filter((s) => s != null);
  let agreement = 100;
  if (allScores.length >= 2) {
    agreement = Math.max(0, Math.round(100 - (Math.max(...allScores) - Math.min(...allScores))));
  }

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

  const agreementTooltip = (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Timeframe Agreement</div>
      <div style={{ marginBottom: 6 }}>How aligned all timeframes are. 100% = full agreement.</div>
      {TF_KEYS.map((t) => {
        const s = signals?.[t]?.score;
        return s != null ? (
          <div key={t} className="flex items-center justify-between" style={{ padding: '2px 0' }}>
            <span>{TF_DISPLAY[t]}</span>
            <span style={{ fontWeight: 600, color: getSignalColor(s) }}>{s}/100 — {getBiasLabel(s)}</span>
          </div>
        ) : null;
      })}
    </div>
  );

  return (
    <div style={{ padding: '4px 16px 14px' }}>
      {/* Score — clickable for breakdown */}
      <Tooltip content={scoreTooltip}>
        <div className="flex items-baseline gap-1.5">
          <span style={{ fontSize: 56, fontFamily: "'Georgia', serif", fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 24, color: 'var(--text-body)' }}>/100</span>
        </div>
      </Tooltip>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5, marginTop: 8 }}>
        {desc}
      </div>

      {/* Progress bar + agreement */}
      <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
        </div>
        <Tooltip content={agreementTooltip}>
          <span style={{ fontSize: 10, color: 'var(--text-body)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {agreement}% TF agreement
          </span>
        </Tooltip>
      </div>

    </div>
  );
}
