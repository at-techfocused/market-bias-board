import { fmtPrice } from '../utils/format';

function getSignalColor(dir) {
  if (dir === 'BULL') return 'var(--green)';
  if (dir === 'BEAR') return 'var(--red)';
  return 'var(--amber)';
}

function getPatternDescription(name, direction) {
  const descriptions = {
    'Doji': 'Indecision candle — open and close nearly equal. Neither buyers nor sellers in control. Often signals a potential reversal when appearing after a strong trend.',
    'Bullish Marubozu': 'Strong bullish candle with little to no wicks. Buyers dominated the entire session from open to close, showing high conviction and momentum.',
    'Bear Marubozu': 'Strong bearish candle with little to no wicks. Sellers dominated the entire session from open to close, showing high conviction and momentum.',
  };
  return descriptions[name] || `${direction === 'BULL' ? 'Bullish' : direction === 'BEAR' ? 'Bearish' : 'Neutral'} candlestick pattern detected on recent price action.`;
}

function TypeBadge({ type }) {
  const isType1 = type === 1;
  const color = isType1 ? 'var(--green)' : 'var(--ema-200)';
  const bg = isType1 ? 'rgba(91,201,138,0.1)' : 'rgba(74,144,217,0.1)';
  const border = isType1 ? 'rgba(91,201,138,0.3)' : 'rgba(74,144,217,0.3)';
  return (
    <span className="px-2 py-[2px] rounded-[3px]"
      style={{ fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${border}` }}>
      TYPE {type}
    </span>
  );
}

export default function PatternBreakouts({ signals, activeTf }) {
  const active = signals?.[activeTf];
  const pattern = active?.pattern;

  return (
    <div style={{ padding: '0 16px 14px' }}>
      {!pattern ? (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-[7px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-body)' }}>Patterns</span>
          <span style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.6 }}>None detected</span>
        </div>
      ) : (
        <div className="rounded-[7px] overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${getSignalColor(pattern.direction)}` }}>
          {/* Header row */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
            <div className="flex items-center gap-2.5">
              <span style={{ fontSize: 22, lineHeight: 1 }}>{pattern.symbol}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                {pattern.name}
              </span>
            </div>
            <TypeBadge type={pattern.type} />
          </div>

          {/* Description */}
          <div className="px-4 pb-3" style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.5 }}>
            {getPatternDescription(pattern.name, pattern.direction)}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-0 border-t" style={{ borderColor: 'var(--border-inner)' }}>
            <div className="flex-1 py-2.5 text-center" style={{ borderRight: '1px solid var(--border-inner)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Reliability</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-body)' }}>
                {pattern.type === 1 ? 'High' : 'Moderate'}
              </div>
            </div>
            <div className="flex-1 py-2.5 text-center" style={{ borderRight: '1px solid var(--border-inner)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Body</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>
                {pattern.bodyPct}%
              </div>
            </div>
            {active.atr != null && (
              <>
                <div className="flex-1 py-2.5 text-center" style={{ borderRight: '1px solid var(--border-inner)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>TGT</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                    ${fmtPrice(pattern.direction === 'BULL' ? active.close + active.atr * 2 : active.close - active.atr * 2)}
                  </div>
                </div>
                <div className="flex-1 py-2.5 text-center">
                  <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>STOP</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                    ${fmtPrice(pattern.direction === 'BULL' ? active.close - active.atr : active.close + active.atr)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
