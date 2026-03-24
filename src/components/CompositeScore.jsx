import Tooltip from './Tooltip';
import { getBiasLabel, getBiasColor, fmtPrice, TF_KEYS, TF_DISPLAY } from '../utils/format';

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
  switch (label) {
    case 'STRONG SHORT': return 'High conviction bearish. Short on bounces, trail stop tight.';
    case 'SHORT BIAS': return 'Indicators lean bearish. Tighten longs, favor short setups.';
    case 'LEAN SHORT': return 'Slight bearish edge. Small positions, wait for confirmation.';
    case 'NEUTRAL': return 'Mixed signals. Monitor closely, avoid sizing in.';
    case 'LEAN LONG': return 'Slight bullish edge. Small positions, scale with confirmation.';
    case 'BULL BIAS': return 'Indicators lean bullish. Favor long setups, scale in with R.';
    case 'BEAR BIAS': return 'Indicators lean bearish. Favor short setups, tight risk.';
    case 'STRONG LONG': return 'High conviction bullish. All indicators aligned, full R.';
    default: return '';
  }
}

function getScoreBreakdown(signals) {
  if (!signals) return [];
  const items = [];
  items.push({ label: 'EMA Stack', value: signals.emaStack === 'BULL' ? 20 : signals.emaStack === 'BEAR' ? 0 : 5, max: 20, detail: signals.emaStack });
  items.push({ label: 'SMMA 99', value: signals.smma99 === 'ABOVE' ? 20 : 0, max: 20, detail: signals.smma99 });
  items.push({ label: 'RSI Zone', value: signals.rsiZone === 'BULLISH' ? 20 : signals.rsiZone === 'BEARISH' ? 0 : 10, max: 20, detail: `${signals.rsi} (${signals.rsiZone})` });
  items.push({ label: 'MACD', value: signals.macdDirection === 'BULL' ? 20 : signals.macdDirection === 'BEAR' ? 0 : 10, max: 20, detail: signals.macdDirection });
  const patVal = signals.pattern ? (signals.pattern.direction === 'BULL' ? 20 : signals.pattern.direction === 'BEAR' ? 0 : 10) : 10;
  items.push({ label: 'Pattern', value: patVal, max: 20, detail: signals.pattern ? `${signals.pattern.name} (${signals.pattern.direction})` : 'None' });
  return items;
}

function buildChecks(signals, tf, isBull) {
  if (!signals) return [];
  const checks = [];
  const stackDesc = signals.emaStack === 'BULL' ? 'Full bull stack: price>EMA20>50>100>200'
    : signals.emaStack === 'BEAR' ? 'Full bear stack: price<EMA20<50<100<200' : 'EMA stack mixed';
  checks.push({ ok: signals.emaStack === (isBull ? 'BULL' : 'BEAR'), text: stackDesc });
  checks.push({ ok: (signals.score > 50) === isBull, text: `Trend score strong: ${signals.score}/100` });
  if (signals.macd) {
    const macdBull = signals.macdDirection === 'BULL';
    checks.push({ ok: macdBull === isBull, text: `MACD ${macdBull ? 'bullish' : 'bearish'} + histogram ${signals.macd.histogram > 0 ? 'expanding' : 'contracting'}` });
  }
  checks.push({ ok: (signals.rsiZone === 'BULLISH') === isBull, text: `RSI ${signals.rsi} \u2014 ${signals.rsiZone.toLowerCase()} zone` });
  if (signals.volRatio != null) {
    checks.push({ ok: signals.volRatio >= 1.0, text: `Vol ${signals.volRatio}x avg \u2014 ${signals.volRatio >= 1.5 ? 'conviction confirmed' : signals.volRatio >= 1.0 ? 'above avg' : 'below avg'}` });
  }
  return checks;
}

// Chip component for tag row
function Chip({ children, color, bg, border, tooltip }) {
  const chip = (
    <span className="text-[10px] font-bold px-2 py-[3px] rounded-[4px] tracking-wide whitespace-nowrap"
      style={{ background: bg || '#0d1219', color: color || '#8b949e', border: border ? `1px solid ${border}` : undefined }}>
      {children}
    </span>
  );
  return tooltip ? <Tooltip content={tooltip}>{chip}</Tooltip> : chip;
}

export default function CompositeScore({ activeTf, onTfChange, signals, lastFetch }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const score = active.score;
  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  const actionLabel = getActionLabel(score, hasConflict);
  const description = getDescription(actionLabel);
  const isBull = score > 50;
  const color = getBiasColor(score);
  const glow = score <= 40 ? 'rgba(248,81,73,0.12)' : score >= 60 ? 'rgba(63,185,80,0.12)' : 'rgba(210,153,34,0.12)';

  const close = active.close;
  const atr = active.atr;
  const entry = close;
  const stop = atr != null ? (isBull ? close - atr * 1.5 : close + atr * 1.5) : null;
  const target = atr != null ? (isBull ? close + atr * 3 : close - atr * 3) : null;
  const stopPct = stop != null ? Math.abs((stop - entry) / entry * 100) : null;
  const targetPct = target != null ? Math.abs((target - entry) / entry * 100) : null;
  const rr = stopPct != null && stopPct > 0 ? (targetPct / stopPct) : null;

  const allScores = TF_KEYS.map((t) => signals?.[t]?.score).filter((s) => s != null);
  let agreement = 100;
  if (allScores.length >= 2) {
    agreement = Math.max(0, Math.round(100 - (Math.max(...allScores) - Math.min(...allScores))));
  }
  const agreementColor = agreement >= 70 ? '#3fb950' : agreement >= 40 ? '#d29922' : '#f85149';

  const fetchTime = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const breakdown = getScoreBreakdown(active);
  const activeChecks = buildChecks(active, activeTf, isBull);
  const otherTfs = TF_KEYS.filter((t) => t !== activeTf);
  const otherSummaries = otherTfs.map((tf) => {
    const sig = signals?.[tf];
    if (!sig) return null;
    const checks = buildChecks(sig, tf, isBull);
    return { tf, bias: getBiasLabel(sig.score), score: sig.score, okCount: checks.filter((c) => c.ok).length, total: checks.length, color: getBiasColor(sig.score) };
  }).filter(Boolean);

  return (
    <div>
      {/* TF Tabs */}
      <div className="grid grid-cols-3">
        {TF_KEYS.map((tf) => {
          const isActive = tf === activeTf;
          const tfSig = signals?.[tf];
          const tfColor = tfSig ? getBiasColor(tfSig.score) : '#4d5768';
          return (
            <button key={tf} onClick={() => onTfChange(tf)}
              className="text-[12px] font-bold tracking-[0.1em] uppercase transition-all"
              style={{
                padding: '10px 0',
                background: isActive ? '#111820' : 'transparent',
                color: isActive ? '#00d4ff' : '#3d4a57',
                border: 'none',
                borderBottom: `2px solid ${isActive ? '#00d4ff' : 'rgba(30,45,61,0.4)'}`,
                cursor: 'pointer',
              }}>
              {TF_DISPLAY[tf]}
              {tfSig && <span className="ml-1.5 text-[10px]" style={{ color: isActive ? tfColor : '#3d4a57' }}>{tfSig.score}</span>}
            </button>
          );
        })}
      </div>

      {/* Header strip */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>Action Signal</span>
          <Tooltip content={
            <div>
              <strong>Action Signal</strong> reflects the selected timeframe.<br />
              Entry/Stop/Target calculated from {activeTf} ATR.
              {hasConflict && <><br /><span style={{ color: '#d29922' }}>Signal capped at BIAS level due to timeframe conflict.</span></>}
            </div>
          }>
            <span className="text-[10px] cursor-pointer" style={{ color: '#3d4a57' }}>&#9432;</span>
          </Tooltip>
        </div>
        <span className="text-[10px] tracking-[0.06em] tabular-nums" style={{ color: '#3d4a57' }}>{fetchTime}</span>
      </div>

      {/* Action label + Agreement */}
      <div className="px-5 pb-1">
        <div className="flex items-start justify-between gap-4">
          <div className="text-[28px] font-bold leading-none tracking-tight" style={{ color, textShadow: `0 0 20px ${glow}` }}>
            {actionLabel}
          </div>
          <Tooltip content={
            <div>
              <strong>TF Agreement</strong>: {agreement}%<br />
              How aligned all timeframes are. 100% = full agreement.<br />
              {TF_KEYS.map((t) => {
                const s = signals?.[t]?.score;
                return s != null ? <div key={t} style={{ color: getBiasColor(s) }}>{t}: {s}/100</div> : null;
              })}
            </div>
          }>
            <div className="shrink-0 text-right">
              <div className="text-[26px] font-bold leading-none tabular-nums" style={{ color: agreementColor }}>{agreement}%</div>
              <div className="text-[9px] tracking-[0.1em] uppercase font-semibold mt-0.5" style={{ color: '#4d5768' }}>confidence</div>
            </div>
          </Tooltip>
        </div>
        <div className="text-[11px] leading-normal mt-1.5" style={{ color: '#636e7b' }}>{description}</div>
      </div>

      {/* Score progress bar */}
      <div className="px-5 pt-2 pb-4">
        <div className="h-[4px] rounded-full overflow-hidden" style={{ background: '#161e28' }}>
          <div className="h-full rounded-full relative transition-all"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)` }}>
            <div className="absolute right-0 -top-[2px] w-[2px] h-[8px] rounded-sm"
              style={{ background: '#fff', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
          </div>
        </div>

        {/* Other TF context */}
        <div className="flex items-center gap-3 mt-3">
          {otherTfs.map((tf) => {
            const sig = signals?.[tf];
            if (!sig) return null;
            return (
              <div key={tf} className="flex items-center gap-1 text-[10px]">
                <span className="font-bold" style={{ color: '#4d5768' }}>[{tf}]</span>
                <span className="font-bold" style={{ color: getBiasColor(sig.score) }}>{getBiasLabel(sig.score)}</span>
                <span style={{ color: '#3d4a57' }}>{sig.score}</span>
              </div>
            );
          })}
        </div>

        {/* Conflict — accent-left pattern */}
        {hasConflict && (
          <div className="mt-3 rounded-md relative overflow-hidden" style={{ background: 'rgba(210,153,34,0.06)' }}>
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: '#d29922' }} />
            <div className="flex items-center gap-2 px-3 pl-4 py-2 text-[10px] tracking-wide" style={{ color: '#d29922' }}>
              <span className="text-[11px]">&#9888;</span>
              <span><strong>Conflict</strong> &mdash; 4H {h4Score >= 50 ? 'bull' : 'bear'}, Daily {dScore >= 50 ? 'bull' : 'bear'}. Signal capped.</span>
            </div>
          </div>
        )}
      </div>

      {/* Entry / Stop / Target */}
      <div className="grid grid-cols-3 mx-5 mb-4 rounded-md overflow-hidden" style={{ background: '#0d1219' }}>
        {[
          { label: 'Entry', value: entry, c: '#cdd9e5', sub: 'market', tip: `Current market price (${activeTf}).` },
          { label: 'Stop', value: stop, c: '#f85149', sub: stopPct != null ? `${stopPct.toFixed(1)}%` : '--', tip: `1.5x ATR (${activeTf}).` },
          { label: 'Target', value: target, c: '#3fb950', sub: targetPct != null ? `${targetPct.toFixed(1)}%` : '--', tip: `3x ATR (${activeTf}), 2:1 R:R.` },
        ].map((item, i) => (
          <Tooltip key={item.label} content={<div><strong>{item.label}</strong>: {item.tip}</div>}>
            <div className="py-3.5 text-center" style={i < 2 ? { borderRight: '1px solid rgba(30,45,61,0.4)' } : undefined}>
              <div className="text-[9px] tracking-[0.12em] uppercase mb-1 font-semibold" style={{ color: '#4d5768' }}>{item.label}</div>
              <div className="text-[15px] font-bold tabular-nums" style={{ color: item.c }}>${fmtPrice(item.value)}</div>
              <div className="text-[9px] mt-0.5 tabular-nums" style={{ color: '#4d5768' }}>{item.sub}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Chip row — tag pattern */}
      <div className="flex items-center gap-1.5 px-5 pb-3 flex-wrap">
        <Chip color="#8b949e">R:R {rr != null ? `${rr.toFixed(1)}:1` : '--'}</Chip>
        <Chip color={color} tooltip={
          <div>
            <strong>Score Breakdown &mdash; {activeTf}</strong><br /><br />
            {breakdown.map((b) => (
              <div key={b.label} style={{ color: b.value >= b.max * 0.75 ? '#3fb950' : b.value >= b.max * 0.25 ? '#d29922' : '#f85149' }}>
                {b.label}: <strong>{b.value}/{b.max}</strong> &mdash; {b.detail}
              </div>
            ))}
            <br /><div style={{ color: '#cdd9e5' }}>Total: <strong>{score}/100</strong></div>
          </div>
        }>SCORE {score}/100</Chip>
        <Chip color="#8b949e">ADX {active.adx ?? '--'}</Chip>
        <Chip color={active.volRatio != null && active.volRatio >= 1.5 ? '#3fb950' : '#8b949e'}>
          VOL {active.volRatio != null ? `${active.volRatio}x` : '--'}
        </Chip>
      </div>

      {/* Checklist */}
      <div className="px-5 pt-1 pb-3">
        {activeChecks.map((c, i) => (
          <div key={i} className="flex items-start gap-2 py-[3px]">
            <span className="text-[11px] shrink-0 mt-px" style={{ color: c.ok ? '#3fb950' : '#f85149' }}>
              {c.ok ? '\u2713' : '\u2717'}
            </span>
            <span className="text-[11px] leading-snug" style={{ color: c.ok ? '#cdd9e5' : '#4d5768' }}>
              {c.text}
            </span>
          </div>
        ))}

        {otherSummaries.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(30,45,61,0.4)' }}>
            {otherSummaries.map((s) => (
              <div key={s.tf} className="flex items-center gap-2 py-[2px] text-[10px]">
                <span className="font-bold px-1.5 rounded-[3px]" style={{ color: '#4d5768', background: '#0d1219' }}>{s.tf}</span>
                <span className="font-bold" style={{ color: s.color }}>{s.bias}</span>
                <span style={{ color: '#3d4a57' }}>{s.score}/100</span>
                <span style={{ color: '#4d5768' }}>&mdash; {s.okCount}/{s.total} aligned</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
