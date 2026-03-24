import { fmtPrice } from '../utils/format';

export default function ChartOverlay({ signals, activeTf }) {
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

  // Determine vertical ordering: highest price on top
  const levels = [
    { label: 'TARGET', price: target, color: '#5bc98a', bg: 'rgba(91,201,138,0.08)' },
    { label: 'ENTRY', price: entry, color: '#e8f0f8', bg: 'transparent' },
    { label: 'STOP', price: stop, color: '#e05555', bg: 'rgba(224,85,85,0.08)' },
  ].sort((a, b) => b.price - a.price);

  // Calculate proportional heights for the R:R box
  const allPrices = [target, entry, stop];
  const maxP = Math.max(...allPrices);
  const minP = Math.min(...allPrices);
  const range = maxP - minP;

  // Compute zone heights (profit zone and risk zone)
  const profitHeight = Math.abs(target - entry);
  const riskHeight = Math.abs(stop - entry);
  const profitPct = (profitHeight / range) * 100;
  const riskPct = (riskHeight / range) * 100;

  const lineStyle = (color) => ({
    height: 1,
    background: color,
    opacity: 0.9,
    position: 'relative',
  });

  const labelStyle = (color) => ({
    fontSize: 9,
    fontWeight: 700,
    color,
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  });

  const priceStyle = (color) => ({
    fontSize: 10,
    fontWeight: 600,
    color,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 160,
      zIndex: 10,
      pointerEvents: 'auto',
    }}>
      {/* R:R Box */}
      <div style={{
        background: 'rgba(10,18,24,0.92)',
        border: '1px solid rgba(28,46,61,0.7)',
        borderRadius: 8,
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '8px 10px 6px' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#c8d8e8', letterSpacing: '0.1em' }}>
            SETUP
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: isBull ? '#5bc98a' : '#e05555',
            letterSpacing: '0.05em',
          }}>
            {isBull ? 'LONG' : 'SHORT'} · R:R {rr != null ? rr.toFixed(1) : '--'}:1
          </span>
        </div>

        {/* Visual R:R zones */}
        <div style={{ padding: '0 10px 8px' }}>
          {levels.map((level, i) => {
            // Determine the zone below this level
            const isTop = i === 0;
            const isBottom = i === levels.length - 1;
            const nextLevel = levels[i + 1];

            // Zone between this level and the next
            let zoneBg = 'transparent';
            let zoneHeight = 0;
            if (!isBottom && nextLevel) {
              const gapPct = ((level.price - nextLevel.price) / range) * 100;
              zoneHeight = Math.max(gapPct * 0.6, 8); // scale for visual, min 8px

              // Profit zone (between target and entry) or risk zone (between entry and stop)
              if (
                (level.label === 'TARGET' && nextLevel.label === 'ENTRY') ||
                (level.label === 'ENTRY' && nextLevel.label === 'TARGET')
              ) {
                zoneBg = 'rgba(91,201,138,0.08)';
              } else {
                zoneBg = 'rgba(224,85,85,0.08)';
              }
            }

            return (
              <div key={level.label}>
                {/* Price line */}
                <div className="flex items-center gap-2">
                  <span style={labelStyle(level.color)}>{level.label}</span>
                  <div style={{ flex: 1, ...lineStyle(level.color) }} />
                  <span style={priceStyle(level.color)}>${fmtPrice(level.price)}</span>
                </div>

                {/* Zone fill between lines */}
                {!isBottom && (
                  <div style={{
                    height: zoneHeight,
                    background: zoneBg,
                    borderLeft: `1px dashed ${zoneBg === 'rgba(91,201,138,0.08)' ? 'rgba(91,201,138,0.25)' : 'rgba(224,85,85,0.25)'}`,
                    borderRight: `1px dashed ${zoneBg === 'rgba(91,201,138,0.08)' ? 'rgba(91,201,138,0.25)' : 'rgba(224,85,85,0.25)'}`,
                    marginLeft: 2,
                    marginRight: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 600,
                      color: zoneBg === 'rgba(91,201,138,0.08)' ? 'rgba(91,201,138,0.6)' : 'rgba(224,85,85,0.6)',
                      letterSpacing: '0.05em',
                    }}>
                      {zoneBg === 'rgba(91,201,138,0.08)'
                        ? `+${targetPct.toFixed(1)}%`
                        : `-${stopPct.toFixed(1)}%`
                      }
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
