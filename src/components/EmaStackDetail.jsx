import { fmtPrice } from '../utils/format';

export default function EmaStackDetail({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active?.ema) return null;

  const close = active.close;
  const ema = active.ema;
  const smma = active.smma99Value;

  const rows = [
    { label: 'EMA 20', value: ema.ema20, color: 'var(--ema-20)', width: '100%' },
    { label: 'EMA 50', value: ema.ema50, color: 'var(--ema-50)', width: '85%' },
    { label: 'EMA 100', value: ema.ema100, color: 'var(--ema-100)', width: '70%' },
    { label: 'EMA 200', value: ema.ema200, color: 'var(--ema-200)', width: '55%' },
    { label: 'SMMA 99', value: smma, color: 'var(--smma-99)', width: '62%' },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const above = row.value != null && close > row.value;
          const fillColor = above ? 'var(--green)' : 'var(--red)';
          return (
            <div key={row.label} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0" style={{ width: 72 }}>
                <div className="w-[6px] h-[6px] rounded-full" style={{ background: row.color }} />
                <span style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>{row.label}</span>
              </div>
              <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: row.width, background: fillColor }} />
              </div>
              <span className="shrink-0" style={{ fontSize: 12, color: row.color, fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: 80, textAlign: 'right' }}>
                ${fmtPrice(row.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
