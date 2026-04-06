export default function StrategicLevels({ levels }) {
  if (!levels?.length) {
    return (
      <div className="rounded-[12px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 8 }}>STRATEGIC LEVELS</div>
        <div style={{ fontSize: 13, color: 'var(--text-body)', opacity: 0.5 }}>Levels not available</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 12 }}>
        STRATEGIC LEVELS
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {levels.map((level, i) => (
          <div
            key={i}
            className="rounded-[12px]"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '18px 20px' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{level.ticker}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{level.price}</span>
            </div>
            <div className="flex gap-6" style={{ marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 4 }}>SUPPORT</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{level.support}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 4 }}>RESISTANCE</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{level.resistance}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>{level.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
