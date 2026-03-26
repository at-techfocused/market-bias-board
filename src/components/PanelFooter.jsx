import { useState, useEffect } from 'react';
import { TF_DISPLAY } from '../utils/format';

function timeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

export default function PanelFooter({ signals, activeTf, lastFetch, isStale, onOpenWeights, hasCustomWeights }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const active = signals?.[activeTf];
  const close = active?.close;
  const atr = active?.atr;
  const isBull = active?.score > 50;
  const stop = atr != null ? (isBull ? close - atr * 1.5 : close + atr * 1.5) : null;
  const stopPct = stop != null ? Math.abs((stop - close) / close * 100) : null;
  const target = atr != null ? (isBull ? close + atr * 3 : close - atr * 3) : null;
  const targetPct = target != null ? Math.abs((target - close) / close * 100) : null;
  const rr = stopPct != null && stopPct > 0 ? (targetPct / stopPct) : null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 panel-footer"
      style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 10, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>
        R:R {rr != null ? `${rr.toFixed(1)}:1` : '--'} · {TF_DISPLAY[activeTf]} · 1.5× ATR stop
        {onOpenWeights && (
          <button
            onClick={onOpenWeights}
            title="Indicator weights"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: hasCustomWeights ? 'var(--amber)' : 'var(--text-body)', opacity: hasCustomWeights ? 1 : 0.5,
              fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.421 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.421-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.116l.094-.318z"/>
            </svg>
          </button>
        )}
      </span>
      <span style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isStale && (
          <span style={{ color: 'var(--amber)', fontWeight: 700 }} title="Data may be outdated">STALE</span>
        )}
        <span style={{ color: isStale ? 'var(--amber)' : 'var(--text-body)' }}>
          {lastFetch ? timeAgo(lastFetch) : '--'}
        </span>
      </span>
    </div>
  );
}
