const CRIT_KEYWORDS = ['Fed', 'FOMC', 'CPI', 'GDP'];

function getImpactLevel(event) {
  if (CRIT_KEYWORDS.some((kw) => event.includes(kw))) return 'CRIT';
  return 'HIGH';
}

function formatDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function EconomicCalendar({ events }) {
  if (!events?.length) {
    return (
      <div className="rounded-[10px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>ECONOMIC CALENDAR</div>
        <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5 }}>Data unavailable — refresh to retry</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px]"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 10 }}>
        ECONOMIC CALENDAR
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {events.map((e, i) => {
          const impact = getImpactLevel(e.event);
          const impactColor = impact === 'CRIT' ? 'var(--red)' : 'var(--amber)';
          return (
            <div key={i} className="flex items-center gap-3" style={{ padding: '4px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '1px 4px',
                  borderRadius: 2,
                  background: `${impactColor}18`,
                  color: impactColor,
                  flexShrink: 0,
                  minWidth: 30,
                  textAlign: 'center',
                }}
              >
                {impact}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.event}
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.6, flexShrink: 0, textAlign: 'right' }}>
                <div>{formatDay(e.date)}</div>
                {e.time && <div style={{ fontSize: 9 }}>{e.time} UTC</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
