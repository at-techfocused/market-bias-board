import Tooltip from './Tooltip';

function fmt(val) {
  if (val == null) return '--';
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: val > 1000 ? 2 : 3 });
}

export default function CompositeScore({ composite, lastFetch, signals }) {
  if (!composite) return null;

  const { score, actionLabel, description, entry, stop, target, stopPct, targetPct, rr } = composite;

  const isBull = score > 50;
  const color = score <= 40 ? '#f85149' : score >= 60 ? '#3fb950' : '#d29922';
  const glow = score <= 40 ? 'rgba(248,81,73,0.12)' : score >= 60 ? 'rgba(63,185,80,0.12)' : 'rgba(210,153,34,0.12)';

  const fetchTime = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const h4 = signals?.['4H'];
  const d = signals?.D;

  // Build checklist
  const checks = [];
  if (h4) {
    const stackDesc = h4.emaStack === 'BULL'
      ? 'Full bull stack: price>EMA20>EMA50>EMA100>EMA200'
      : h4.emaStack === 'BEAR'
      ? 'Full bear stack: price<EMA20<EMA50<EMA100<EMA200'
      : 'EMA stack mixed — no clear alignment';
    checks.push({ ok: h4.emaStack === (isBull ? 'BULL' : 'BEAR'), text: stackDesc });
    checks.push({ ok: h4.score > 50 === isBull, text: `Trend score ${isBull ? 'strong' : 'weak'}: ${h4.score}/100` });
    if (h4.macd) {
      const macdBull = h4.macdDirection === 'BULL';
      checks.push({
        ok: macdBull === isBull,
        text: `MACD ${macdBull ? 'bullish' : 'bearish'} + histogram ${h4.macd.histogram > 0 ? 'expanding' : 'contracting'}`,
      });
    }
    checks.push({
      ok: (h4.rsiZone === 'BULLISH') === isBull,
      text: `RSI ${h4.rsi} — ${h4.rsiZone.toLowerCase()} zone`,
    });
    if (h4.volRatio != null) {
      checks.push({
        ok: h4.volRatio >= 1.0,
        text: `Volume ${h4.volRatio}x avg — ${h4.volRatio >= 1.5 ? 'conviction confirmed' : h4.volRatio >= 1.0 ? 'above average' : 'below average'}`,
      });
    }
  }

  // ADX from daily
  const adxVal = d?.adx ?? h4?.adx;
  const volVal = h4?.volRatio ?? d?.volRatio;

  return (
    <div style={{ background: '#0d1117' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
            Action Signal
          </span>
          <Tooltip content={
            <div>
              <strong>Action Signal</strong> combines 4H and Daily timeframe scores.
              <br />
              Score is weighted across: EMA Stack, SMMA position, RSI zone, MACD direction, and candlestick patterns.
              <br />
              <span style={{ color: '#8b949e' }}>Entry/Stop/Target are auto-calculated using 1.5x ATR stop and 3x ATR target (2:1 R:R).</span>
            </div>
          }>
            <span className="text-[11px] cursor-pointer" style={{ color: '#3d4a57' }}>ⓘ</span>
          </Tooltip>
        </div>
        <span className="text-[11px] tracking-[0.06em]" style={{ color: '#3d4a57' }}>
          PL · {fetchTime}
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
          <div className="text-right">
            <div className="text-[36px] font-bold leading-none" style={{ color }}>
              {score}%
            </div>
            <div className="text-[10px] tracking-wide mt-1" style={{ color: '#636e7b' }}>
              confidence
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3 h-[6px] rounded overflow-hidden" style={{ background: '#161e28' }}>
          <div
            className="h-full rounded relative"
            style={{
              width: `${score}%`,
              background: `linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)`,
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
        <Tooltip content={
          <div><strong>Entry</strong>: Current market price. This is the level where you would enter the trade based on the current signal direction.</div>
        }>
          <div className="py-3 text-center" style={{ borderRight: '1px solid #1e2d3d' }}>
            <div className="text-[10px] tracking-[0.1em] uppercase mb-1 font-semibold" style={{ color: '#636e7b' }}>Entry</div>
            <div className="text-[16px] font-bold" style={{ color: '#cdd9e5' }}>${fmt(entry)}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#636e7b' }}>market</div>
          </div>
        </Tooltip>
        <Tooltip content={
          <div><strong>Stop Loss</strong>: 1.5x ATR from entry. Limits downside risk. Place your stop at this level to protect against adverse moves.</div>
        }>
          <div className="py-3 text-center" style={{ borderRight: '1px solid #1e2d3d' }}>
            <div className="text-[10px] tracking-[0.1em] uppercase mb-1 font-semibold" style={{ color: '#636e7b' }}>Stop</div>
            <div className="text-[16px] font-bold" style={{ color: '#f85149' }}>${fmt(stop)}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#636e7b' }}>{stopPct != null ? `${stopPct.toFixed(1)}%` : '--'}</div>
          </div>
        </Tooltip>
        <Tooltip content={
          <div><strong>Target</strong>: 3x ATR from entry (2:1 reward-to-risk). This is the profit target level where you would consider taking profits.</div>
        }>
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

      {/* Signal checklist */}
      {checks.length > 0 && (
        <div className="px-5 py-3" style={{ borderBottom: '2px solid #1e2d3d' }}>
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2 py-[3px]">
              <span className="text-[12px] shrink-0 mt-[1px]" style={{ color: c.ok ? '#3fb950' : '#636e7b' }}>
                {c.ok ? '✓' : '○'}
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
