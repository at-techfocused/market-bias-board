const STORAGE_KEY = 'biasboard_watchlist';

function getWatchlist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function formatDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatRevenue(rev) {
  if (rev == null) return '--';
  if (rev >= 1e9) return `$${(rev / 1e9).toFixed(1)}B`;
  if (rev >= 1e6) return `$${(rev / 1e6).toFixed(0)}M`;
  return `$${rev.toLocaleString()}`;
}

export default function EarningsCalendar({ earnings }) {
  if (!earnings?.length) {
    return (
      <div className="rounded-[12px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 8 }}>EARNINGS CALENDAR</div>
        <div style={{ fontSize: 13, color: 'var(--text-body)', opacity: 0.4 }}>No major earnings this week</div>
      </div>
    );
  }

  const watchlist = getWatchlist();
  const watchSymbols = watchlist.map((t) => t.includes(':') ? t.split(':')[1].replace('USDT', '') : t);

  return (
    <div
      className="rounded-[12px]"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '18px 20px', marginBottom: 16 }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 14 }}>
        EARNINGS CALENDAR
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {earnings.map((e, i) => {
          const isWatched = watchSymbols.includes(e.symbol);
          return (
            <div key={i} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: i < earnings.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 60, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isWatched && <span style={{ color: 'var(--amber)', marginRight: 4 }}>★</span>}
                  {e.symbol}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-body)' }}>
                  EPS est: {e.epsEstimated != null ? `$${e.epsEstimated.toFixed(2)}` : '--'} · Rev: {formatRevenue(e.revenueEstimated)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.6, flexShrink: 0, textAlign: 'right' }}>
                <div>{formatDay(e.date)}</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>{e.time === 'bmo' ? 'Pre-market' : e.time === 'amc' ? 'After-close' : e.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
