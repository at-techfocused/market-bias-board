import { fmtPrice } from '../utils/format';

export default function EntryStopTarget({ signals, activeTf }) {
  const active = signals?.[activeTf];
  if (!active) return null;

  const close = active.close;
  const atr = active.atr;
  if (atr == null) return null;

  const isBull = active.score > 50;
  const entry = close;
  const stop = isBull ? close - atr * 1.5 : close + atr * 1.5;
  const target = isBull ? close + atr * 3 : close - atr * 3;
  const stopPct = Math.abs((stop - entry) / entry * 100);
  const targetPct = Math.abs((target - entry) / entry * 100);
  const rr = stopPct > 0 ? (targetPct / stopPct) : null;

  // Sort highest price on top
  const levels = [
    { label: 'STOP', price: stop, color: 'var(--red)' },
    { label: 'ENTRY', price: entry, color: 'var(--text-primary)' },
    { label: 'TARGET', price: target, color: 'var(--green)' },
  ].sort((a, b) => b.price - a.price);

  const range = Math.max(...levels.map(l => l.price)) - Math.min(...levels.map(l => l.price));

  return (
    <div style={{ padding: '0 16px 14px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-body)', letterSpacing: '0.1em' }}>
          SETUP
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: isBull ? 'var(--green)' : 'var(--red)',
          letterSpacing: '0.05em',
        }}>
          {isBull ? 'LONG' : 'SHORT'} · R:R {rr != null ? rr.toFixed(1) : '--'}:1
        </span>
      </div>

      {/* Price levels ladder */}
      <div className="rounded-[7px] overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 12px' }}>
          {levels.map((level, i) => {
            const isBottom = i === levels.length - 1;
            const nextLevel = levels[i + 1];

            // Determine zone type between this and next level
            let isProfit = false;
            if (!isBottom && nextLevel) {
              isProfit = (
                (level.label === 'TARGET' && nextLevel.label === 'ENTRY') ||
                (level.label === 'ENTRY' && nextLevel.label === 'TARGET')
              );
            }
            const zoneColor = isProfit ? 'var(--green)' : 'var(--red)';
            const zoneBg = isProfit ? 'rgba(91,201,138,0.08)' : 'rgba(224,85,85,0.08)';
            const zoneBorder = isProfit ? 'rgba(91,201,138,0.25)' : 'rgba(224,85,85,0.25)';
            const zoneText = isProfit ? 'rgba(91,201,138,0.6)' : 'rgba(224,85,85,0.6)';
            const zonePct = isProfit ? targetPct : stopPct;
            const gapPx = !isBottom && nextLevel
              ? Math.max(((level.price - nextLevel.price) / range) * 44, 14)
              : 0;

            return (
              <div key={level.label}>
                {/* Level row */}
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10, fontWeight: 700, color: level.color, letterSpacing: '0.06em', width: 50 }}>
                    {level.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: level.color, opacity: 0.4 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: level.color, fontVariantNumeric: 'tabular-nums' }}>
                    ${fmtPrice(level.price)}
                  </span>
                </div>

                {/* Shaded zone between levels */}
                {!isBottom && (
                  <div style={{
                    height: gapPx,
                    marginLeft: 4,
                    marginRight: 4,
                    background: zoneBg,
                    borderLeft: `1px dashed ${zoneBorder}`,
                    borderRight: `1px dashed ${zoneBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: zoneText,
                      letterSpacing: '0.03em',
                    }}>
                      {isProfit ? '+' : '-'}{zonePct.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
