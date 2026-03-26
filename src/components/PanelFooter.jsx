import { useState, useEffect } from 'react';
import { TF_DISPLAY } from '../utils/format';

function timeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

export default function PanelFooter({ signals, activeTf, lastFetch, isStale }) {
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
      <span style={{ fontSize: 10, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
        R:R {rr != null ? `${rr.toFixed(1)}:1` : '--'} · {TF_DISPLAY[activeTf]} · 1.5× ATR stop
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
