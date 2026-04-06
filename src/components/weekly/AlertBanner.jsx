const LEVEL_COLORS = {
  critical: 'var(--red)',
  high: 'var(--amber)',
  standard: 'var(--blue)',
};

export default function AlertBanner({ alert }) {
  if (!alert?.active) return null;

  const color = LEVEL_COLORS[alert.level] || 'var(--blue)';

  return (
    <div
      className="rounded-[10px]"
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        padding: '14px 16px',
        marginBottom: 12,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <span
          className="animate-pulse"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          {alert.title}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '1px 6px',
            borderRadius: 3,
            background: `${color}22`,
            color,
            marginLeft: 'auto',
            textTransform: 'uppercase',
          }}
        >
          {alert.level}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.6 }}>
        {alert.body}
      </div>
    </div>
  );
}
