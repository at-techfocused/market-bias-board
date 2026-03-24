import { fmtPrice } from '../utils/format';

function getSignalColor(score) {
  if (score == null) return 'var(--amber)';
  if (score <= 40) return 'var(--red)';
  if (score >= 60) return 'var(--green)';
  return 'var(--amber)';
}

export default function PanelTopBar({ ticker, name, signals, activeTf }) {
  const active = signals?.[activeTf];
  const color = getSignalColor(active?.score);
  const price = active?.close;
  const pctChange = active?.atrPct != null ? active.atrPct : null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5"
      style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>{ticker}</span>
        <span style={{ color: 'var(--text-body)', fontSize: 10, opacity: 0.6 }}>{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          ${fmtPrice(price)}
        </span>
        {pctChange != null && (
          <span className="px-1.5 py-[1px] rounded-[3px]"
            style={{ fontSize: 9, fontWeight: 700, background: 'rgba(91,201,138,0.1)', color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
            ATR {pctChange}%
          </span>
        )}
      </div>
    </div>
  );
}
