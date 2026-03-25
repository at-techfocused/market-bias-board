import Tooltip from './Tooltip';

function getSignalColor(type) {
  if (type === 'BULL' || type === 'BULLISH' || type === 'ABOVE') return 'var(--green)';
  if (type === 'BEAR' || type === 'BEARISH' || type === 'BELOW') return 'var(--red)';
  return 'var(--amber)';
}

export default function SignalRows({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const rows = [
    {
      name: 'EMA STACK',
      detail: active.emaStack === 'BULL' ? 'Price > 20 > 50 > 100 > 200' : active.emaStack === 'BEAR' ? 'Price < 20 < 50 < 100 < 200' : 'EMAs not aligned',
      value: active.emaStack, color: getSignalColor(active.emaStack),
      tip: 'Exponential Moving Average alignment. Bull = price above all EMAs in order. Bear = price below all. Mixed = EMAs crossing, no clear trend.',
    },
    {
      name: 'SMMA 99',
      detail: `Price ${active.smma99?.toLowerCase() || '--'} SMMA 99`,
      value: active.smma99, color: getSignalColor(active.smma99),
      tip: 'Smoothed Moving Average (99-period). Acts as a dynamic support/resistance. Price above = bullish bias, below = bearish bias.',
    },
    {
      name: 'RSI 14',
      detail: `${active.rsi ?? '--'} — ${active.rsiZone?.toLowerCase() || '--'} zone`,
      value: active.rsiZone, color: getSignalColor(active.rsiZone),
      tip: 'Relative Strength Index (14-period). Above 55 = bullish momentum, below 45 = bearish momentum, 45–55 = neutral zone.',
    },
    {
      name: 'MACD',
      detail: active.macd ? `Hist ${active.macd.histogram > 0 ? '+' : ''}${active.macd.histogram.toFixed(4)}` : '--',
      value: active.macdDirection, color: getSignalColor(active.macdDirection),
      tip: 'Moving Average Convergence Divergence. Bull = MACD line above signal with positive histogram. Bear = below signal with negative histogram.',
    },
    {
      name: 'VOLUME',
      detail: active.volRatio != null ? `${active.volRatio}x 20-period avg` : '--',
      value: active.volRatio != null ? (active.volRatio >= 1.5 ? 'HIGH' : active.volRatio >= 0.8 ? 'AVG' : 'LOW') : '--',
      color: active.volRatio != null ? (active.volRatio >= 1.5 ? 'var(--green)' : active.volRatio >= 0.8 ? 'var(--amber)' : 'var(--red)') : 'var(--text-body)',
      tip: 'Current volume relative to 20-period average. High volume confirms moves, low volume suggests weakness.',
    },
  ];

  return (
    <div>
      <div className="rounded-[7px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {rows.map((row, i) => (
          <Tooltip key={row.name} content={
            <div><div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{row.name}</div>{row.tip}</div>
          }>
            <div className="flex items-center justify-between px-3 py-2.5"
              style={i < rows.length - 1 ? { borderBottom: '1px solid var(--border-inner)' } : undefined}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-body)', letterSpacing: '0.07em' }}>{row.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.6, marginTop: 1 }}>{row.detail}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[6px] h-[6px] rounded-full" style={{ background: row.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: row.color }}>{row.value}</span>
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
