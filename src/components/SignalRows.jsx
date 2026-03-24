import { TF_DISPLAY } from '../utils/format';

function getSignalColor(type) {
  if (type === 'BULL' || type === 'BULLISH' || type === 'ABOVE') return 'var(--green)';
  if (type === 'BEAR' || type === 'BEARISH' || type === 'BELOW') return 'var(--red)';
  return 'var(--amber)';
}

function SectionLabel({ children }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <span style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
        {children}
      </span>
    </div>
  );
}

export default function SignalRows({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const rows = [
    {
      name: 'EMA STACK',
      detail: active.emaStack === 'BULL' ? 'Price > 20 > 50 > 100 > 200' : active.emaStack === 'BEAR' ? 'Price < 20 < 50 < 100 < 200' : 'EMAs not aligned',
      value: active.emaStack,
      color: getSignalColor(active.emaStack),
    },
    {
      name: 'SMMA 99',
      detail: `Price ${active.smma99?.toLowerCase() || '--'} SMMA 99`,
      value: active.smma99,
      color: getSignalColor(active.smma99),
    },
    {
      name: 'RSI 14',
      detail: `${active.rsi ?? '--'} — ${active.rsiZone?.toLowerCase() || '--'} zone`,
      value: active.rsiZone,
      color: getSignalColor(active.rsiZone),
    },
    {
      name: 'MACD',
      detail: active.macd ? `Hist ${active.macd.histogram > 0 ? '+' : ''}${active.macd.histogram.toFixed(4)}` : '--',
      value: active.macdDirection,
      color: getSignalColor(active.macdDirection),
    },
    {
      name: 'VOLUME',
      detail: active.volRatio != null ? `${active.volRatio}x 20-period avg` : '--',
      value: active.volRatio != null ? (active.volRatio >= 1.5 ? 'HIGH' : active.volRatio >= 0.8 ? 'AVG' : 'LOW') : '--',
      color: active.volRatio != null ? (active.volRatio >= 1.5 ? 'var(--green)' : active.volRatio >= 0.8 ? 'var(--amber)' : 'var(--red)') : 'var(--text-body)',
    },
  ];

  return (
    <div>
      <SectionLabel>SIGNALS · {TF_DISPLAY[activeTf]}</SectionLabel>
      <div className="mx-4 mb-4 rounded-[7px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {rows.map((row, i) => (
          <div key={row.name} className="flex items-center justify-between px-3 py-2.5"
            style={i < rows.length - 1 ? { borderBottom: '1px solid var(--border-inner)' } : undefined}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.07em' }}>{row.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.6, marginTop: 1 }}>{row.detail}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: row.color }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: row.color }}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
