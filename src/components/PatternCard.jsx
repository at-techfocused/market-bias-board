import Tooltip from './Tooltip';
import { fmtPrice } from '../utils/format';

export default function PatternCard({ pattern, timeframe, atr, close }) {
  if (!pattern) return null;

  const isBear = pattern.direction === 'BEAR';
  const isBull = pattern.direction === 'BULL';
  const accentColor = isBear ? '#f85149' : isBull ? '#3fb950' : '#d29922';
  const isType1 = pattern.type === 1;

  const reliability = isType1 ? '69%' : '54%';
  const tgtPct = isType1 ? '7.0' : '12.0';
  const tgtSign = isBear ? '\u2212' : '+';
  const tgtColor = isBear ? '#f85149' : '#3fb950';

  const stopPrice = atr != null ? (isBear ? close + atr * 1.5 : close - atr * 1.5) : null;

  const nameText = isBear ? '\u25BC Bear Marubozu' : isBull ? '\u25B2 Bull Marubozu' : '\u25C6 Doji';

  const desc = isType1
    ? `Near-zero wicks \u00B7 pure conviction ${isBear ? 'selling' : 'buying'} \u00B7 Body ${pattern.bodyPct}% \u00B7 $${fmtPrice(pattern.price)}`
    : `Body ${pattern.bodyPct}% of range \u2014 strong indecision \u00B7 $${fmtPrice(pattern.price)} \u00B7 ${timeframe} TF`;

  return (
    <Tooltip content={
      <div>
        <strong>{pattern.name}</strong> &mdash; {timeframe} timeframe<br />
        Direction: <strong style={{ color: accentColor }}>{pattern.direction}</strong><br />
        Body ratio: {pattern.bodyPct}% of candle range<br />
        Type {pattern.type}: {isType1 ? `High conviction (${reliability})` : `Standard (${reliability})`}<br />
        Target: {tgtSign}{tgtPct}% &middot; Stop: ${fmtPrice(stopPrice)} (1.5x ATR)<br />
        <span style={{ color: '#8b949e' }}>
          {isBear && 'Strong selling pressure \u2014 minimal buyer resistance.'}
          {isBull && 'Strong buying pressure \u2014 minimal seller resistance.'}
          {!isBear && !isBull && 'Indecision candle \u2014 market undecided. Wait for confirmation.'}
        </span>
      </div>
    }>
      <div className="mt-3 rounded-md relative overflow-hidden"
        style={{ background: 'rgba(17,24,32,0.6)' }}>
        {/* Accent-left border (pattern 5) */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accentColor }} />

        <div className="px-4 py-3 pl-5">
          {/* Header: name + type chip */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-bold tracking-wide" style={{ color: accentColor }}>{nameText}</span>
            <span className="text-[9px] font-bold px-2 py-[2px] rounded-[3px] tracking-wider"
              style={{
                color: isType1 ? '#3fb950' : '#58a6ff',
                background: isType1 ? 'rgba(63,185,80,0.1)' : 'rgba(88,166,255,0.1)',
              }}>
              TYPE {pattern.type}
            </span>
          </div>

          {/* Description */}
          <div className="text-[10px] leading-relaxed tracking-wide mb-2.5" style={{ color: '#636e7b' }}>{desc}</div>

          {/* Stats row — chip-like inline badges */}
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide">
            <span style={{ color: '#636e7b' }}>
              Reliability: <span style={{ color: '#cdd9e5' }}>{reliability}</span>
            </span>
            <span style={{ color: tgtColor }}>TGT {tgtSign}{tgtPct}%</span>
            <span style={{ color: '#f85149' }}>STOP ${fmtPrice(stopPrice)}</span>
          </div>

          {/* Subtext */}
          <div className="text-[9px] mt-1.5 leading-relaxed" style={{ color: '#4d5768' }}>
            {isType1 ? 'Below lowest bottom \u00B7 0.5\u00D7ATR' : 'Beyond doji extremes + ATR buffer'}
          </div>
          {!isType1 && (
            <div className="text-[9px] mt-0.5 leading-relaxed" style={{ color: '#4d5768' }}>
              Type 2: pullback to breakout level \u2014 still valid, stop intact
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  );
}
