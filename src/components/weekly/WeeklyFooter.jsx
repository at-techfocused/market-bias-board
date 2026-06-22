export default function WeeklyFooter({ weekLabel, generatedAt, snapshotUpdatedAt }) {
  const fmtDate = (iso) => {
    if (!iso) return 'Unknown';
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false,
    }) + ' UTC';
  };

  return (
    <div style={{ padding: '12px 0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.35, lineHeight: 1.8 }}>
        BiasBoard Weekly Brief · Week of {weekLabel || '--'} · Not financial advice · AI assisted
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-body)', opacity: 0.25, lineHeight: 1.8 }}>
        Narrative updated {fmtDate(generatedAt)}
        {snapshotUpdatedAt && snapshotUpdatedAt !== generatedAt && (
          <> · Prices updated {fmtDate(snapshotUpdatedAt)}</>
        )}
      </div>
    </div>
  );
}
