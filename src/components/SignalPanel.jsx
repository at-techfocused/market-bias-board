import { useState } from 'react';
import CompositeScore from './CompositeScore';
import TimeframePanel from './TimeframePanel';
import PatternCard from './PatternCard';
import MiniCardGrid from './MiniCardGrid';

function getBiasLabel(score) {
  if (score == null) return 'LOADING';
  if (score <= 40) return 'BEARISH';
  if (score >= 60) return 'BULLISH';
  return 'NEUTRAL';
}

function getBiasColor(score) {
  if (score == null) return '#636e7b';
  if (score <= 40) return '#f85149';
  if (score >= 60) return '#3fb950';
  return '#d29922';
}

function formatTickerDisplay(ticker) {
  if (!ticker) return '--';
  const parts = ticker.split(':');
  return parts[parts.length - 1];
}

export default function SignalPanel({ signals, data, lastFetch, ticker }) {
  const [activeTf, setActiveTf] = useState('4H');

  const loading = data['1H']?.loading || data['4H'].loading || data.D.loading;
  const error = data['1H']?.error || data['4H'].error || data.D.error;

  const tickerDisplay = formatTickerDisplay(ticker);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#1e2d3d', borderTopColor: '#00d4ff' }} />
          <div className="text-[13px] tracking-wide" style={{ color: '#636e7b' }}>Loading {tickerDisplay}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center px-6 max-w-full">
          <div className="text-[18px] mb-2" style={{ color: '#f85149' }}>&#9888;</div>
          <div className="text-[13px] tracking-wide leading-relaxed break-words" style={{ color: '#f85149' }}>{error}</div>
          <div className="text-[12px] mt-2" style={{ color: '#636e7b' }}>Check your API key or try a different ticker</div>
        </div>
      </div>
    );
  }

  const h1 = signals['1H'];
  const h4 = signals['4H'];
  const d = signals.D;

  const activeSignals = signals[activeTf];
  const hasAnyPattern = h1?.pattern || h4?.pattern || d?.pattern;

  const cardStyle = {
    background: '#111820',
    border: '1px solid #1e2d3d',
    borderRadius: 8,
  };

  const timeframes = [
    { key: '1H', label: '1H', signals: h1 },
    { key: '4H', label: '4H', signals: h4 },
    { key: 'D', label: 'DAILY', signals: d },
  ];

  return (
    <div className="flex flex-col overflow-y-auto h-full p-4 gap-3" style={{ background: '#0a0e14', scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>

      {/* Ticker header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 8px rgba(0,212,255,0.4)' }} />
          <span className="text-[16px] font-bold tracking-wide" style={{ color: '#cdd9e5' }}>
            {tickerDisplay}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: '#3d4a57' }}>
          {activeSignals?.close != null ? `$${activeSignals.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
        </span>
      </div>

      {/* Action Signal card */}
      <div style={cardStyle} className="overflow-hidden">
        <CompositeScore
          activeTf={activeTf}
          onTfChange={setActiveTf}
          signals={signals}
          lastFetch={lastFetch}
        />
      </div>

      {/* Timeframe cards */}
      {timeframes.map(({ key, label, signals: tfSignals }) => {
        const tfColor = getBiasColor(tfSignals?.score);
        const tfBias = getBiasLabel(tfSignals?.score);
        return (
          <div key={key} style={cardStyle} className="overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 text-[12px] font-bold tracking-[0.12em] uppercase"
              style={{ color: tfColor, borderBottom: '1px solid #1e2d3d', background: '#0d1219' }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tfColor, boxShadow: `0 0 8px ${tfColor}` }} />
              {label} &middot; {tfBias} &middot; {tfSignals?.score ?? '--'}/100
            </div>
            <TimeframePanel label={key} signals={tfSignals} />
          </div>
        );
      })}

      {/* Pattern Breakouts card — collapsed when empty (P8) */}
      <div style={cardStyle} className="overflow-hidden">
        {hasAnyPattern ? (
          <div className="px-5 py-4">
            <span className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
              Pattern Breakouts
            </span>
            {h1?.pattern && (
              <PatternCard pattern={h1.pattern} timeframe="1H" atr={h1.atr} close={h1.close} />
            )}
            {h4?.pattern && (
              <PatternCard pattern={h4.pattern} timeframe="4H" atr={h4.atr} close={h4.close} />
            )}
            {d?.pattern && (
              <PatternCard pattern={d.pattern} timeframe="Daily" atr={d.atr} close={d.close} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
              Pattern Breakouts
            </span>
            <span className="text-[11px]" style={{ color: '#636e7b' }}>
              None detected
            </span>
          </div>
        )}
      </div>

      {/* Signal Cards — shows active TF */}
      <div style={cardStyle} className="overflow-hidden">
        <MiniCardGrid signals={activeSignals} tfLabel={activeTf} />
      </div>
    </div>
  );
}
