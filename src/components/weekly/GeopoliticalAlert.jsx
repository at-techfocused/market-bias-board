export default function GeopoliticalAlert({ alert }) {
  if (!alert || alert.level !== 'critical' || !alert.active) {
    return (
      <div
        className="rounded-[10px]"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>
          GEOPOLITICAL ALERTS
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.4 }}>
          No active geopolitical alerts
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px]"
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--red)',
        padding: '12px 14px',
        marginBottom: 10,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase' }}>
          GEOPOLITICAL ALERT
        </div>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '1px 5px',
            borderRadius: 3,
            background: 'rgba(224,85,85,0.15)',
            color: 'var(--red)',
          }}
        >
          CRITICAL
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        {alert.title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.6 }}>
        {alert.body}
      </div>
    </div>
  );
}
