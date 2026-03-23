import Tooltip from './Tooltip';

function fmtPrice(val) {
  if (val == null) return '--';
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: val > 1000 ? 2 : 3 });
}

export default function PatternCard({ pattern, timeframe, atr, close }) {
  if (!pattern) return null;

  const isBear = pattern.direction === 'BEAR';
  const isBull = pattern.direction === 'BULL';

  const borderColor = isBear ? '#f85149' : isBull ? '#3fb950' : '#d29922';
  const isType1 = pattern.type === 1;

  const reliability = isType1 ? '69%' : '54%';
  const tgtPct = isType1 ? '7.0' : '12.0';
  const tgtSign = isBear ? '−' : '+';
  const tgtColor = isBear ? '#f85149' : '#3fb950';

  const stopPrice = atr != null
    ? (isBear ? close + atr * 1.5 : close - atr * 1.5)
    : null;

  const nameText = isBear
    ? '▼ Bear Marubozu'
    : isBull
    ? '▲ Bull Marubozu'
    : '◆ Doji';

  const desc = isType1
    ? `Near-zero wicks · pure conviction ${isBear ? 'selling' : 'buying'} · Body ${pattern.bodyPct}% · $${fmtPrice(pattern.price)}`
    : `Body ${pattern.bodyPct}% of range — strong indecision · $${fmtPrice(pattern.price)} · ${timeframe} TF`;

  const stopDesc = isType1
    ? 'Below lowest bottom · 0.5×ATR'
    : 'Beyond doji extremes + ATR buffer';

  const typeDesc = isType1
    ? null
    : 'Type 2: pullback to breakout level — still valid, stop intact';

  return (
    <Tooltip
      content={
        <div>
          <strong>{pattern.name}</strong> — {timeframe} timeframe
          <br />
          Direction: <strong style={{ color: borderColor }}>{pattern.direction}</strong>
          <br />
          Body ratio: {pattern.bodyPct}% of candle range
          <br />
          Type {pattern.type}: {isType1 ? `High conviction (${reliability} reliability)` : `Standard (${reliability} reliability)`}
          <br />
          Target: {tgtSign}{tgtPct}% · Stop: ${fmtPrice(stopPrice)} (1.5× ATR)
          <br />
          <span style={{ color: '#8b949e' }}>
            {isBear && 'Strong selling pressure — minimal buyer resistance.'}
            {isBull && 'Strong buying pressure — minimal seller resistance.'}
            {!isBear && !isBull && 'Indecision candle — market undecided. Wait for confirmation.'}
          </span>
        </div>
      }
    >
      <div
        className="mt-3 rounded-lg relative overflow-hidden"
        style={{ background: '#111820', border: '1px solid #1e2d3d' }}
      >
        {/* Left border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: borderColor }} />

        <div className="px-4 py-3 pl-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-bold tracking-wide" style={{ color: borderColor }}>
              {nameText}
            </span>
            <span
              className="text-[10px] font-bold px-2.5 py-[3px] rounded tracking-wide"
              style={{
                color: isType1 ? '#3fb950' : '#58a6ff',
                background: isType1 ? '#1a3d22' : '#1a2d4a',
                border: `1px solid ${isType1 ? '#3fb950' : '#58a6ff'}`,
              }}
            >
              TYPE {pattern.type}
            </span>
          </div>

          <div className="text-[11px] leading-relaxed tracking-wide mb-2" style={{ color: '#8b949e' }}>
            {desc}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold tracking-wide">
            <span style={{ color: '#8b949e' }}>
              Reliability: <span style={{ color: '#cdd9e5' }}>{reliability}</span>
            </span>
            <span style={{ color: tgtColor }}>
              TGT {tgtSign}{tgtPct}%
            </span>
            <span style={{ color: '#f85149' }}>
              STOP ${fmtPrice(stopPrice)}
            </span>
          </div>

          <div className="text-[10px] mt-1.5 leading-relaxed" style={{ color: '#636e7b' }}>
            {stopDesc}
          </div>
          {typeDesc && (
            <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#636e7b' }}>
              {typeDesc}
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  );
}
