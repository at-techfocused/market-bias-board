import { fmtPrice } from '../utils/format';

export default function EntryStopTarget({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const close = active.close;
  const atr = active.atr;
  if (atr == null) return null;

  const isBull = active.score > 50;
  const entry = close;
  const stop = isBull ? close - atr * 1.5 : close + atr * 1.5;
  const target = isBull ? close + atr * 3 : close - atr * 3;
  const stopPct = Math.abs((stop - entry) / entry * 100);
  const targetPct = Math.abs((target - entry) / entry * 100);
  const rr = stopPct > 0 ? (targetPct / stopPct) : null;

  const columns = [
    {
      label: 'ENTRY',
      price: entry,
      borderColor: '#1c2e3d',
      borderWidth: 1,
      sub: `${isBull ? 'LONG' : 'SHORT'} · R:R ${rr != null ? rr.toFixed(1) : '--'}:1`,
    },
    {
      label: 'STOP',
      price: stop,
      borderColor: '#e05555',
      borderWidth: 2,
      sub: `-${stopPct.toFixed(1)}% · ${(atr * 1.5).toFixed(2)} ATR`,
    },
    {
      label: 'TARGET',
      price: target,
      borderColor: '#5bc98a',
      borderWidth: 2,
      sub: `+${targetPct.toFixed(1)}% · ${(atr * 3).toFixed(2)} ATR`,
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {columns.map((col) => (
        <div key={col.label} style={{
          flex: 1,
          borderTop: `${col.borderWidth}px solid ${col.borderColor}`,
          paddingTop: 10,
        }}>
          <div style={{ fontSize: 9, color: '#c8d8e8', letterSpacing: '0.1em', marginBottom: 4 }}>
            {col.label}
          </div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4,
          }}>
            ${fmtPrice(col.price)}
          </div>
          <div style={{ fontSize: 9, color: '#c8d8e8', opacity: 0.6 }}>
            {col.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
