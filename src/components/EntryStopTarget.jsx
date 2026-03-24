import { fmtPrice } from '../utils/format';

export default function EntryStopTarget({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const close = active.close;
  const atr = active.atr;
  const isBull = active.score > 50;
  const entry = close;
  const stop = atr != null ? (isBull ? close - atr * 1.5 : close + atr * 1.5) : null;
  const target = atr != null ? (isBull ? close + atr * 3 : close - atr * 3) : null;
  const stopPct = stop != null ? Math.abs((stop - entry) / entry * 100) : null;
  const targetPct = target != null ? Math.abs((target - entry) / entry * 100) : null;
  const rr = stopPct != null && stopPct > 0 ? (targetPct / stopPct) : null;

  const cols = [
    { label: 'ENTRY', value: entry, color: 'var(--text-primary)', accent: 'var(--border)', sub: 'market' },
    { label: 'STOP', value: stop, color: 'var(--red)', accent: 'var(--red)', sub: stopPct != null ? `${stopPct.toFixed(1)}% · 1.5× ATR` : '--' },
    { label: 'TARGET', value: target, color: 'var(--green)', accent: 'var(--green)', sub: targetPct != null ? `${targetPct.toFixed(1)}% · R:R ${rr != null ? rr.toFixed(1) : '--'}:1` : '--' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4" style={{ padding: '0 16px 14px' }}>
      {cols.map((col) => (
        <div key={col.label}>
          <div className="h-[2px] rounded-full" style={{ background: col.accent, marginBottom: 10 }} />
          <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            {col.label}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>
            ${fmtPrice(col.value)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.6, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {col.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
