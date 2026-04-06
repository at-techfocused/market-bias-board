export default function WeeklyFooter({ weekLabel, generatedAt }) {
  const formatted = generatedAt
    ? new Date(generatedAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        hour12: false,
      }) + ' UTC'
    : 'Unknown';

  return (
    <div style={{ padding: '24px 0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.35, lineHeight: 1.8 }}>
        BiasBoard Weekly Brief · Week of {weekLabel || '--'} · Not financial advice · AI assisted
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.25, marginTop: 4 }}>
        Updated {formatted}
      </div>
    </div>
  );
}
