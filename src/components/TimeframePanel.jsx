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
    <div className="flex items-center justify-between gap-2 py-[10px]"
      style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
      <span className="text-[13px] tracking-[0.06em] uppercase shrink-0 font-semibold" style={{ color: '#8b949e' }}>
        {name}
      </span>
      <div className="text-right min-w-0">
        <span className="text-[14px] font-bold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis block" style={{ color: c }}>
          {value}
        </span>
        {sub && (
          <span className="text-[11px] tracking-wide block" style={{ color: '#636e7b' }}>
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

// EMA period label colors: 20=red, 50=orange, 100=teal, 200=blue
const EMA_PERIOD_COLORS = {
  '20': '#f85149',
  '50': '#d29922',
  '100': '#2dd4bf',
  '200': '#58a6ff',
};

// EMA Stack with inline dollar values — always visible, color-coded
function EMAStackInline({ ema, emaStack, close }) {
  const stackColor = emaStack === 'BULL' ? '#3fb950' : emaStack === 'BEAR' ? '#f85149' : '#d29922';

  const pairs = [
    { period: '20', value: ema?.ema20 },
    { period: '50', value: ema?.ema50 },
    { period: '100', value: ema?.ema100 },
    { period: '200', value: ema?.ema200 },
  ];

  return (
    <Tooltip content={
      <div>
        <strong>EMA Stack</strong> &mdash; {emaStack}
        <br /><br />
        {pairs.map(({ period, value }) => {
          if (value == null) return null;
          const above = close > value;
          const pct = ((close - value) / value * 100).toFixed(2);
          return (
            <div key={period} style={{ color: above ? '#3fb950' : '#f85149' }}>
              <span style={{ color: EMA_PERIOD_COLORS[period] }}>EMA {period}</span>: ${fmtPrice(value)} ({above ? '+' : ''}{pct}%)
            </div>
          );
        })}
        <br />
        <span style={{ color: '#8b949e' }}>
          Green = price above EMA. Red = price below. Full stack = highest conviction.
        </span>
      </div>
    }>
      <div className="py-[10px]" style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] tracking-[0.06em] uppercase shrink-0 font-semibold" style={{ color: '#8b949e' }}>
            EMA Stack
          </span>
          <span className="text-[14px] font-bold" style={{ color: stackColor }}>
            {emaStack}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {pairs.map(({ period, value }) => {
            if (value == null) return null;
            const above = close > value;
            const valueColor = above ? '#3fb950' : '#f85149';
            const periodColor = EMA_PERIOD_COLORS[period];
            return (
              <span key={period} className="text-[11px] tabular-nums whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span style={{ color: valueColor }}>{above ? '+' : '\u2212'}</span>
                <span style={{ color: periodColor }}>EMA{period}</span>
                {' '}
                <span style={{ color: valueColor }}>${fmtPrice(value)}</span>
              </span>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
}

export default function TimeframePanel({ label, signals }) {
  if (!signals) return <div className="p-5 text-[13px]" style={{ color: '#636e7b' }}>No data</div>;

  const color = getBiasColor(signals.score);
  const smmaClass = signals.smma99 === 'ABOVE' ? 'bull' : 'bear';
  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const macdClass = signals.macdDirection === 'BULL' ? 'bull' : signals.macdDirection === 'BEAR' ? 'bear' : 'neut';
  const patternClass = signals.pattern
    ? signals.pattern.direction === 'BULL' ? 'bull' : signals.pattern.direction === 'BEAR' ? 'bear' : 'neut'
    : 'neut';
  const patternText = signals.pattern
    ? `${signals.pattern.name === 'Bear Marubozu' ? 'MRUBZU \u25BC' : signals.pattern.name === 'Bullish Marubozu' ? 'MRUBZU \u25B2' : 'DOJI \u25C6'}`
    : 'None';

  const scoreBg = signals.score <= 40 ? '#3d1a1a' : signals.score >= 60 ? '#1a3d22' : '#3d2e0a';

  // SMMA layout
  const smmaVal = signals.smma99Value;
  const smmaPct = smmaVal != null && signals.close != null
    ? ((signals.close - smmaVal) / smmaVal * 100).toFixed(2)
    : null;
  const smmaAbove = smmaPct != null ? parseFloat(smmaPct) > 0 : false;
  const smmaColor = smmaAbove ? '#3fb950' : '#f85149';

  // MACD text
  const macdText = signals.macd
    ? `${signals.macdDirection === 'BULL' ? '\u25B2 Bull' : signals.macdDirection === 'BEAR' ? '\u25BC Bear' : '\u25C6 Neutral'}`
    : '--';

  return (
    <div className="p-5 pt-4">
      {/* EMA stack with inline dollar values */}
      <EMAStackInline ema={signals.ema} emaStack={signals.emaStack} close={signals.close} />

      {/* SMMA row */}
      <Tooltip content={
        <div>
          <strong>Smoothed Moving Average (99 period)</strong>
          <br />
          {smmaVal != null && (
            <>
              SMMA: <strong>${fmtPrice(smmaVal)}</strong>
              <br />
              Price is <strong style={{ color: smmaColor }}>{smmaAbove ? 'above' : 'below'}</strong> by {Math.abs(parseFloat(smmaPct || 0))}%
              <br />
            </>
          )}
          <span style={{ color: '#8b949e' }}>Long-term trend filter. Above = bullish, below = bearish.</span>
        </div>
      }>
        <div className="flex items-center gap-2 py-[10px]" style={{ borderBottom: '1px solid rgba(30,45,61,0.5)' }}>
          <span className="text-[13px] tracking-[0.06em] uppercase shrink-0 font-semibold" style={{ color: '#8b949e' }}>
            SMMA 99
          </span>
          <span className="text-[14px] font-bold" style={{ color: smmaColor }}>
            {signals.smma99}
          </span>
          <span className="text-[12px] ml-auto tabular-nums" style={{ color: '#636e7b' }}>
            {smmaVal != null ? `$${fmtPrice(smmaVal)}` : ''}
          </span>
          {smmaPct != null && (
            <span className="text-[12px] font-bold tabular-nums" style={{ color: smmaColor }}>
              {smmaAbove ? '+' : ''}{smmaPct}%
            </span>
          )}
        </div>
      </Tooltip>

      <SignalRow
        name="MACD"
        value={macdText}
        colorClass={macdClass}
        tooltip={
          signals.macd ? (
            <div>
              <strong>MACD (12, 26, 9)</strong>
              <br />
              Line: {signals.macd.macd.toFixed(2)} &middot; Signal: {signals.macd.signal.toFixed(2)}
              <br />
              Histogram: <span style={{ color: signals.macd.histogram > 0 ? '#3fb950' : '#f85149' }}>
                {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(2)}
              </span>
              <br />
              <span style={{ color: '#8b949e' }}>
                {signals.macdDirection === 'BULL' && 'MACD above signal line \u2014 bullish momentum.'}
                {signals.macdDirection === 'BEAR' && 'MACD below signal line \u2014 bearish momentum.'}
                {signals.macdDirection === 'NEUTRAL' && 'MACD near signal line \u2014 momentum unclear.'}
              </span>
            </div>
          ) : (
            <div><strong>MACD</strong>: Not enough data.</div>
          )
        }
      />

      <SignalRow
        name="RSI"
        value={String(signals.rsi)}
        colorClass={rsiClass}
        tooltip={
          <div>
            <strong>RSI (14)</strong>: {signals.rsi}
            <br />
            {signals.rsiZone === 'BULLISH' && <span style={{ color: '#3fb950' }}>Above 55 = Bullish</span>}
            {signals.rsiZone === 'BEARISH' && <span style={{ color: '#f85149' }}>Below 45 = Bearish</span>}
            {signals.rsiZone === 'NEUTRAL' && <span style={{ color: '#d29922' }}>45-55 = Neutral</span>}
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
              <strong>{signals.pattern.name}</strong> &mdash; {signals.pattern.direction}
              <br />
              Body: {signals.pattern.bodyPct}% &middot; Type {signals.pattern.type}
            </div>
          ) : (
            <div>No pattern detected.</div>
          )
        }
      />

      <div
        className="mt-3 py-[8px] px-[10px] rounded text-[13px] font-bold tracking-wide text-center"
        style={{ background: scoreBg, color }}
      >
        SCORE {signals.score}/100
      </div>
    </div>
  );
}
