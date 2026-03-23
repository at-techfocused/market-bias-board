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
    <div className="flex items-center justify-between gap-1 py-[6px]"
      style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
      <span className="text-[8px] tracking-[0.06em] uppercase shrink-0" style={{ color: '#636e7b' }}>
        {name}
      </span>
      <span className="text-[9px] font-bold tracking-wide text-right whitespace-nowrap overflow-hidden text-ellipsis min-w-0" style={{ color: c }}>
        {value}
      </span>
    </div>
  );
}

function EMAStackBars({ emaStack }) {
  const color = emaStack === 'BULL' ? '#3fb950' : emaStack === 'BEAR' ? '#f85149' : '#d29922';
  const widths = [100, 85, 70, 55];

  return (
    <div className="flex flex-col gap-[1px] mt-1">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-[2px] rounded-sm"
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
    <div className="p-2.5 pt-2.5">
      <SignalRow name="EMA" value={signals.emaStack} colorClass={emaClass} />
      <EMAStackBars emaStack={signals.emaStack} />
      <div className="mt-1.5">
        <SignalRow name="SMMA" value={signals.smma99} colorClass={smmaClass} />
      </div>
      <SignalRow name="RSI" value={String(signals.rsi)} colorClass={rsiClass} />
      <SignalRow name="Pattern" value={patternText} colorClass={patternClass} />
      <div
        className="mt-1.5 py-[4px] px-[5px] rounded-[3px] text-[8px] tracking-wide text-center"
        style={{ background: scoreBg, color }}
      >
        {signals.score}/100
      </div>
    </div>
  );
}
