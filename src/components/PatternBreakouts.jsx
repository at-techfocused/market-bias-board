import { fmtPrice } from '../utils/format';

function getSignalColor(dir) {
  if (dir === 'BULL') return 'var(--green)';
  if (dir === 'BEAR') return 'var(--red)';
  return 'var(--amber)';
}

function TypeBadge({ type }) {
  const isType1 = type === 1;
  const color = isType1 ? 'var(--green)' : 'var(--ema-200)';
  const bg = isType1 ? 'rgba(91,201,138,0.1)' : 'rgba(74,144,217,0.1)';
  const border = isType1 ? 'rgba(91,201,138,0.3)' : 'rgba(74,144,217,0.3)';
  return (
    <span className="px-1.5 py-[1px] rounded-[3px]"
      style={{ fontSize: 8, fontWeight: 700, color, background: bg, border: `1px solid ${border}` }}>
      TYPE {type}
    </span>
  );
}

export default function PatternBreakouts({ signals, activeTf }) {
  const active = signals?.[activeTf];
  const pattern = active?.pattern;

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
        PATTERN BREAKOUTS
      </div>

      {!pattern ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-[7px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-body)' }}>Patterns</span>
          <span style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.6 }}>None detected</span>
        </div>
      ) : (
        <div className="rounded-[7px] overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${getSignalColor(pattern.direction)}` }}>
          <div className="px-3 pt-3 pb-1 flex items-center gap-2">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{pattern.name}</span>
            <TypeBadge type={pattern.type} />
          </div>
          <div className="px-3 pb-3 flex items-center gap-4">
            <span style={{ fontSize: 9, color: 'var(--text-body)' }}>
              Reliability: {pattern.type === 1 ? 'High' : 'Moderate'}
            </span>
            {active.atr != null && (
              <>
                <span style={{ fontSize: 9, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                  TGT ${fmtPrice(pattern.direction === 'BULL' ? active.close + active.atr * 2 : active.close - active.atr * 2)}
                </span>
                <span style={{ fontSize: 9, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                  STOP ${fmtPrice(pattern.direction === 'BULL' ? active.close - active.atr : active.close + active.atr)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
