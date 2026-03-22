function getBiasLabel(score) {
  if (score <= 45) return 'BEARISH';
  if (score >= 56) return 'BULLISH';
  return 'NEUTRAL';
}

function getBiasColor(score) {
  if (score <= 45) return '#f85149';
  if (score >= 56) return '#3fb950';
  return '#d29922';
}

function SignalRow({ name, value, colorClass }) {
  const colorMap = {
    bull: '#3fb950',
    bear: '#f85149',
    neut: '#d29922',
    mixed: '#58a6ff',
  };
  const c = colorMap[colorClass] || '#636e7b';

  return (
    <div className="flex items-start justify-between gap-1.5 py-[7px]"
      style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
      <span className="text-[9px] tracking-[0.08em] uppercase flex-1 pt-[1px]" style={{ color: '#636e7b' }}>
        {name}
      </span>
      <span className="text-[10px] font-bold tracking-wide text-right" style={{ color: c }}>
        {value}
      </span>
      <div className="w-1.5 h-1.5 rounded-full mt-[2px] shrink-0"
        style={{ background: c, boxShadow: `0 0 6px ${c}40` }} />
    </div>
  );
}

function EMAStackBars({ emaStack }) {
  const color = emaStack === 'BULL' ? '#3fb950' : emaStack === 'BEAR' ? '#f85149' : '#d29922';
  const widths = [100, 85, 70, 55];

  return (
    <div className="flex flex-col gap-[2px] mt-1">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-[3px] rounded-sm"
          style={{
            background: color,
            opacity: 0.9 - i * 0.18,
            width: `${w}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function TimeframePanel({ label, signals }) {
  if (!signals) return <div className="p-3.5 text-[10px]" style={{ color: '#636e7b' }}>No data</div>;

  const bias = getBiasLabel(signals.score);
  const color = getBiasColor(signals.score);
  const emaClass = signals.emaStack === 'BULL' ? 'bull' : signals.emaStack === 'BEAR' ? 'bear' : 'mixed';
  const smmaClass = signals.smma99 === 'ABOVE' ? 'bull' : 'bear';
  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const patternClass = signals.pattern
    ? signals.pattern.direction === 'BULL' ? 'bull' : signals.pattern.direction === 'BEAR' ? 'bear' : 'neut'
    : 'neut';
  const patternText = signals.pattern
    ? `${signals.pattern.name === 'Bear Marubozu' ? 'MRUBZU ▼' : signals.pattern.name === 'Bullish Marubozu' ? 'MRUBZU ▲' : 'DOJI ◆'}`
    : 'None';

  const scoreBg = signals.score <= 45 ? '#3d1a1a' : signals.score >= 56 ? '#1a3d22' : '#3d2e0a';

  return (
    <div className="p-3 pt-3">
      <SignalRow name="EMA Stack" value={signals.emaStack} colorClass={emaClass} />
      <EMAStackBars emaStack={signals.emaStack} />
      <div className="mt-2">
        <SignalRow name="SMMA 99" value={signals.smma99} colorClass={smmaClass} />
      </div>
      <SignalRow name="RSI Zone" value={String(signals.rsi)} colorClass={rsiClass} />
      <SignalRow name="Pattern" value={patternText} colorClass={patternClass} />
      <div
        className="mt-1.5 py-[5px] px-[7px] rounded-[3px] text-[9px] tracking-wide text-center"
        style={{ background: scoreBg, color }}
      >
        SCORE {signals.score}/100
      </div>
    </div>
  );
}
