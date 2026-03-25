import { useState, useEffect } from 'react';
import { TF_DISPLAY } from '../utils/format';

export default function PanelFooter({ signals, activeTf }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().slice(11, 19) + ' UTC');
    update();
    const id = setInterval(update, 1000);
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
      <span style={{ fontSize: 10, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </span>
    </div>
  );
}
