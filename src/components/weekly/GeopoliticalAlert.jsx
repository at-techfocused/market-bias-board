export default function GeopoliticalAlert({ alert }) {
  if (!alert || alert.level !== 'critical' || !alert.active) {
    return (
      <div
        className="rounded-[12px]"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 16 }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 8 }}>
          GEOPOLITICAL ALERTS
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-body)', opacity: 0.4 }}>
          No active geopolitical alerts
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[12px]"
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--red)',
        padding: '18px 20px',
        marginBottom: 16,
      }}
    >
      <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase' }}>
          GEOPOLITICAL ALERT
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(224,85,85,0.15)',
            color: 'var(--red)',
          }}
        >
          CRITICAL
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {alert.title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7 }}>
        {alert.body}
      </div>
    </div>
  );
}
