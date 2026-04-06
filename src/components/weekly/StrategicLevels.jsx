export default function StrategicLevels({ levels }) {
  if (!levels?.length) {
    return (
      <div className="rounded-[10px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>STRATEGIC LEVELS</div>
        <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5 }}>Data unavailable — refresh to retry</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 8 }}>
        STRATEGIC LEVELS
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {levels.map((level, i) => (
          <div
            key={i}
            className="rounded-[10px]"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{level.ticker}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{level.price}</span>
            </div>
            <div className="flex gap-4" style={{ marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 2 }}>SUPPORT</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{level.support}</div>
              </div>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 2 }}>RESISTANCE</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{level.resistance}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.5 }}>{level.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
