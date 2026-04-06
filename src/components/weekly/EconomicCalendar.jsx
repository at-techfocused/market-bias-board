const CRIT_KEYWORDS = ['Fed', 'FOMC', 'CPI', 'GDP', 'Nonfarm', 'NFP'];

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
      <div className="rounded-[10px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>ECONOMIC CALENDAR</div>
        <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.4 }}>No high-impact events this week</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px]"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 12 }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 10 }}>
        ECONOMIC CALENDAR
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.map((e, i) => {
          const impact = getImpactLevel(e.event);
          const impactColor = impact === 'CRIT' ? 'var(--red)' : 'var(--amber)';
          return (
            <div key={i} className="flex items-center gap-3" style={{ padding: '7px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '1px 5px',
                  borderRadius: 2,
                  background: `${impactColor}18`,
                  color: impactColor,
                  flexShrink: 0,
                  minWidth: 32,
                  textAlign: 'center',
                }}
              >
                {impact}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.event}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.6, flexShrink: 0, textAlign: 'right' }}>
                <div>{formatDay(e.date)}</div>
                {e.time && <div style={{ fontSize: 10, marginTop: 1 }}>{e.time} UTC</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
