import { fmtPrice } from '../utils/format';

function getSignalColor(dir) {
  if (dir === 'BULL') return 'var(--green)';
  if (dir === 'BEAR') return 'var(--red)';
  return 'var(--amber)';
}

function getPatternDescription(name) {
  const descriptions = {
    // Single-candle
    'Doji': 'Indecision candle — open and close nearly equal. Neither buyers nor sellers in control. Often signals a potential reversal after a strong trend.',
    'Bullish Marubozu': 'Strong bullish candle with little to no wicks. Buyers dominated the entire session from open to close, showing high conviction.',
    'Bear Marubozu': 'Strong bearish candle with little to no wicks. Sellers dominated the entire session from open to close, showing high conviction.',
    'Hammer': 'Small body near the top with a long lower wick. Sellers pushed price down but buyers reclaimed — potential bullish reversal signal.',
    'Shooting Star': 'Small body near the bottom with a long upper wick. Buyers pushed price up but sellers rejected — potential bearish reversal signal.',
    // Two-candle
    'Bullish Engulfing': 'Green candle fully engulfs the prior red candle body. Strong shift from selling to buying pressure — high-conviction bullish reversal.',
    'Bearish Engulfing': 'Red candle fully engulfs the prior green candle body. Strong shift from buying to selling pressure — high-conviction bearish reversal.',
    'Piercing Line': 'Opens below prior low, closes above the midpoint of the prior red candle. Buyers stepping in — moderate bullish reversal signal.',
    'Dark Cloud Cover': 'Opens above prior high, closes below the midpoint of the prior green candle. Sellers stepping in — moderate bearish reversal signal.',
    'Bullish Harami': 'Small green candle contained within the prior large red candle body. Selling pressure pausing — potential bullish reversal, needs confirmation.',
    'Bearish Harami': 'Small red candle contained within the prior large green candle body. Buying pressure pausing — potential bearish reversal, needs confirmation.',
    'Tweezer Bottom': 'Two candles with nearly equal lows, second closes bullish. Double support test — moderate bullish reversal signal.',
    // Three-candle
    'Three White Soldiers': 'Three consecutive strong green candles, each closing higher. Sustained buying pressure — high-conviction bullish continuation.',
    'Three Black Crows': 'Three consecutive strong red candles, each closing lower. Sustained selling pressure — high-conviction bearish continuation.',
    'Morning Star': 'Red candle, small indecision body, then strong green candle closing above the first candle midpoint. Classic bullish reversal.',
    'Evening Star': 'Green candle, small indecision body, then strong red candle closing below the first candle midpoint. Classic bearish reversal.',
    'Three Inside Up': 'Bearish harami confirmed by a third green candle closing above the first candle high. Strong bullish reversal with follow-through.',
    'Three Inside Down': 'Bullish harami confirmed by a third red candle closing below the first candle low. Strong bearish reversal with follow-through.',
    'Bullish Abandoned Baby': 'Red candle, doji that gaps below, green candle that gaps above. Rare but very high reliability bullish reversal.',
    'Bearish Abandoned Baby': 'Green candle, doji that gaps above, red candle that gaps below. Rare but very high reliability bearish reversal.',
  };
  return descriptions[name] || 'Candlestick pattern detected on recent price action.';
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
    <div>
      {!pattern ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--text-body)' }}>PATTERN BREAKOUTS</span>
          <span style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.4 }}>None detected</span>
        </div>
      ) : (
        <div className="rounded-[7px] overflow-hidden"
          style={{ background: '#0a1218', border: '1px solid var(--border)', borderLeft: `3px solid ${getSignalColor(pattern.direction)}` }}>
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
            {getPatternDescription(pattern.name)}
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
