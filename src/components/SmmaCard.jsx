import { fmtPrice } from '../utils/format';

function DistanceGauge({ distance }) {
  if (distance == null) return null;

  // Clamp to ±10% range for display, center is 0
  const maxRange = 10;
  const clamped = Math.max(-maxRange, Math.min(maxRange, distance));
  const pct = ((clamped + maxRange) / (maxRange * 2)) * 100; // 0–100, 50 = center
  const color = distance >= 0 ? 'var(--green)' : 'var(--red)';

  // Determine fill: from center (50%) outward in the direction of the value
  const fillLeft = distance >= 0 ? '50%' : `${pct}%`;
  const fillWidth = distance >= 0 ? `${pct - 50}%` : `${50 - pct}%`;

  return (
    <div style={{ padding: '0 12px', marginTop: 6 }}>
      <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        {/* Center tick */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1,
          background: 'var(--text-body)', opacity: 0.3, zIndex: 1,
        }} />
        {/* Filled portion from center */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: fillLeft, width: fillWidth,
          background: color, borderRadius: 3, opacity: 0.8,
          transition: 'all 0.3s ease',
        }} />
      </div>
      <div className="flex justify-between" style={{ marginTop: 3 }}>
        <span style={{ fontSize: 8, color: 'var(--text-body)', opacity: 0.4 }}>−{maxRange}%</span>
        <span style={{ fontSize: 8, color: 'var(--text-body)', opacity: 0.4 }}>0</span>
        <span style={{ fontSize: 8, color: 'var(--text-body)', opacity: 0.4 }}>+{maxRange}%</span>
      </div>
    </div>
  );
}

export default function SmmaCard({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const close = active.close;
  const smma = active.smma99Value;
  const isAbove = active.smma99 === 'ABOVE';
  const distance = smma != null ? ((close - smma) / smma * 100) : null;

  return (
    <div style={{ padding: '0 16px 14px' }}>
      <div className="rounded-[7px] overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-3">
          <div className="py-3.5 text-center">
            <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.05em', marginBottom: 4 }}>PRICE</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              ${fmtPrice(close)}
            </div>
          </div>
          <div className="py-3.5 text-center" style={{ borderLeft: '1px solid var(--border-inner)', borderRight: '1px solid var(--border-inner)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.05em', marginBottom: 4 }}>SMMA 99</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
              ${fmtPrice(smma)}
            </div>
          </div>
          <div className="py-3.5 text-center">
            <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.05em', marginBottom: 4 }}>DISTANCE</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: distance != null ? (distance >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-body)' }}>
              {distance != null ? `${distance >= 0 ? '+' : ''}${distance.toFixed(2)}%` : '--'}
            </div>
          </div>
        </div>
        <DistanceGauge distance={distance} />
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
