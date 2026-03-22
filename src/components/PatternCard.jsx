export default function PatternCard({ pattern, timeframe, atr, close }) {
  if (!pattern) return null;

  const isBear = pattern.direction === 'BEAR';
  const isBull = pattern.direction === 'BULL';
  const isNeut = pattern.direction === 'NEUTRAL';

  const borderColor = isBear ? '#f85149' : isBull ? '#3fb950' : '#d29922';
  const nameColor = borderColor;
  const isType1 = pattern.type === 1;

  const reliability = isType1 ? '67%' : '54%';
  const tgtPct = isType1 ? '2.1' : '1.9';
  const tgtSign = isBear ? '−' : '+';
  const tgtColor = isBear ? '#f85149' : '#3fb950';

  const stopPrice = atr != null
    ? (isBear ? close + atr * 1.5 : close - atr * 1.5).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '--';

  const nameText = isBear
    ? '▼ Bear Marubozu'
    : isBull
    ? '▲ Bull Marubozu'
    : '◆ Doji';

  const desc = isType1
    ? `Near-zero wicks · pure conviction ${isBear ? 'selling' : 'buying'} · Body ${pattern.bodyPct}% · $${pattern.price.toLocaleString()}`
    : `Body ${pattern.bodyPct}% of range · strong indecision · $${pattern.price.toLocaleString()} · ${timeframe} TF`;

  return (
    <div
      className="mt-2 px-3 py-2.5 rounded relative overflow-hidden"
      style={{ background: '#111820', border: '1px solid #1e2d3d' }}
    >
      {/* Left border accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: borderColor }} />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold tracking-wide" style={{ color: nameColor }}>
          {nameText}
        </span>
        <span
          className="text-[9px] font-bold px-[7px] py-[2px] rounded-sm tracking-wide"
          style={{
            color: isType1 ? '#3fb950' : '#58a6ff',
            borderColor: isType1 ? '#3fb950' : '#58a6ff',
            background: isType1 ? '#1a3d22' : '#1a2d4a',
            border: '1px solid',
          }}
        >
          TYPE {pattern.type}
        </span>
      </div>

      <div className="text-[9px] leading-relaxed tracking-wide" style={{ color: '#636e7b' }}>
        {desc}
      </div>

      <div className="flex gap-2.5 mt-1.5">
        <span className="text-[9px] font-bold tracking-wide" style={{ color: '#636e7b' }}>
          Reliability: {reliability}
        </span>
        <span className="text-[9px] font-bold tracking-wide" style={{ color: tgtColor }}>
          TGT {tgtSign}{tgtPct}%
        </span>
        <span className="text-[9px] font-bold tracking-wide" style={{ color: '#f85149' }}>
          STOP ${stopPrice}
        </span>
      </div>
    </div>
  );
}
