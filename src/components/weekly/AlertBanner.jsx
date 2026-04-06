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
      className="rounded-[12px]"
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        padding: '18px 20px',
        marginBottom: 16,
      }}
    >
      <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
        <span
          className="animate-pulse"
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 10px ${color}`,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
          {alert.title}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '2px 8px',
            borderRadius: 4,
            background: `${color}22`,
            color,
            marginLeft: 'auto',
            textTransform: 'uppercase',
          }}
        >
          {alert.level}
        </span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7 }}>
        {alert.body}
      </div>
    </div>
  );
}
