const CRIT_KEYWORDS = ['Fed', 'FOMC', 'CPI', 'GDP'];

export default function WhatToWatch({ economic, earnings }) {
  const watchlist = (() => {
    try {
      const stored = localStorage.getItem('biasboard_watchlist');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  })();

  const watchSymbols = watchlist.map((t) => t.includes(':') ? t.split(':')[1].replace('USDT', '') : t);

  const items = [];

  // Top economic events
  if (economic?.length) {
    for (const e of economic.slice(0, 3)) {
      const isCrit = CRIT_KEYWORDS.some((kw) => e.event.includes(kw));
      items.push({
        title: e.event,
        sub: `${e.date} · ${e.country}`,
        color: isCrit ? 'var(--red)' : 'var(--amber)',
      });
    }
  }

  // Starred earnings
  if (earnings?.length) {
    for (const e of earnings) {
      if (watchSymbols.includes(e.symbol) && items.length < 5) {
        items.push({
          title: `${e.symbol} Earnings`,
          sub: `${e.date} · ${e.time === 'bmo' ? 'Pre-market' : e.time === 'amc' ? 'After-close' : e.time}`,
          color: 'var(--blue)',
        });
      }
    }
  }

  // Fill remaining with non-starred earnings
  if (items.length < 5 && earnings?.length) {
    for (const e of earnings) {
      if (!watchSymbols.includes(e.symbol) && items.length < 5) {
        items.push({
          title: `${e.symbol} Earnings`,
          sub: `${e.date} · ${e.time === 'bmo' ? 'Pre-market' : e.time === 'amc' ? 'After-close' : e.time}`,
          color: 'var(--blue)',
        });
      }
    }
  }

  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 12 }}>
        WHAT TO WATCH
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-[10px] flex items-start gap-3"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '14px 16px' }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
                marginTop: 4,
              }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.6, marginTop: 4 }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
