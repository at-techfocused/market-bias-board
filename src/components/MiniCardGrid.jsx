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
    <div className="rounded-lg p-3 pb-2.5 text-center overflow-hidden" style={{ background: '#111820', border: '1px solid #1e2d3d' }}>
      <div className="text-[10px] tracking-[0.1em] uppercase mb-1.5 truncate font-semibold" style={{ color: '#636e7b' }}>
        {label}
      </div>
      <div className="text-[22px] font-bold tracking-tight truncate leading-tight" style={{ color: c }}>
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
  const macdClass = signals.macdDirection === 'BULL' ? 'bull' : signals.macdDirection === 'BEAR' ? 'bear' : 'neut';
  const volClass = signals.volRatio != null ? (signals.volRatio >= 1.5 ? 'bull' : signals.volRatio >= 1.0 ? 'dim' : 'bear') : 'dim';
  const scoreClass = signals.score >= 60 ? 'bull' : signals.score <= 40 ? 'bear' : 'neut';

  const macdText = signals.macdDirection === 'BULL' ? '▲ Bull' : signals.macdDirection === 'BEAR' ? '▼ Bear' : '◆ Neut';

  return (
    <div className="px-5 py-4">
      <span className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
        Signal Cards
      </span>
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <MiniCard
          label="RSI"
          value={signals.rsi ?? '--'}
          sub={signals.rsiZone?.toLowerCase()}
          colorClass={rsiClass}
          tooltip={
            <div>
              <strong>RSI (14)</strong>: {signals.rsi ?? '--'}
              <br />
              {'> 55 = Bullish, < 45 = Bearish, between = Neutral'}
              <br />
              <span style={{ color: '#8b949e' }}>Momentum gauge — measures trend strength.</span>
            </div>
          }
        />
        <MiniCard
          label="MACD"
          value={macdText}
          sub={signals.macd ? `hist ${signals.macd.histogram > 0 ? '+' : ''}${signals.macd.histogram.toFixed(1)}` : '--'}
          colorClass={macdClass}
          tooltip={
            signals.macd ? (
              <div>
                <strong>MACD (12, 26, 9)</strong>
                <br />
                Line: {signals.macd.macd.toFixed(2)} · Signal: {signals.macd.signal.toFixed(2)}
                <br />
                Histogram: {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(2)}
                <br />
                <span style={{ color: '#8b949e' }}>MACD measures momentum via moving average convergence/divergence.</span>
              </div>
            ) : (
              <div>MACD data not available.</div>
            )
          }
        />
        <MiniCard
          label="VOL"
          value={signals.volRatio != null ? `${signals.volRatio}x` : '--'}
          sub="vs 20 avg"
          colorClass={volClass}
          tooltip={
            <div>
              <strong>Volume Ratio</strong>: {signals.volRatio != null ? `${signals.volRatio}x` : '--'} of 20-period average
              <br />
              {signals.volRatio != null && signals.volRatio >= 1.5 && <span style={{ color: '#3fb950' }}>High volume — conviction confirmed.</span>}
              {signals.volRatio != null && signals.volRatio >= 1.0 && signals.volRatio < 1.5 && <span style={{ color: '#cdd9e5' }}>Average volume — standard activity.</span>}
              {signals.volRatio != null && signals.volRatio < 1.0 && <span style={{ color: '#f85149' }}>Low volume — weak conviction.</span>}
              <br />
              <span style={{ color: '#8b949e' }}>Volume confirms or denies price moves. High volume on trend moves = conviction.</span>
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
              Average True Range as % of price. Higher = more volatile.
              <br />
              <span style={{ color: '#8b949e' }}>Used for stop-loss sizing and position sizing.</span>
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
              0% = lower band, 50% = middle, 100% = upper band.
              <br />
              <span style={{ color: '#8b949e' }}>Shows where price sits within Bollinger Band range.</span>
            </div>
          }
        />
        <MiniCard
          label="SCORE"
          value={signals.score}
          sub="/ 100"
          colorClass={scoreClass}
          tooltip={
            <div>
              <strong>Bias Score</strong>: {signals.score}/100
              <br />
              EMA (20pts) + SMMA (20pts) + RSI (20pts) + MACD (20pts) + Pattern (20pts)
              <br />
              <span style={{ color: '#8b949e' }}>{'≤ 40 = Bearish, ≥ 60 = Bullish, between = Neutral'}</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
