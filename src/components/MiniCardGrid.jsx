import Tooltip from './Tooltip';

function MiniCard({ label, value, sub, colorClass, tooltip }) {
  const colorMap = {
    bull: '#3fb950',
    bear: '#f85149',
    neut: '#d29922',
    dim: '#cdd9e5',
  };
  const c = colorMap[colorClass] || '#cdd9e5';

  const card = (
    <div className="rounded p-3 pb-2.5 text-center overflow-hidden" style={{ background: '#111820', border: '1px solid #1e2d3d' }}>
      <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5 truncate font-semibold" style={{ color: '#3d4a57' }}>
        {label}
      </div>
      <div className="text-[20px] font-bold tracking-tight truncate" style={{ color: c }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-1 tracking-wide truncate" style={{ color: '#636e7b' }}>
          {sub}
        </div>
      )}
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{card}</Tooltip>;
  }
  return card;
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

  // SMMA detail
  const smmaVal = signals.smma99Value;
  const smmaPct = smmaVal != null && signals.close != null
    ? ((signals.close - smmaVal) / smmaVal * 100).toFixed(2)
    : null;

  return (
    <div className="px-5 py-4">
      <span className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
        Signal Cards · 4H
      </span>
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <MiniCard
          label="RSI"
          value={signals.rsi ?? '--'}
          sub={rsiSub}
          colorClass={rsiClass}
          tooltip={
            <div>
              <strong>RSI (14)</strong>: {signals.rsi ?? '--'}
              <br />
              {'> 55 = Bullish, < 45 = Bearish'}
              <br />
              <span style={{ color: '#8b949e' }}>Momentum gauge — not overbought/oversold.</span>
            </div>
          }
        />
        <MiniCard
          label="EMA Align"
          value={signals.emaStack}
          sub={emaStackSub}
          colorClass={emaClass}
          tooltip={
            <div>
              <strong>EMA Stack</strong>: {signals.emaStack}
              <br />
              BULL = 20 {'>'} 50 {'>'} 100 {'>'} 200
              <br />
              BEAR = reverse order. MIXED = no alignment.
            </div>
          }
        />
        <MiniCard
          label="SMMA 99"
          value={signals.smma99}
          sub={smmaPct != null ? `${parseFloat(smmaPct) > 0 ? '+' : ''}${smmaPct}%` : smmaSub}
          colorClass={smmaClass}
          tooltip={
            <div>
              <strong>SMMA 99</strong>: {smmaVal != null ? `$${smmaVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
              <br />
              Price {signals.smma99 === 'ABOVE' ? 'above' : 'below'} by {smmaPct != null ? `${Math.abs(parseFloat(smmaPct))}%` : '--'}
              <br />
              <span style={{ color: '#8b949e' }}>Long-term trend filter. Above = bullish bias.</span>
            </div>
          }
        />
        <MiniCard
          label="ATR%"
          value={signals.atrPct != null ? `${signals.atrPct}%` : '--'}
          sub="volatility"
          colorClass="dim"
          tooltip={
            <div>
              <strong>ATR% (14)</strong>: {signals.atrPct != null ? `${signals.atrPct}%` : '--'}
              <br />
              Average True Range as % of price.
              <br />
              <span style={{ color: '#8b949e' }}>Higher = more volatile. Used for stop-loss sizing.</span>
            </div>
          }
        />
        <MiniCard
          label="BB%"
          value={signals.bbPct != null ? `${signals.bbPct}%` : '--'}
          sub="band position"
          colorClass="neut"
          tooltip={
            <div>
              <strong>Bollinger Band %</strong>: {signals.bbPct != null ? `${signals.bbPct}%` : '--'}
              <br />
              0% = at lower band, 50% = middle, 100% = upper band.
              <br />
              <span style={{ color: '#8b949e' }}>Shows where price sits within the Bollinger Band range.</span>
            </div>
          }
        />
        <MiniCard
          label="Score"
          value={signals.score}
          sub="/ 100"
          colorClass={scoreClass}
          tooltip={
            <div>
              <strong>Bias Score</strong>: {signals.score}/100
              <br />
              EMA (25pts) + SMMA (25pts) + RSI (25pts) + Pattern (25pts)
              <br />
              <span style={{ color: '#8b949e' }}>{'≤ 45 = Bearish, ≥ 56 = Bullish, between = Neutral'}</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
