import Tooltip from './Tooltip';

function fmt(val) {
  if (val == null) return '--';
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: val > 1000 ? 2 : 3 });
}

function getBiasLabel(score) {
  if (score == null) return 'NEUTRAL';
  if (score <= 40) return 'BEARISH';
  if (score >= 60) return 'BULLISH';
  return 'NEUTRAL';
}

function getBiasColor(score) {
  if (score == null) return '#636e7b';
  if (score <= 40) return '#f85149';
  if (score >= 60) return '#3fb950';
  return '#d29922';
}

function getActionLabel(score, hasConflict) {
  // Cap at BIAS level when conflict exists
  if (hasConflict) {
    if (score <= 20) return 'BEAR BIAS';
    if (score <= 45) return 'BEAR BIAS';
    if (score <= 55) return 'NEUTRAL';
    if (score >= 56) return 'BULL BIAS';
    return 'NEUTRAL';
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
    case 'STRONG LONG': return 'High conviction bullish. All indicators aligned, full R.';
    default: return '';
  }
}

const TF_KEYS = ['1H', '4H', 'D'];
const TF_DISPLAY = { '1H': '1H', '4H': '4H', D: 'DAILY' };

function buildChecks(signals, tf, isBull) {
  const checks = [];
  if (!signals) return checks;

  const stackDesc = signals.emaStack === 'BULL'
    ? 'Full bull stack: price>EMA20>50>100>200'
    : signals.emaStack === 'BEAR'
    ? 'Full bear stack: price<EMA20<50<100<200'
    : 'EMA stack mixed';
  checks.push({ tf, ok: signals.emaStack === (isBull ? 'BULL' : 'BEAR'), text: stackDesc });

  checks.push({ tf, ok: (signals.score > 50) === isBull, text: `Score ${signals.score}/100` });

  if (signals.macd) {
    const macdBull = signals.macdDirection === 'BULL';
    checks.push({
      tf, ok: macdBull === isBull,
      text: `MACD ${macdBull ? 'bullish' : 'bearish'}, histogram ${signals.macd.histogram > 0 ? 'expanding' : 'contracting'}`,
    });
  }

  checks.push({
    tf, ok: (signals.rsiZone === 'BULLISH') === isBull,
    text: `RSI ${signals.rsi} \u2014 ${signals.rsiZone.toLowerCase()}`,
  });

  if (signals.volRatio != null) {
    checks.push({
      tf, ok: signals.volRatio >= 1.0,
      text: `Vol ${signals.volRatio}x \u2014 ${signals.volRatio >= 1.5 ? 'confirmed' : signals.volRatio >= 1.0 ? 'above avg' : 'below avg'}`,
    });
  }

  return checks;
}

export default function CompositeScore({ activeTf, onTfChange, signals, lastFetch }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const score = active.score;

  // Conflict detection across 4H and D
  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  const actionLabel = getActionLabel(score, hasConflict);
  const description = getDescription(actionLabel);
  const isBull = score > 50;
  const color = getBiasColor(score);
  const glow = score <= 40 ? 'rgba(248,81,73,0.12)' : score >= 60 ? 'rgba(63,185,80,0.12)' : 'rgba(210,153,34,0.12)';

  // Entry/Stop/Target from active TF
  const close = active.close;
  const atr = active.atr;
  const entry = close;
  const stop = atr != null ? (isBull ? close - atr * 1.5 : close + atr * 1.5) : null;
  const target = atr != null ? (isBull ? close + atr * 3 : close - atr * 3) : null;
  const stopPct = stop != null ? Math.abs((stop - entry) / entry * 100) : null;
  const targetPct = target != null ? Math.abs((target - entry) / entry * 100) : null;
  const rr = stopPct != null && stopPct > 0 ? (targetPct / stopPct) : null;

  // TF Agreement
  const allScores = TF_KEYS.map((t) => signals?.[t]?.score).filter((s) => s != null);
  let agreement = 100;
  if (allScores.length >= 2) {
    const maxDiff = Math.max(...allScores) - Math.min(...allScores);
    agreement = Math.max(0, Math.round(100 - maxDiff));
  }
  const agreementColor = agreement >= 70 ? '#3fb950' : agreement >= 40 ? '#d29922' : '#f85149';

  const fetchTime = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const adxVal = active.adx;
  const volVal = active.volRatio;

  // Checklist: active TF full items, other TFs condensed to 1-line summaries
  const activeChecks = buildChecks(active, activeTf, isBull);
  const otherTfs = TF_KEYS.filter((t) => t !== activeTf);
  const otherSummaries = otherTfs.map((tf) => {
    const sig = signals?.[tf];
    if (!sig) return null;
    const checks = buildChecks(sig, tf, isBull);
    const okCount = checks.filter((c) => c.ok).length;
    const tfColor = getBiasColor(sig.score);
    const tfBias = getBiasLabel(sig.score);
    return { tf, bias: tfBias, score: sig.score, okCount, total: checks.length, color: tfColor };
  }).filter(Boolean);

  return (
    <div>
      {/* Full-width TF tabs — primary control */}
      <div className="grid grid-cols-3" style={{ borderBottom: '2px solid #1e2d3d' }}>
        {TF_KEYS.map((tf) => {
          const isActive = tf === activeTf;
          const tfSig = signals?.[tf];
          const tfColor = tfSig ? getBiasColor(tfSig.score) : '#636e7b';
          return (
            <button
              key={tf}
              onClick={() => onTfChange(tf)}
              className="text-[12px] font-bold tracking-[0.1em] uppercase transition-colors"
              style={{
                padding: '10px 0',
                background: isActive ? '#1e2d3d' : 'transparent',
                color: isActive ? '#00d4ff' : '#3d4a57',
                borderBottom: isActive ? '2px solid #00d4ff' : '2px solid transparent',
                borderRight: tf !== 'D' ? '1px solid #1e2d3d' : 'none',
                cursor: 'pointer',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? '#00d4ff' : 'transparent',
                minHeight: 36,
              }}
            >
              {TF_DISPLAY[tf]}
              {tfSig && (
                <span className="ml-1.5 text-[10px]" style={{ color: isActive ? tfColor : '#3d4a57' }}>
                  {tfSig.score}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Signal header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
            Action Signal
          </span>
          <Tooltip content={
            <div>
              <strong>Action Signal</strong> reflects the selected timeframe.
              <br />
              Entry/Stop/Target calculated from {activeTf} ATR.
              {hasConflict && <><br /><span style={{ color: '#d29922' }}>Signal capped at BIAS level due to timeframe conflict.</span></>}
            </div>
          }>
            <span className="text-[10px] cursor-pointer" style={{ color: '#3d4a57' }}>&#9432;</span>
          </Tooltip>
        </div>
        <span className="text-[10px] tracking-[0.06em]" style={{ color: '#3d4a57' }}>
          {fetchTime}
        </span>
      </div>

      {/* Main signal + TF Agreement side by side */}
      <div className="px-4 pb-3" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div
              className="text-[26px] font-bold leading-none tracking-tight"
              style={{ color, textShadow: `0 0 24px ${glow}` }}
            >
              {actionLabel}
            </div>
            <div className="text-[10px] leading-snug mt-1.5" style={{ color: '#8b949e' }}>
              {description}
            </div>
          </div>

          {/* TF Agreement — prominent */}
          <Tooltip content={
            <div>
              <strong>TF Agreement</strong>: {agreement}%
              <br />
              How aligned all timeframes are. 100% = full agreement, 0% = full conflict.
              <br />
              {TF_KEYS.map((t) => {
                const s = signals?.[t]?.score;
                return s != null ? <div key={t} style={{ color: getBiasColor(s) }}>{t}: {s}/100</div> : null;
              })}
            </div>
          }>
            <div className="shrink-0 text-center" style={{ minWidth: 72 }}>
              <div className="text-[24px] font-bold leading-none" style={{ color: agreementColor }}>
                {agreement}%
              </div>
              <div className="text-[9px] tracking-[0.1em] uppercase font-semibold mt-1" style={{ color: '#3d4a57' }}>
                TF Agree
              </div>
              <div className="w-full h-[5px] rounded overflow-hidden mt-1.5" style={{ background: '#161e28' }}>
                <div className="h-full rounded" style={{ width: `${agreement}%`, background: agreementColor }} />
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Context strip for other TFs */}
        <div className="flex items-center gap-3 mt-2.5">
          {otherTfs.map((tf) => {
            const sig = signals?.[tf];
            if (!sig) return null;
            const tfColor = getBiasColor(sig.score);
            return (
              <div key={tf} className="flex items-center gap-1.5 text-[10px]">
                <span className="font-bold" style={{ color: '#3d4a57' }}>[{tf}]</span>
                <span className="font-bold" style={{ color: tfColor }}>{getBiasLabel(sig.score)}</span>
                <span style={{ color: '#3d4a57' }}>{sig.score}/100</span>
              </div>
            );
          })}
        </div>

        {/* Conflict badge */}
        {hasConflict && (
          <div
            className="mt-2.5 px-3 py-2 rounded flex items-center gap-2 text-[10px] tracking-wide leading-relaxed"
            style={{ background: '#3d2e0a', border: '1px solid #d29922', color: '#d29922' }}
          >
            <span className="text-[11px]">&#9888;</span>
            <span>
              <strong>Conflict</strong> &mdash; 4H {h4Score >= 50 ? 'bull' : 'bear'}, Daily {dScore >= 50 ? 'bull' : 'bear'}. Signal capped.
            </span>
          </div>
        )}

        {/* Score bar */}
        <div className="mt-2.5 h-[5px] rounded overflow-hidden" style={{ background: '#161e28' }}>
          <div
            className="h-full rounded relative"
            style={{
              width: `${score}%`,
              background: 'linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)',
            }}
          >
            <div
              className="absolute right-0 -top-[2px] w-[2px] h-[9px] rounded-sm"
              style={{ background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
            />
          </div>
        </div>
      </div>

      {/* Entry / Stop / Target */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <Tooltip content={<div><strong>Entry</strong>: Current market price ({activeTf}).</div>}>
          <div className="py-2.5 text-center" style={{ borderRight: '1px solid #1e2d3d' }}>
            <div className="text-[9px] tracking-[0.1em] uppercase mb-0.5 font-semibold" style={{ color: '#636e7b' }}>Entry</div>
            <div className="text-[14px] font-bold" style={{ color: '#cdd9e5' }}>${fmt(entry)}</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#636e7b' }}>market</div>
          </div>
        </Tooltip>
        <Tooltip content={<div><strong>Stop</strong>: 1.5x ATR ({activeTf}).</div>}>
          <div className="py-2.5 text-center" style={{ borderRight: '1px solid #1e2d3d' }}>
            <div className="text-[9px] tracking-[0.1em] uppercase mb-0.5 font-semibold" style={{ color: '#636e7b' }}>Stop</div>
            <div className="text-[14px] font-bold" style={{ color: '#f85149' }}>${fmt(stop)}</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#636e7b' }}>{stopPct != null ? `${stopPct.toFixed(1)}%` : '--'}</div>
          </div>
        </Tooltip>
        <Tooltip content={<div><strong>Target</strong>: 3x ATR ({activeTf}), 2:1 R:R.</div>}>
          <div className="py-2.5 text-center">
            <div className="text-[9px] tracking-[0.1em] uppercase mb-0.5 font-semibold" style={{ color: '#636e7b' }}>Target</div>
            <div className="text-[14px] font-bold" style={{ color: '#3fb950' }}>${fmt(target)}</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#636e7b' }}>{targetPct != null ? `${targetPct.toFixed(1)}%` : '--'}</div>
          </div>
        </Tooltip>
      </div>

      {/* Stats badges */}
      <div className="flex items-center gap-1.5 px-4 py-2 flex-wrap" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#1a2332', color: '#cdd9e5', border: '1px solid #1e2d3d' }}>
          R:R {rr != null ? `${rr.toFixed(1)}:1` : '--'}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#1a2332', color, border: '1px solid #1e2d3d' }}>
          SCORE {score}/100
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#1a2332', color: '#cdd9e5', border: '1px solid #1e2d3d' }}>
          ADX {adxVal ?? '--'}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#1a2332', color: volVal != null && volVal >= 1.5 ? '#3fb950' : '#cdd9e5', border: '1px solid #1e2d3d' }}>
          VOL {volVal != null ? `${volVal}x` : '--'}
        </span>
      </div>

      {/* Checklist: active TF items + 1-line summaries for others */}
      <div className="px-4 py-2.5">
        {activeChecks.map((c, i) => (
          <div key={i} className="flex items-start gap-1.5 py-[2px]">
            <span className="text-[9px] font-bold shrink-0 mt-[2px] px-1 rounded" style={{ color: '#636e7b', background: '#1a2332' }}>
              {activeTf}
            </span>
            <span className="text-[11px] shrink-0" style={{ color: c.ok ? '#3fb950' : '#f85149' }}>
              {c.ok ? '\u2713' : '\u2717'}
            </span>
            <span className="text-[10px] leading-snug" style={{ color: c.ok ? '#cdd9e5' : '#636e7b' }}>
              {c.text}
            </span>
          </div>
        ))}

        {/* Other TF summaries — one line each */}
        {otherSummaries.length > 0 && (
          <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid #1e2d3d' }}>
            {otherSummaries.map((s) => (
              <div key={s.tf} className="flex items-center gap-1.5 py-[2px] text-[10px]">
                <span className="font-bold shrink-0 px-1 rounded" style={{ color: '#636e7b', background: '#1a2332' }}>
                  {s.tf}
                </span>
                <span className="font-bold" style={{ color: s.color }}>{s.bias}</span>
                <span style={{ color: '#3d4a57' }}>{s.score}/100</span>
                <span style={{ color: '#636e7b' }}>
                  &mdash; {s.okCount}/{s.total} signals aligned
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
