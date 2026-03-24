import Tooltip from './Tooltip';
import { getBiasColor, fmtPrice } from '../utils/format';

const SIGNAL_COLORS = { bull: '#3fb950', bear: '#f85149', neut: '#d29922', mixed: '#58a6ff' };

const EMA_PERIOD_COLORS = { '20': '#f85149', '50': '#d29922', '100': '#2dd4bf', '200': '#58a6ff' };

function StatRow({ label, children, tooltip }) {
  const row = (
    <div className="flex items-center justify-between py-[9px]"
      style={{ borderBottom: '1px solid rgba(30,45,61,0.35)' }}>
      <span className="text-[12px] tracking-[0.06em] uppercase font-semibold" style={{ color: '#4d5768' }}>
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        {children}
      </div>
    </div>
  );
  return tooltip ? <Tooltip content={tooltip}>{row}</Tooltip> : row;
}

function EMAStackInline({ ema, emaStack, close }) {
  const stackColor = emaStack === 'BULL' ? '#3fb950' : emaStack === 'BEAR' ? '#f85149' : '#d29922';
  const pairs = [
    { period: '20', value: ema?.ema20 },
    { period: '50', value: ema?.ema50 },
    { period: '100', value: ema?.ema100 },
    { period: '200', value: ema?.ema200 },
  ];

  return (
    <Tooltip content={
      <div>
        <strong>EMA Stack</strong> &mdash; {emaStack}
        <br /><br />
        {pairs.map(({ period, value }) => {
          if (value == null) return null;
          const above = close > value;
          const pct = ((close - value) / value * 100).toFixed(2);
          return (
            <div key={period} style={{ color: above ? '#3fb950' : '#f85149' }}>
              <span style={{ color: EMA_PERIOD_COLORS[period] }}>EMA {period}</span>: ${fmtPrice(value)} ({above ? '+' : ''}{pct}%)
            </div>
          );
        })}
        <br />
        <span style={{ color: '#8b949e' }}>Green = above EMA. Red = below. Full alignment = highest conviction.</span>
      </div>
    }>
      <div className="py-[9px]" style={{ borderBottom: '1px solid rgba(30,45,61,0.35)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] tracking-[0.06em] uppercase font-semibold" style={{ color: '#4d5768' }}>
            EMA Stack
          </span>
          <span className="text-[13px] font-bold" style={{ color: stackColor }}>{emaStack}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {pairs.map(({ period, value }) => {
            if (value == null) return null;
            const above = close > value;
            const valueColor = above ? '#3fb950' : '#f85149';
            return (
              <span key={period} className="text-[10px] tabular-nums whitespace-nowrap">
                <span style={{ color: valueColor }}>{above ? '+' : '\u2212'}</span>
                <span style={{ color: EMA_PERIOD_COLORS[period] }}>EMA{period}</span>
                {' '}<span style={{ color: valueColor }}>${fmtPrice(value)}</span>
              </span>
            );
          })}
        </div>
      </div>
    </Tooltip>
  );
}

export default function TimeframePanel({ label, signals }) {
  if (!signals) return <div className="px-5 py-6 text-[12px]" style={{ color: '#4d5768' }}>No data available for this timeframe.</div>;

  const color = getBiasColor(signals.score);
  const smmaVal = signals.smma99Value;
  const smmaPct = smmaVal != null && signals.close != null
    ? ((signals.close - smmaVal) / smmaVal * 100).toFixed(2)
    : null;
  const smmaAbove = smmaPct != null ? parseFloat(smmaPct) > 0 : false;
  const smmaColor = smmaAbove ? '#3fb950' : '#f85149';

  const macdText = signals.macd
    ? `${signals.macdDirection === 'BULL' ? '\u25B2 Bull' : signals.macdDirection === 'BEAR' ? '\u25BC Bear' : '\u25C6 Neutral'}`
    : '--';
  const macdClass = signals.macdDirection === 'BULL' ? 'bull' : signals.macdDirection === 'BEAR' ? 'bear' : 'neut';
  const rsiClass = signals.rsiZone === 'BULLISH' ? 'bull' : signals.rsiZone === 'BEARISH' ? 'bear' : 'neut';
  const patternClass = signals.pattern
    ? signals.pattern.direction === 'BULL' ? 'bull' : signals.pattern.direction === 'BEAR' ? 'bear' : 'neut'
    : 'neut';
  const patternText = signals.pattern
    ? `${signals.pattern.name === 'Bear Marubozu' ? 'MRUBZU \u25BC' : signals.pattern.name === 'Bullish Marubozu' ? 'MRUBZU \u25B2' : 'DOJI \u25C6'}`
    : 'None';

  const scoreBg = signals.score <= 40 ? 'rgba(248,81,73,0.08)' : signals.score >= 60 ? 'rgba(63,185,80,0.08)' : 'rgba(210,153,34,0.08)';

  return (
    <div className="px-4 py-3">
      <EMAStackInline ema={signals.ema} emaStack={signals.emaStack} close={signals.close} />

      <StatRow label="SMMA 99" tooltip={
        <div>
          <strong>Smoothed Moving Average (99)</strong>
          <br />
          {smmaVal != null && <>SMMA: <strong>${fmtPrice(smmaVal)}</strong><br />Price is <strong style={{ color: smmaColor }}>{smmaAbove ? 'above' : 'below'}</strong> by {Math.abs(parseFloat(smmaPct || 0))}%<br /></>}
          <span style={{ color: '#8b949e' }}>Long-term trend filter.</span>
        </div>
      }>
        <span className="text-[12px] tabular-nums" style={{ color: '#4d5768' }}>
          {smmaVal != null ? `$${fmtPrice(smmaVal)}` : ''}
        </span>
        {smmaPct != null && (
          <span className="text-[11px] font-bold tabular-nums" style={{ color: smmaColor }}>
            {smmaAbove ? '+' : ''}{smmaPct}%
          </span>
        )}
        <span className="text-[13px] font-bold" style={{ color: smmaColor }}>{signals.smma99}</span>
      </StatRow>

      <StatRow label="MACD" tooltip={
        signals.macd ? (
          <div>
            <strong>MACD (12, 26, 9)</strong><br />
            Line: {signals.macd.macd.toFixed(2)} &middot; Signal: {signals.macd.signal.toFixed(2)}<br />
            Histogram: <span style={{ color: signals.macd.histogram > 0 ? '#3fb950' : '#f85149' }}>{signals.macd.histogram > 0 ? '+' : ''}{signals.macd.histogram.toFixed(2)}</span><br />
            <span style={{ color: '#8b949e' }}>
              {signals.macdDirection === 'BULL' && 'MACD above signal line \u2014 bullish momentum.'}
              {signals.macdDirection === 'BEAR' && 'MACD below signal line \u2014 bearish momentum.'}
              {signals.macdDirection === 'NEUTRAL' && 'MACD near signal line \u2014 momentum unclear.'}
            </span>
          </div>
        ) : <div><strong>MACD</strong>: Not enough data.</div>
      }>
        <span className="text-[13px] font-bold" style={{ color: SIGNAL_COLORS[macdClass] }}>{macdText}</span>
      </StatRow>

      <StatRow label="RSI" tooltip={
        <div>
          <strong>RSI (14)</strong>: {signals.rsi}<br />
          {signals.rsiZone === 'BULLISH' && <span style={{ color: '#3fb950' }}>Above 55 = Bullish</span>}
          {signals.rsiZone === 'BEARISH' && <span style={{ color: '#f85149' }}>Below 45 = Bearish</span>}
          {signals.rsiZone === 'NEUTRAL' && <span style={{ color: '#d29922' }}>45-55 = Neutral</span>}
        </div>
      }>
        <span className="text-[13px] font-bold tabular-nums" style={{ color: SIGNAL_COLORS[rsiClass] }}>{signals.rsi}</span>
      </StatRow>

      <StatRow label="Pattern" tooltip={
        signals.pattern
          ? <div><strong>{signals.pattern.name}</strong> &mdash; {signals.pattern.direction}<br />Body: {signals.pattern.bodyPct}% &middot; Type {signals.pattern.type}</div>
          : <div>No pattern detected.</div>
      }>
        <span className="text-[13px] font-bold" style={{ color: SIGNAL_COLORS[patternClass] }}>{patternText}</span>
      </StatRow>

      {/* Score pill — subtle tinted background */}
      <div className="mt-3 py-2 px-3 rounded-md text-center" style={{ background: scoreBg }}>
        <span className="text-[12px] font-bold tracking-[0.08em]" style={{ color }}>
          SCORE {signals.score}/100
        </span>
      </div>
    </div>
  );
}
