import { TF_KEYS, TF_DISPLAY } from '../utils/format';

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

  const allScores = TF_KEYS.map((t) => signals?.[t]?.score).filter((s) => s != null);
  let agreement = 100;
  if (allScores.length >= 2) {
    agreement = Math.max(0, Math.round(100 - (Math.max(...allScores) - Math.min(...allScores))));
  }

  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Eyebrow */}
      <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
        <div className="w-[5px] h-[5px] rounded-full" style={{ background: color }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
          {label} · {TF_DISPLAY[activeTf]}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5">
        <span style={{ fontSize: 52, fontFamily: "'Georgia', serif", fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 20, color: 'var(--text-body)' }}>/100</span>
      </div>

      {/* Description */}
      <div style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.5, marginTop: 8 }}>
        {desc}
      </div>

      {/* Progress bar + agreement */}
      <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
        <div className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-body)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {agreement}% TF agreement
        </span>
      </div>
    </div>
  );
}
