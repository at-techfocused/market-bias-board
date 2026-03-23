import Tooltip from './Tooltip';

function getBiasColor(score) {
  if (score <= 40) return '#f85149';
  if (score >= 60) return '#3fb950';
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

function fmtPrice(val) {
  if (val == null) return '--';
  if (val >= 10000) return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (val >= 100) return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

function EMAInlineRow({ ema, close }) {
  if (!ema) return null;

  const pairs = [
    { period: '20', value: ema.ema20 },
    { period: '50', value: ema.ema50 },
    { period: '100', value: ema.ema100 },
    { period: '200', value: ema.ema200 },
  ];

  return (
    <Tooltip content={
      <div>
        <strong>EMA Stack</strong> — 20/50/100/200 period Exponential Moving Averages
        <br /><br />
        {pairs.map(({ period, value }) => {
          if (value == null) return null;
          const above = close > value;
          const pct = ((close - value) / value * 100).toFixed(2);
          return (
            <div key={period} style={{ color: above ? '#3fb950' : '#f85149' }}>
              EMA {period}: ${fmtPrice(value)} ({above ? '+' : ''}{pct}%)
            </div>
          );
        })}
        <br />
        <span style={{ color: '#8b949e' }}>
          Green = price above EMA (bullish). Red = price below (bearish).
          When all EMAs stack in order, trend conviction is highest.
        </span>
      </div>
    }>
      <div className="flex items-center gap-2 py-[8px]" style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
        <span className="text-[11px] tracking-[0.06em] uppercase shrink-0 font-semibold" style={{ color: '#8b949e' }}>
          EMA 20/50/100/200
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          {pairs.map(({ period, value }) => {
            if (value == null) return <span key={period} className="text-[12px] font-bold" style={{ color: '#636e7b' }}>--</span>;
            const above = close > value;
            return (
              <span key={period} className="text-[12px] font-bold tabular-nums" style={{ color: above ? '#3fb950' : '#f85149' }}>
                {fmtPrice(value)}
              </span>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
}

export default function TimeframePanel({ label, signals }) {
  if (!signals) return <div className="p-5 text-[12px]" style={{ color: '#636e7b' }}>No data</div>;

  const color = getBiasColor(signals.score);
  const smmaClass = signals.smma99 === 'ABOVE' ? 'bull' : 'bear';
  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const macdClass = signals.macdDirection === 'BULL' ? 'bull' : signals.macdDirection === 'BEAR' ? 'bear' : 'neut';
  const patternClass = signals.pattern
    ? signals.pattern.direction === 'BULL' ? 'bull' : signals.pattern.direction === 'BEAR' ? 'bear' : 'neut'
    : 'neut';
  const patternText = signals.pattern
    ? `${signals.pattern.name === 'Bear Marubozu' ? 'MRUBZU ▼' : signals.pattern.name === 'Bullish Marubozu' ? 'MRUBZU ▲' : 'DOJI ◆'}`
    : 'None';

  const scoreBg = signals.score <= 40 ? '#3d1a1a' : signals.score >= 60 ? '#1a3d22' : '#3d2e0a';

  // SMMA details
  const smmaVal = signals.smma99Value;
  const smmaPct = smmaVal != null && signals.close != null
    ? ((signals.close - smmaVal) / smmaVal * 100).toFixed(2)
    : null;
  const smmaAbove = smmaPct != null ? parseFloat(smmaPct) > 0 : false;
  const smmaSub = smmaVal != null
    ? `$${fmtPrice(smmaVal)} · ${smmaAbove ? '+' : ''}${smmaPct}%`
    : null;

  // MACD text
  const macdText = signals.macd
    ? `${signals.macdDirection === 'BULL' ? '▲ Bull' : signals.macdDirection === 'BEAR' ? '▼ Bear' : '◆ Neutral'}`
    : '--';

  return (
    <div className="p-5 pt-4">
      <EMAInlineRow ema={signals.ema} close={signals.close} />

      <SignalRow
        name="SMMA 99"
        value={signals.smma99}
        sub={smmaSub}
        colorClass={smmaClass}
        tooltip={
          <div>
            <strong>Smoothed Moving Average (99 period)</strong>
            <br />
            {smmaVal != null && (
              <>
                Current SMMA: <strong>${fmtPrice(smmaVal)}</strong>
                <br />
                Price is <strong style={{ color: smmaAbove ? '#3fb950' : '#f85149' }}>{smmaAbove ? 'above' : 'below'}</strong> by {Math.abs(parseFloat(smmaPct))}%
                <br />
              </>
            )}
            <span style={{ color: '#8b949e' }}>
              SMMA 99 acts as a long-term trend filter. Price above = bullish bias, below = bearish.
            </span>
          </div>
        }
      />

      <SignalRow
        name="MACD"
        value={macdText}
        colorClass={macdClass}
        tooltip={
          signals.macd ? (
            <div>
              <strong>MACD (12, 26, 9)</strong>
              <br />
              MACD Line: {signals.macd.macd.toFixed(2)}
              <br />
              Signal Line: {signals.macd.signal.toFixed(2)}
              <br />
              Histogram: <span style={{ color: signals.macd.histogram > 0 ? '#3fb950' : '#f85149' }}>
                {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(2)}
              </span>
              <br />
              <span style={{ color: '#8b949e' }}>
                {signals.macdDirection === 'BULL' && 'MACD above signal line — bullish momentum.'}
                {signals.macdDirection === 'BEAR' && 'MACD below signal line — bearish momentum.'}
                {signals.macdDirection === 'NEUTRAL' && 'MACD near signal line — momentum unclear.'}
              </span>
            </div>
          ) : (
            <div><strong>MACD</strong>: Not enough data to compute.</div>
          )
        }
      />

      <SignalRow
        name="RSI"
        value={String(signals.rsi)}
        colorClass={rsiClass}
        tooltip={
          <div>
            <strong>RSI (14 period)</strong>: {signals.rsi}
            <br />
            {signals.rsiZone === 'BULLISH' && <span style={{ color: '#3fb950' }}>Above 55 = Bullish momentum</span>}
            {signals.rsiZone === 'BEARISH' && <span style={{ color: '#f85149' }}>Below 45 = Bearish momentum</span>}
            {signals.rsiZone === 'NEUTRAL' && <span style={{ color: '#d29922' }}>45-55 = Neutral zone</span>}
            <br />
            <span style={{ color: '#8b949e' }}>Momentum gauge, not overbought/oversold.</span>
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
              <strong>{signals.pattern.name}</strong> — {signals.pattern.direction}
              <br />
              Body: {signals.pattern.bodyPct}% of candle range · Type {signals.pattern.type}
              <br />
              <span style={{ color: '#8b949e' }}>
                {signals.pattern.name === 'Doji' && 'Indecision — potential reversal or continuation.'}
                {signals.pattern.name === 'Bullish Marubozu' && 'Strong buying — minimal wicks, buyers dominated.'}
                {signals.pattern.name === 'Bear Marubozu' && 'Strong selling — minimal wicks, sellers dominated.'}
              </span>
            </div>
          ) : (
            <div>No pattern detected. Scans last 3 candles for Doji, Bull/Bear Marubozu.</div>
          )
        }
      />

      <div
        className="mt-2.5 py-[6px] px-[8px] rounded text-[12px] font-bold tracking-wide text-center"
        style={{ background: scoreBg, color }}
      >
        SCORE {signals.score}/100
      </div>
    </div>
  );
}
