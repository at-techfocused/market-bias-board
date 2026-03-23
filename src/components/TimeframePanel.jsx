import Tooltip from './Tooltip';

function getBiasColor(score) {
  if (score <= 45) return '#f85149';
  if (score >= 56) return '#3fb950';
  return '#d29922';
}

function SignalRow({ name, value, colorClass, tooltip, sub }) {
  const colorMap = {
    bull: '#3fb950',
    bear: '#f85149',
    neut: '#d29922',
    mixed: '#58a6ff',
  };
  const c = colorMap[colorClass] || '#636e7b';

  const row = (
    <div className="flex items-center justify-between gap-2 py-[8px]"
      style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
      <span className="text-[12px] tracking-[0.06em] uppercase shrink-0 font-semibold" style={{ color: '#8b949e' }}>
        {name}
      </span>
      <div className="text-right min-w-0">
        <span className="text-[13px] font-bold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis block" style={{ color: c }}>
          {value}
        </span>
        {sub && (
          <span className="text-[10px] tracking-wide block" style={{ color: '#636e7b' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{row}</Tooltip>;
  }
  return row;
}

function EMADetailBars({ ema, close }) {
  if (!ema) return null;

  const pairs = [
    { label: 'EMA 20', value: ema.ema20 },
    { label: 'EMA 50', value: ema.ema50 },
    { label: 'EMA 100', value: ema.ema100 },
    { label: 'EMA 200', value: ema.ema200 },
  ];

  return (
    <div className="flex flex-col gap-[4px] mt-1.5 mb-1">
      {pairs.map(({ label, value }) => {
        if (value == null) return null;
        const above = close > value;
        const pct = ((close - value) / value * 100).toFixed(2);
        const color = above ? '#3fb950' : '#f85149';
        const maxPct = 5;
        const barWidth = Math.min(Math.abs(parseFloat(pct)) / maxPct * 100, 100);

        return (
          <Tooltip
            key={label}
            content={
              <div>
                <strong style={{ color }}>{label}</strong>: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <br />
                Price is <strong style={{ color }}>{above ? 'above' : 'below'}</strong> by {Math.abs(pct)}%
                <br />
                <span style={{ color: '#8b949e' }}>
                  {label === 'EMA 20' && 'Short-term trend (fast). Reacts quickly to price changes.'}
                  {label === 'EMA 50' && 'Medium-term trend. Key support/resistance level.'}
                  {label === 'EMA 100' && 'Intermediate trend. Used for swing trade bias.'}
                  {label === 'EMA 200' && 'Long-term trend. Major institutional support/resistance.'}
                </span>
              </div>
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold w-[52px] shrink-0" style={{ color: '#8b949e' }}>
                {label}
              </span>
              <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: '#161e28' }}>
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${barWidth}%`, background: color, opacity: 0.8 }}
                />
              </div>
              <span className="text-[10px] font-bold w-[50px] text-right" style={{ color }}>
                {above ? '+' : ''}{pct}%
              </span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default function TimeframePanel({ label, signals }) {
  if (!signals) return <div className="p-4 text-[12px]" style={{ color: '#636e7b' }}>No data</div>;

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

  // SMMA details
  const smmaVal = signals.smma99Value;
  const smmaPct = smmaVal != null && signals.close != null
    ? ((signals.close - smmaVal) / smmaVal * 100).toFixed(2)
    : null;
  const smmaAbove = smmaPct != null ? parseFloat(smmaPct) > 0 : false;
  const smmaDisplay = signals.smma99;
  const smmaSub = smmaVal != null
    ? `$${smmaVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${smmaAbove ? '+' : ''}${smmaPct}%`
    : null;

  return (
    <div className="p-4 pt-3">
      <SignalRow
        name="EMA"
        value={signals.emaStack}
        colorClass={emaClass}
        tooltip={
          <div>
            <strong>EMA Stack Alignment</strong>
            <br />
            Checks if EMA 20 {'>'} 50 {'>'} 100 {'>'} 200 (BULL) or the reverse (BEAR).
            <br />
            <span style={{ color: '#8b949e' }}>
              {signals.emaStack === 'BULL' && 'All EMAs are perfectly stacked bullish — strong uptrend.'}
              {signals.emaStack === 'BEAR' && 'All EMAs are perfectly stacked bearish — strong downtrend.'}
              {signals.emaStack === 'MIXED' && 'EMAs are not in order — trend is unclear or transitioning.'}
            </span>
            <br />
            <em style={{ color: '#636e7b' }}>Click the EMA bars below for individual values.</em>
          </div>
        }
      />
      <EMADetailBars ema={signals.ema} close={signals.close} />

      <SignalRow
        name="SMMA 99"
        value={smmaDisplay}
        sub={smmaSub}
        colorClass={smmaClass}
        tooltip={
          <div>
            <strong>Smoothed Moving Average (99 period)</strong>
            <br />
            {smmaVal != null && (
              <>
                Current SMMA: <strong>${smmaVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                <br />
                Price is <strong style={{ color: smmaAbove ? '#3fb950' : '#f85149' }}>{smmaAbove ? 'above' : 'below'}</strong> by {Math.abs(parseFloat(smmaPct))}%
                <br />
              </>
            )}
            <span style={{ color: '#8b949e' }}>
              SMMA 99 acts as a long-term trend filter. Price above = bullish bias. Price below = bearish bias.
            </span>
          </div>
        }
      />

      <SignalRow
        name="RSI"
        value={String(signals.rsi)}
        colorClass={rsiClass}
        tooltip={
          <div>
            <strong>Relative Strength Index (14 period)</strong>
            <br />
            Current: <strong>{signals.rsi}</strong>
            <br />
            {signals.rsiZone === 'BULLISH' && <span style={{ color: '#3fb950' }}>Above 55 = Bullish momentum zone</span>}
            {signals.rsiZone === 'BEARISH' && <span style={{ color: '#f85149' }}>Below 45 = Bearish momentum zone</span>}
            {signals.rsiZone === 'NEUTRAL' && <span style={{ color: '#d29922' }}>45-55 = Neutral zone, no clear momentum</span>}
            <br />
            <span style={{ color: '#8b949e' }}>RSI measures momentum. Not overbought/oversold — used as a trend strength gauge.</span>
          </div>
        }
      />

      <SignalRow
        name="Pattern"
        value={patternText}
        colorClass={patternClass}
        tooltip={
          signals.pattern ? (
            <div>
              <strong>{signals.pattern.name}</strong> detected
              <br />
              Direction: <strong style={{ color: patternClass === 'bull' ? '#3fb950' : patternClass === 'bear' ? '#f85149' : '#d29922' }}>
                {signals.pattern.direction}
              </strong>
              <br />
              Body: {signals.pattern.bodyPct}% of candle range
              <br />
              Type: {signals.pattern.type} ({signals.pattern.type === 1 ? 'High conviction' : 'Standard'})
              <br />
              <span style={{ color: '#8b949e' }}>
                {signals.pattern.name === 'Doji' && 'Doji indicates indecision — potential reversal or continuation.'}
                {signals.pattern.name === 'Bullish Marubozu' && 'Strong bullish candle with minimal wicks — buyers dominated.'}
                {signals.pattern.name === 'Bear Marubozu' && 'Strong bearish candle with minimal wicks — sellers dominated.'}
              </span>
            </div>
          ) : (
            <div>
              <strong>No pattern detected</strong>
              <br />
              <span style={{ color: '#8b949e' }}>Scans last 3 candles for Doji, Bullish Marubozu, or Bear Marubozu formations.</span>
            </div>
          )
        }
      />

      <div
        className="mt-2 py-[6px] px-[8px] rounded-[3px] text-[12px] font-bold tracking-wide text-center"
        style={{ background: scoreBg, color }}
      >
        SCORE {signals.score}/100
      </div>
    </div>
  );
}
