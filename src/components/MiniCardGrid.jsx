import Tooltip from './Tooltip';

const COLORS = { bull: '#3fb950', bear: '#f85149', neut: '#d29922', dim: '#8b949e' };

function MiniCard({ label, value, sub, colorClass, tooltip }) {
  const c = COLORS[colorClass] || '#cdd9e5';

  const card = (
    <div className="rounded-md px-3 py-3 text-center" style={{ background: '#0d1219' }}>
      <div className="text-[10px] tracking-[0.12em] uppercase mb-2 font-semibold" style={{ color: '#4d5768' }}>
        {label}
      </div>
      <div className="text-[22px] font-bold tabular-nums tracking-tight leading-none" style={{ color: c }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-1.5 truncate" style={{ color: typeof sub === 'object' ? undefined : '#4d5768' }}>
          {sub}
        </div>
      )}
    </div>
  );

  return tooltip ? <Tooltip content={tooltip}>{card}</Tooltip> : card;
}

function getVolLabel(ratio) {
  if (ratio == null) return { text: '--', color: '#4d5768' };
  if (ratio < 0.5) return { text: 'LOW', color: '#f85149' };
  if (ratio <= 1.5) return { text: 'AVG', color: '#d29922' };
  return { text: 'HIGH', color: '#3fb950' };
}

export default function MiniCardGrid({ signals, tfLabel }) {
  if (!signals) return null;

  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const macdClass = signals.macdDirection === 'BULL' ? 'bull' : signals.macdDirection === 'BEAR' ? 'bear' : 'neut';
  const scoreClass = signals.score >= 60 ? 'bull' : signals.score <= 40 ? 'bear' : 'neut';
  const macdText = signals.macdDirection === 'BULL' ? '\u25B2 Bull' : signals.macdDirection === 'BEAR' ? '\u25BC Bear' : '\u25C6 Neut';

  const vol = signals.volRatio;
  const volLabel = getVolLabel(vol);
  const volClass = vol != null ? (vol >= 1.5 ? 'bull' : vol < 0.5 ? 'bear' : 'neut') : 'dim';
  const volValue = vol != null ? `${vol}x` : '--';
  const tf = tfLabel || '4H';

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-3 gap-2">
        <MiniCard label="RSI" value={signals.rsi ?? '--'} colorClass={rsiClass}
          sub={<span style={{ color: '#4d5768' }}>{signals.rsiZone?.toLowerCase()}</span>}
          tooltip={<div><strong>RSI (14) &middot; {tf}</strong>: {signals.rsi ?? '--'}<br />{'> 55 = Bullish, < 45 = Bearish'}</div>}
        />
        <MiniCard label="MACD" value={macdText} colorClass={macdClass}
          sub={signals.macd ? <span style={{ color: '#4d5768' }}>hist {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(1)}</span> : '--'}
          tooltip={signals.macd ? <div><strong>MACD (12,26,9) &middot; {tf}</strong><br />Line: {signals.macd.macd.toFixed(2)} &middot; Signal: {signals.macd.signal.toFixed(2)}<br />Histogram: {signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(2)}</div> : null}
        />
        <MiniCard label="VOL" value={volValue} colorClass={volClass}
          sub={<span style={{ color: volLabel.color, fontWeight: 600 }}>{volLabel.text}</span>}
          tooltip={<div><strong>Volume Ratio &middot; {tf}</strong>: {volValue} of 20-period avg<br />{'< 0.5x = Low (red), 0.5\u20131.5x = Avg (amber), > 1.5x = High (green)'}</div>}
        />
        <MiniCard label="ATR%" value={signals.atrPct != null ? `${signals.atrPct}%` : '--'} colorClass="dim"
          sub={<span style={{ color: '#4d5768' }}>volatility</span>}
          tooltip={<div><strong>ATR% (14) &middot; {tf}</strong>: {signals.atrPct != null ? `${signals.atrPct}%` : '--'}<br />Average True Range as % of price.</div>}
        />
        <MiniCard label="BB%" value={signals.bbPct != null ? `${signals.bbPct}%` : '--'} colorClass="neut"
          sub={<span style={{ color: '#4d5768' }}>band pos</span>}
          tooltip={<div><strong>Bollinger Band %</strong>: {signals.bbPct != null ? `${signals.bbPct}%` : '--'}<br />0% = lower, 50% = middle, 100% = upper band.</div>}
        />
        <MiniCard label="SCORE" value={signals.score} colorClass={scoreClass}
          sub={<span style={{ color: '#4d5768' }}>/ 100</span>}
          tooltip={<div><strong>Bias Score &middot; {tf}</strong>: {signals.score}/100<br />EMA + SMMA + RSI + MACD + Pattern (20pts each)</div>}
        />
      </div>
    </div>
  );
}
