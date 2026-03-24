import { TF_DISPLAY, fmtPrice } from '../utils/format';

export default function SmmaCard({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const close = active.close;
  const smma = active.smma99Value;
  const isAbove = active.smma99 === 'ABOVE';
  const distance = smma != null ? ((close - smma) / smma * 100) : null;

  return (
    <div style={{ padding: '14px 16px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          SMMA 99 · {TF_DISPLAY[activeTf]}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: isAbove ? 'var(--green)' : 'var(--red)' }}>
          {isAbove ? 'ABOVE ▲' : 'BELOW ▼'}
        </span>
      </div>
      <div className="grid grid-cols-3 rounded-[7px] overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="py-3 text-center">
          <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.05em', marginBottom: 4 }}>PRICE</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            ${fmtPrice(close)}
          </div>
        </div>
        <div className="py-3 text-center" style={{ borderLeft: '1px solid var(--border-inner)', borderRight: '1px solid var(--border-inner)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.05em', marginBottom: 4 }}>SMMA 99</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
            ${fmtPrice(smma)}
          </div>
        </div>
        <div className="py-3 text-center">
          <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.05em', marginBottom: 4 }}>DISTANCE</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: distance != null ? (distance >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-body)' }}>
            {distance != null ? `${distance >= 0 ? '+' : ''}${distance.toFixed(2)}%` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}
