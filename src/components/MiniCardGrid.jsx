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
    <div className="rounded-lg p-3 pb-2.5 text-center overflow-hidden" style={{ background: '#0d1219', border: '1px solid #1e2d3d' }}>
      <div className="text-[10px] tracking-[0.1em] uppercase mb-1.5 truncate font-semibold" style={{ color: '#636e7b' }}>
        {label}
      </div>
      <div className="text-[22px] font-bold tracking-tight truncate leading-tight" style={{ color: c }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-1 tracking-wide truncate" style={{ color: typeof sub === 'object' ? undefined : '#636e7b' }}>
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

// P9: Volume label
function getVolLabel(ratio) {
  if (ratio == null) return { text: '--', color: '#636e7b' };
  if (ratio < 0.5) return { text: 'LOW CONV.', color: '#f85149' };
  if (ratio <= 1.5) return { text: 'AVERAGE', color: '#d29922' };
  return { text: 'CONFIRMED', color: '#3fb950' };
}

export default function MiniCardGrid({ signals, tfLabel }) {
  if (!signals) return null;

  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const macdClass = signals.macdDirection === 'BULL' ? 'bull' : signals.macdDirection === 'BEAR' ? 'bear' : 'neut';
  const scoreClass = signals.score >= 60 ? 'bull' : signals.score <= 40 ? 'bear' : 'neut';

  const macdText = signals.macdDirection === 'BULL' ? '\u25B2 Bull' : signals.macdDirection === 'BEAR' ? '\u25BC Bear' : '\u25C6 Neut';

  // P9: VOL formatting
  const vol = signals.volRatio;
  const volLabel = getVolLabel(vol);
  const volClass = vol != null ? (vol >= 1.5 ? 'bull' : vol < 0.5 ? 'bear' : 'neut') : 'dim';
  const volValue = vol != null ? `${vol}x` : '--';

  // P7: TF label for display
  const tf = tfLabel || '4H';

  return (
    <div className="px-5 py-4">
      <span className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
        Signal Cards &middot; {tf}
      </span>
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        {/* P7: RSI with TF label */}
        <MiniCard
          label="RSI"
          value={signals.rsi ?? '--'}
          sub={<span style={{ color: '#636e7b' }}>{signals.rsiZone?.toLowerCase()} &middot; {tf}</span>}
          colorClass={rsiClass}
          tooltip={
            <div>
              <strong>RSI (14) &middot; {tf}</strong>: {signals.rsi ?? '--'}
              <br />
              {'> 55 = Bullish, < 45 = Bearish'}
            </div>
          }
        />
        <MiniCard
          label="MACD"
          value={macdText}
          sub={signals.macd ? <span style={{ color: '#636e7b' }}>hist {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(1)}</span> : '--'}
          colorClass={macdClass}
          tooltip={
            signals.macd ? (
              <div>
                <strong>MACD (12,26,9) &middot; {tf}</strong>
                <br />
                Line: {signals.macd.macd.toFixed(2)} &middot; Signal: {signals.macd.signal.toFixed(2)}
                <br />
                Histogram: {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(2)}
              </div>
            ) : null
          }
        />
        {/* P9: VOL card with context label */}
        <MiniCard
          label="VOL"
          value={<span>{volValue} <span className="text-[12px]">AVG</span></span>}
          sub={<span style={{ color: volLabel.color, fontWeight: 'bold' }}>{volLabel.text}</span>}
          colorClass={volClass}
          tooltip={
            <div>
              <strong>Volume Ratio &middot; {tf}</strong>: {volValue} of 20-period average
              <br />
              {'< 0.5x = Low conviction (red)'}
              <br />
              {'0.5x\u20131.5x = Average (amber)'}
              <br />
              {'> 1.5x = Confirmed (green)'}
            </div>
          }
        />
        {/* P7: ATR with TF label */}
        <MiniCard
          label="ATR%"
          value={signals.atrPct != null ? `${signals.atrPct}%` : '--'}
          sub={<span style={{ color: '#636e7b' }}>volatility &middot; {tf}</span>}
          colorClass="dim"
          tooltip={
            <div>
              <strong>ATR% (14) &middot; {tf}</strong>: {signals.atrPct != null ? `${signals.atrPct}%` : '--'}
              <br />
              Average True Range as % of price.
            </div>
          }
        />
        <MiniCard
          label="BB%"
          value={signals.bbPct != null ? `${signals.bbPct}%` : '--'}
          sub={<span style={{ color: '#636e7b' }}>band position</span>}
          colorClass="neut"
          tooltip={
            <div>
              <strong>Bollinger Band %</strong>: {signals.bbPct != null ? `${signals.bbPct}%` : '--'}
              <br />
              0% = lower, 50% = middle, 100% = upper band.
            </div>
          }
        />
        {/* P7: Score with TF label */}
        <MiniCard
          label="SCORE"
          value={signals.score}
          sub={<span style={{ color: '#636e7b' }}>/ 100 &middot; {tf}</span>}
          colorClass={scoreClass}
          tooltip={
            <div>
              <strong>Bias Score &middot; {tf}</strong>: {signals.score}/100
              <br />
              EMA + SMMA + RSI + MACD + Pattern (20pts each)
            </div>
          }
        />
      </div>
    </div>
  );
}
