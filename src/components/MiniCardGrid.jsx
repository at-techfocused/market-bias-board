function MiniCard({ label, value, sub, colorClass }) {
  const colorMap = {
    bull: '#3fb950',
    bear: '#f85149',
    neut: '#d29922',
    dim: '#cdd9e5',
  };
  const c = colorMap[colorClass] || '#cdd9e5';

  return (
    <div className="rounded p-2 pb-1.5 text-center overflow-hidden" style={{ background: '#111820', border: '1px solid #1e2d3d' }}>
      <div className="text-[8px] tracking-[0.08em] uppercase mb-1 truncate" style={{ color: '#3d4a57' }}>
        {label}
      </div>
      <div className="text-[14px] font-bold tracking-tight truncate" style={{ color: c }}>
        {value}
      </div>
      {sub && (
        <div className="text-[8px] mt-0.5 tracking-wide truncate" style={{ color: '#3d4a57' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function MiniCardGrid({ signals }) {
  if (!signals) return null;

  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const emaClass = signals.emaStack === 'BULL' ? 'bull' : signals.emaStack === 'BEAR' ? 'bear' : 'neut';
  const smmaClass = signals.smma99 === 'ABOVE' ? 'bull' : 'bear';
  const scoreClass = signals.score >= 56 ? 'bull' : signals.score <= 45 ? 'bear' : 'neut';

  const rsiSub = signals.rsiZone === 'BULLISH' ? 'bullish zone' : signals.rsiZone === 'BEARISH' ? 'bearish zone' : 'neutral zone';
  const emaStackSub = signals.emaStack === 'BULL' ? 'aligned up' : signals.emaStack === 'BEAR' ? 'all declining' : 'mixed';
  const smmaSub = signals.smma99 === 'ABOVE' ? 'price above' : 'price under';

  return (
    <div className="px-4 py-3">
      <span className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
        Signal Cards · 4H
      </span>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <MiniCard label="RSI" value={signals.rsi ?? '--'} sub={rsiSub} colorClass={rsiClass} />
        <MiniCard label="EMA Align" value={signals.emaStack} sub={emaStackSub} colorClass={emaClass} />
        <MiniCard label="SMMA 99" value={signals.smma99} sub={smmaSub} colorClass={smmaClass} />
        <MiniCard label="ATR%" value={signals.atrPct != null ? `${signals.atrPct}%` : '--'} sub="volatility" colorClass="dim" />
        <MiniCard label="BB%" value={signals.bbPct != null ? `${signals.bbPct}%` : '--'} sub="mid range" colorClass="neut" />
        <MiniCard label="Score" value={signals.score} sub="/ 100" colorClass={scoreClass} />
      </div>
    </div>
  );
}
