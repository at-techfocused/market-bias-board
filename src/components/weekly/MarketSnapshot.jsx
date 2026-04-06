function SnapCard({ label, price, change, flagged }) {
  const changeColor = change == null ? 'var(--text-body)' : change > 0 ? 'var(--green)' : change < 0 ? 'var(--red)' : 'var(--text-body)';
  const bgColor = flagged ? 'rgba(200, 124, 0, 0.06)' : 'var(--bg-card)';

  return (
    <div
      className="rounded-[8px] py-2.5 px-3 text-center"
      style={{ background: bgColor, border: '1px solid var(--border)' }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {price != null ? price.toLocaleString('en-US', { minimumFractionDigits: price >= 100 ? 0 : 2 }) : '--'}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: changeColor, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '--'}
      </div>
    </div>
  );
}

export default function MarketSnapshot({ snapshot, macro }) {
  if (!snapshot?.length) {
    return <SectionEmpty label="MARKET SNAPSHOT" />;
  }

  // Flag logic: Oil during war premium, VIX elevated
  const vixElevated = macro?.vix?.price != null && macro.vix.price > 20;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 8 }}>
        MARKET SNAPSHOT
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
        {snapshot.map((s) => (
          <SnapCard key={s.symbol} label={s.label} price={s.price} change={s.change} />
        ))}
        {macro?.vix && (
          <SnapCard label="VIX" price={macro.vix.price} change={macro.vix.changePct} flagged={vixElevated} />
        )}
        {macro?.yield10y && (
          <SnapCard label="10Y Yield" price={macro.yield10y.price} change={macro.yield10y.changePct} />
        )}
      </div>
    </div>
  );
}

function SectionEmpty({ label }) {
  return (
    <div className="rounded-[10px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5 }}>Data unavailable — refresh to retry</div>
    </div>
  );
}
