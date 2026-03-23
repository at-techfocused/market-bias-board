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

function getActionLabel(score) {
  if (score <= 20) return 'STRONG SHORT';
  if (score <= 35) return 'SHORT BIAS';
  if (score <= 45) return 'LEAN SHORT';
  if (score <= 55) return 'NEUTRAL';
  if (score <= 65) return 'LEAN LONG';
  if (score <= 80) return 'STRONG LONG';
  return 'STRONG LONG';
}

function getDescription(label) {
  switch (label) {
    case 'STRONG SHORT': return 'High conviction bearish. Short on bounces. Trail stop tight.';
    case 'SHORT BIAS': return 'Majority of indicators bearish. Lean short, tighten any longs.';
    case 'LEAN SHORT': return 'Slight bearish edge. Small positions only, wait for confirmation.';
    case 'NEUTRAL': return 'Mixed signals. Monitor closely, avoid sizing in.';
    case 'LEAN LONG': return 'Slight bullish edge. Small positions, scale in with confirmation.';
    case 'STRONG LONG': return 'High conviction. All indicators aligned bullish. Scale in with full R.';
    default: return '';
  }
}

const TF_LABELS = { '1H': '1H', '4H': '4H', D: 'D' };

function buildChecks(signals, tf, isBull) {
  const checks = [];
  if (!signals) return checks;

  const stackDesc = signals.emaStack === 'BULL'
    ? 'Full bull stack: price>EMA20>EMA50>EMA100>EMA200'
    : signals.emaStack === 'BEAR'
    ? 'Full bear stack: price<EMA20<EMA50<EMA100<EMA200'
    : 'EMA stack mixed \u2014 no clear alignment';
  checks.push({ tf, ok: signals.emaStack === (isBull ? 'BULL' : 'BEAR'), text: stackDesc });

  checks.push({ tf, ok: (signals.score > 50) === isBull, text: `Trend score ${isBull ? 'strong' : 'weak'}: ${signals.score}/100` });

  if (signals.macd) {
    const macdBull = signals.macdDirection === 'BULL';
    checks.push({
      tf,
      ok: macdBull === isBull,
      text: `MACD ${macdBull ? 'bullish' : 'bearish'} + histogram ${signals.macd.histogram > 0 ? 'expanding' : 'contracting'}`,
    });
  }

  checks.push({
    tf,
    ok: (signals.rsiZone === 'BULLISH') === isBull,
    text: `RSI ${signals.rsi} \u2014 ${signals.rsiZone.toLowerCase()} zone`,
  });

  if (signals.volRatio != null) {
    checks.push({
      tf,
      ok: signals.volRatio >= 1.0,
      text: `Volume ${signals.volRatio}x avg \u2014 ${signals.volRatio >= 1.5 ? 'conviction confirmed' : signals.volRatio >= 1.0 ? 'above average' : 'below average'}`,
    });
  }

  return checks;
}

export default function CompositeScore({ activeTf, onTfChange, signals, lastFetch }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const score = active.score;
  const actionLabel = getActionLabel(score);
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

  // Other TFs for context
  const otherTfs = ['1H', '4H', 'D'].filter((t) => t !== activeTf);

  // TF Agreement: 100 - max score difference between any two TFs
  const allScores = ['1H', '4H', 'D'].map((t) => signals?.[t]?.score).filter((s) => s != null);
  let agreement = 100;
  if (allScores.length >= 2) {
    const maxDiff = Math.max(...allScores) - Math.min(...allScores);
    agreement = Math.max(0, Math.round(100 - maxDiff));
  }
  const agreementColor = agreement >= 70 ? '#3fb950' : agreement >= 40 ? '#d29922' : '#f85149';

  // Conflict detection
  const h4Score = signals?.['4H']?.score;
  const dScore = signals?.D?.score;
  const hasConflict = h4Score != null && dScore != null &&
    ((h4Score < 50 && dScore > 50) || (h4Score > 50 && dScore < 50));

  const fetchTime = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  // ADX & VOL from active
  const adxVal = active.adx;
  const volVal = active.volRatio;

  // Build checklist grouped by TF
  const activeChecks = buildChecks(active, activeTf, isBull);
  const otherChecks = otherTfs.flatMap((tf) => buildChecks(signals?.[tf], tf, isBull));

  return (
    <div>
      {/* Header with TF toggle */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
            Action Signal
          </span>
          <Tooltip content={
            <div>
              <strong>Action Signal</strong> reflects the selected timeframe's indicators.
              <br />
              Toggle between 1H, 4H, and Daily to see each timeframe's signal independently.
              <br />
              <span style={{ color: '#8b949e' }}>Entry/Stop/Target are calculated from the active timeframe's ATR.</span>
            </div>
          }>
            <span className="text-[11px] cursor-pointer" style={{ color: '#3d4a57' }}>&#9432;</span>
          </Tooltip>

          {/* TF toggle pills */}
          <div className="flex items-center gap-1 ml-2">
            {['1H', '4H', 'D'].map((tf) => {
              const isActive = tf === activeTf;
              return (
                <button
                  key={tf}
                  onClick={() => onTfChange(tf)}
                  className="text-[10px] font-bold px-2.5 py-[3px] rounded tracking-wide transition-colors"
                  style={{
                    background: isActive ? '#1e2d3d' : 'transparent',
                    color: isActive ? '#00d4ff' : '#3d4a57',
                    border: `1px solid ${isActive ? '#00d4ff' : '#1e2d3d'}`,
                    cursor: 'pointer',
                  }}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-[11px] tracking-[0.06em]" style={{ color: '#3d4a57' }}>
          {fetchTime}
        </span>
      </div>

      {/* Main action signal */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div
              className="text-[28px] font-bold leading-tight tracking-tight mb-1"
              style={{ color, textShadow: `0 0 24px ${glow}` }}
            >
              {actionLabel}
            </div>
            <div className="text-[12px] leading-relaxed" style={{ color: '#8b949e' }}>
              {description}
            </div>
          </div>

          {/* TF Agreement meter */}
          <Tooltip content={
            <div>
              <strong>Timeframe Agreement</strong>: {agreement}%
              <br />
              Measures how aligned all timeframes are (0% = full conflict, 100% = full agreement).
              <br />
              {allScores.map((s, i) => (
                <div key={i} style={{ color: getBiasColor(s) }}>
                  {['1H', '4H', 'D'].filter((t) => signals?.[t]?.score != null)[i]}: {s}/100
                </div>
              ))}
            </div>
          }>
            <div className="text-right shrink-0">
              <div className="text-[10px] tracking-[0.1em] uppercase font-semibold mb-1" style={{ color: '#3d4a57' }}>
                TF Agreement
              </div>
              <div className="w-[60px] h-[6px] rounded overflow-hidden" style={{ background: '#161e28' }}>
                <div className="h-full rounded" style={{ width: `${agreement}%`, background: agreementColor }} />
              </div>
              <div className="text-[11px] font-bold mt-1" style={{ color: agreementColor }}>
                {agreement}%
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Context strip for other timeframes */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {otherTfs.map((tf) => {
            const sig = signals?.[tf];
            if (!sig) return null;
            const tfColor = getBiasColor(sig.score);
            const tfBias = getBiasLabel(sig.score);
            return (
              <div key={tf} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#636e7b' }}>
                <span className="font-bold tracking-wide" style={{ color: '#3d4a57' }}>[{tf}]</span>
                <span className="font-bold" style={{ color: tfColor }}>{tfBias}</span>
                <span style={{ color: '#3d4a57' }}>{sig.score}/100</span>
              </div>
            );
          })}
        </div>

        {/* Conflict badge (inside action signal) */}
        {hasConflict && (
          <div
            className="mt-2.5 px-3 py-2 rounded flex items-center gap-2 text-[11px] tracking-wide leading-relaxed"
            style={{ background: '#3d2e0a', border: '1px solid #d29922', color: '#d29922' }}
          >
            <span className="text-[12px]">&#9888;</span>
            <div>
              <strong>Timeframe Conflict</strong> &mdash; 4H {h4Score >= 50 ? 'bullish' : 'bearish'}, Daily {dScore >= 50 ? 'bullish' : 'bearish'}. Await resolution.
            </div>
          </div>
        )}

        {/* Score bar */}
        <div className="mt-3 h-[6px] rounded overflow-hidden" style={{ background: '#161e28' }}>
          <div
            className="h-full rounded relative"
            style={{
              width: `${score}%`,
              background: 'linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)',
            }}
          >
            <div
              className="absolute right-0 -top-[2px] w-[3px] h-[10px] rounded-sm"
              style={{ background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.6)' }}
            />
          </div>
        </div>
      </div>

      {/* Entry / Stop / Target */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <Tooltip content={<div><strong>Entry</strong>: Current market price for the {activeTf} timeframe.</div>}>
          <div className="py-3 text-center" style={{ borderRight: '1px solid #1e2d3d' }}>
            <div className="text-[10px] tracking-[0.1em] uppercase mb-1 font-semibold" style={{ color: '#636e7b' }}>Entry</div>
            <div className="text-[16px] font-bold" style={{ color: '#cdd9e5' }}>${fmt(entry)}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#636e7b' }}>market</div>
          </div>
        </Tooltip>
        <Tooltip content={<div><strong>Stop Loss</strong>: 1.5x ATR ({activeTf}) from entry.</div>}>
          <div className="py-3 text-center" style={{ borderRight: '1px solid #1e2d3d' }}>
            <div className="text-[10px] tracking-[0.1em] uppercase mb-1 font-semibold" style={{ color: '#636e7b' }}>Stop</div>
            <div className="text-[16px] font-bold" style={{ color: '#f85149' }}>${fmt(stop)}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#636e7b' }}>{stopPct != null ? `${stopPct.toFixed(1)}%` : '--'}</div>
          </div>
        </Tooltip>
        <Tooltip content={<div><strong>Target</strong>: 3x ATR ({activeTf}) from entry (2:1 R:R).</div>}>
          <div className="py-3 text-center">
            <div className="text-[10px] tracking-[0.1em] uppercase mb-1 font-semibold" style={{ color: '#636e7b' }}>Target</div>
            <div className="text-[16px] font-bold" style={{ color: '#3fb950' }}>${fmt(target)}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#636e7b' }}>{targetPct != null ? `${targetPct.toFixed(1)}%` : '--'}</div>
          </div>
        </Tooltip>
      </div>

      {/* Stats badges row */}
      <div className="flex items-center gap-2 px-5 py-2.5 flex-wrap" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: '#1a2332', color: '#cdd9e5', border: '1px solid #1e2d3d' }}>
          R:R {rr != null ? `${rr.toFixed(1)}:1` : '--'}
        </span>
        <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: '#1a2332', color, border: '1px solid #1e2d3d' }}>
          SCORE {score}/100
        </span>
        <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: '#1a2332', color: '#cdd9e5', border: '1px solid #1e2d3d' }}>
          ADX {adxVal ?? '--'}
        </span>
        <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: '#1a2332', color: volVal != null && volVal >= 1.5 ? '#3fb950' : '#cdd9e5', border: '1px solid #1e2d3d' }}>
          VOL {volVal != null ? `${volVal}x` : '--'}
        </span>
      </div>

      {/* Signal checklist — grouped by TF */}
      {(activeChecks.length > 0 || otherChecks.length > 0) && (
        <div className="px-5 py-3">
          {/* Active TF checks */}
          {activeChecks.map((c, i) => (
            <div key={`a-${i}`} className="flex items-start gap-2 py-[3px]">
              <span className="text-[9px] font-bold shrink-0 mt-[2px] px-1 rounded" style={{ color: '#636e7b', background: '#1a2332' }}>
                {TF_LABELS[c.tf]}
              </span>
              <span className="text-[12px] shrink-0 mt-[1px]" style={{ color: c.ok ? '#3fb950' : '#f85149' }}>
                {c.ok ? '\u2713' : '\u2717'}
              </span>
              <span className="text-[11px] leading-relaxed" style={{ color: c.ok ? '#cdd9e5' : '#636e7b' }}>
                {c.text}
              </span>
            </div>
          ))}

          {/* Separator */}
          {activeChecks.length > 0 && otherChecks.length > 0 && (
            <div className="my-1.5" style={{ borderTop: '1px solid #1e2d3d' }} />
          )}

          {/* Other TF checks */}
          {otherChecks.map((c, i) => (
            <div key={`o-${i}`} className="flex items-start gap-2 py-[3px]">
              <span className="text-[9px] font-bold shrink-0 mt-[2px] px-1 rounded" style={{ color: '#636e7b', background: '#1a2332' }}>
                {TF_LABELS[c.tf]}
              </span>
              <span className="text-[12px] shrink-0 mt-[1px]" style={{ color: c.ok ? '#3fb950' : '#f85149' }}>
                {c.ok ? '\u2713' : '\u2717'}
              </span>
              <span className="text-[11px] leading-relaxed" style={{ color: c.ok ? '#cdd9e5' : '#636e7b' }}>
                {c.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
