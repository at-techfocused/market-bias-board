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
  return [
    { label: 'EMA Stack', value: signals.emaStack === 'BULL' ? 20 : signals.emaStack === 'BEAR' ? 0 : 5, max: 20, detail: signals.emaStack },
    { label: 'SMMA 99', value: signals.smma99 === 'ABOVE' ? 20 : 0, max: 20, detail: signals.smma99 },
    { label: 'RSI Zone', value: signals.rsiZone === 'BULLISH' ? 20 : signals.rsiZone === 'BEARISH' ? 0 : 10, max: 20, detail: `${signals.rsi} (${signals.rsiZone})` },
    { label: 'MACD', value: signals.macdDirection === 'BULL' ? 20 : signals.macdDirection === 'BEAR' ? 0 : 10, max: 20, detail: signals.macdDirection },
    { label: 'Pattern', value: signals.pattern ? (signals.pattern.direction === 'BULL' ? 20 : signals.pattern.direction === 'BEAR' ? 0 : 10) : 10, max: 20, detail: signals.pattern ? `${signals.pattern.name} (${signals.pattern.direction})` : 'None' },
  ];
}

function getSignalCards(signals, isBull) {
  if (!signals) return [];
  const cards = [];
  const emaOk = signals.emaStack === (isBull ? 'BULL' : 'BEAR');
  cards.push({ label: 'EMA Stack', status: signals.emaStack, ok: emaOk, color: emaOk ? '#3fb950' : '#f85149' });

  const smmaOk = (signals.smma99 === 'ABOVE') === isBull;
  cards.push({ label: 'SMMA 99', status: signals.smma99, ok: smmaOk, color: smmaOk ? '#3fb950' : '#f85149' });

  const rsiOk = (signals.rsiZone === 'BULLISH') === isBull;
  cards.push({ label: 'RSI', status: `${signals.rsi} ${signals.rsiZone?.toLowerCase()}`, ok: rsiOk, color: rsiOk ? '#3fb950' : '#f85149' });

  if (signals.macd) {
    const macdOk = (signals.macdDirection === 'BULL') === isBull;
    cards.push({ label: 'MACD', status: signals.macdDirection, ok: macdOk, color: macdOk ? '#3fb950' : '#f85149' });
  }

  if (signals.volRatio != null) {
    const volOk = signals.volRatio >= 1.0;
    cards.push({ label: 'Volume', status: `${signals.volRatio}x`, ok: volOk, color: volOk ? '#3fb950' : '#f85149' });
  }

  return cards;
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
  const signalCards = getSignalCards(active, isBull);

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
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>Action Signal</span>
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

      {/* Accent-left headline block */}
      <div className="mx-4 mt-1 rounded-md relative overflow-hidden" style={{ background: 'rgba(17,24,32,0.5)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />
        <div className="pl-4 pr-3 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold tracking-tight" style={{ color, lineHeight: '1.1' }}>
              {actionLabel}
            </span>
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
              <span className="text-[13px] font-bold tabular-nums" style={{ color: agreementColor }}>{agreement}% conf</span>
            </Tooltip>
          </div>
          <div className="text-[11px] mt-1" style={{ color: '#636e7b', lineHeight: '1.3' }}>{description}</div>
        </div>
      </div>

      {/* Score progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-[4px] rounded-full overflow-hidden" style={{ background: '#161e28' }}>
          <div className="h-full rounded-full relative transition-all"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)` }}>
            <div className="absolute right-0 -top-[2px] w-[2px] h-[8px] rounded-sm"
              style={{ background: '#fff', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
          </div>
        </div>

        {/* Compact TF chip row replacing conflict banner */}
        <div className="flex items-center gap-2 mt-2.5">
          {TF_KEYS.filter((t) => t !== activeTf).map((tf) => {
            const sig = signals?.[tf];
            if (!sig) return null;
            const c = getBiasColor(sig.score);
            return (
              <span key={tf} className="text-[10px] font-bold px-2 py-[2px] rounded-[3px] tabular-nums"
                style={{ background: '#0d1219', color: c }}>
                {tf} {sig.score}
              </span>
            );
          })}
          {hasConflict && (
            <span className="text-[10px] font-bold px-2 py-[2px] rounded-[3px]"
              style={{ background: 'rgba(210,153,34,0.08)', color: '#d29922' }}>
              &#9888; Conflict
            </span>
          )}
        </div>
      </div>

      {/* Entry / Stop / Target */}
      <div className="grid grid-cols-3 mx-4 rounded-md overflow-hidden" style={{ background: '#0d1219' }}>
        {[
          { label: 'Entry', value: entry, c: '#cdd9e5', sub: 'market', tip: `Current market price (${activeTf}).` },
          { label: 'Stop', value: stop, c: '#f85149', sub: stopPct != null ? `${stopPct.toFixed(1)}%` : '--', tip: `1.5x ATR (${activeTf}).` },
          { label: 'Target', value: target, c: '#3fb950', sub: targetPct != null ? `${targetPct.toFixed(1)}%` : '--', tip: `3x ATR (${activeTf}), 2:1 R:R.` },
        ].map((item, i) => (
          <Tooltip key={item.label} content={<div><strong>{item.label}</strong>: {item.tip}</div>}>
            <div className="py-3 text-center" style={i < 2 ? { borderRight: '1px solid rgba(30,45,61,0.4)' } : undefined}>
              <div className="text-[9px] tracking-[0.12em] uppercase mb-1 font-semibold" style={{ color: '#4d5768' }}>{item.label}</div>
              <div className="text-[14px] font-bold tabular-nums" style={{ color: item.c }}>${fmtPrice(item.value)}</div>
              <div className="text-[9px] mt-0.5 tabular-nums" style={{ color: '#4d5768' }}>{item.sub}</div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Signal cards — accent-left, replacing checklist */}
      <div className="px-4 pt-3 pb-1">
        <div className="grid grid-cols-2 gap-1.5">
          {signalCards.map((card) => (
            <div key={card.label} className="relative rounded-[4px] overflow-hidden" style={{ background: '#0d1219' }}>
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: card.color }} />
              <div className="flex items-center justify-between pl-3 pr-2.5 py-[7px]">
                <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#8b949e' }}>{card.label}</span>
                <span className="text-[10px] font-bold" style={{ color: card.color }}>{card.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flat metric cards — SCORE, ADX, VOL */}
      <div className="grid grid-cols-3 gap-1.5 px-4 pt-2 pb-3">
        <Tooltip content={
          <div>
            <strong>Score Breakdown &mdash; {activeTf}</strong><br /><br />
            {breakdown.map((b) => (
              <div key={b.label} style={{ color: b.value >= b.max * 0.75 ? '#3fb950' : b.value >= b.max * 0.25 ? '#d29922' : '#f85149' }}>
                {b.label}: <strong>{b.value}/{b.max}</strong> &mdash; {b.detail}
              </div>
            ))}
            <br /><div style={{ color: '#cdd9e5' }}>Total: <strong>{score}/100</strong></div>
          </div>
        }>
          <div className="rounded-md py-2.5 text-center" style={{ background: '#0d1219' }}>
            <div className="text-[9px] tracking-[0.12em] uppercase font-semibold mb-1" style={{ color: '#4d5768' }}>Score</div>
            <div className="text-[18px] font-bold tabular-nums leading-none" style={{ color }}>{score}</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#4d5768' }}>/ 100</div>
          </div>
        </Tooltip>
        <div className="rounded-md py-2.5 text-center" style={{ background: '#0d1219' }}>
          <div className="text-[9px] tracking-[0.12em] uppercase font-semibold mb-1" style={{ color: '#4d5768' }}>ADX</div>
          <div className="text-[18px] font-bold tabular-nums leading-none" style={{ color: '#8b949e' }}>{active.adx ?? '--'}</div>
          <div className="text-[9px] mt-0.5" style={{ color: '#4d5768' }}>trend</div>
        </div>
        <div className="rounded-md py-2.5 text-center" style={{ background: '#0d1219' }}>
          <div className="text-[9px] tracking-[0.12em] uppercase font-semibold mb-1" style={{ color: '#4d5768' }}>Vol</div>
          <div className="text-[18px] font-bold tabular-nums leading-none"
            style={{ color: active.volRatio != null && active.volRatio >= 1.5 ? '#3fb950' : active.volRatio != null && active.volRatio < 0.5 ? '#f85149' : '#d29922' }}>
            {active.volRatio != null ? `${active.volRatio}x` : '--'}
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: '#4d5768' }}>ratio</div>
        </div>
      </div>

      {/* R:R footer */}
      {rr != null && (
        <div className="flex items-center justify-center pb-3 text-[10px] font-bold tabular-nums" style={{ color: '#4d5768' }}>
          R:R <span className="ml-1" style={{ color: '#8b949e' }}>{rr.toFixed(1)}:1</span>
        </div>
      )}
    </div>
  );
}
