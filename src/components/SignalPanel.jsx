import CompositeScore from './CompositeScore';
import ConflictBadge from './ConflictBadge';
import TimeframePanel from './TimeframePanel';
import PatternCard from './PatternCard';
import MiniCardGrid from './MiniCardGrid';

function getBiasLabel(score) {
  if (score == null) return 'LOADING';
  if (score <= 45) return 'BEARISH';
  if (score >= 56) return 'BULLISH';
  return 'NEUTRAL';
}

function getBiasColor(score) {
  if (score == null) return '#636e7b';
  if (score <= 45) return '#f85149';
  if (score >= 56) return '#3fb950';
  return '#d29922';
}

export default function SignalPanel({ signals, data, lastFetch }) {
  const loading = data['4H'].loading || data.D.loading;
  const error = data['4H'].error || data.D.error;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#1e2d3d', borderTopColor: '#00d4ff' }} />
          <div className="text-[11px] tracking-wide" style={{ color: '#636e7b' }}>Loading signals...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center px-6">
          <div className="text-[14px] mb-2" style={{ color: '#f85149' }}>⚠</div>
          <div className="text-[11px] tracking-wide" style={{ color: '#f85149' }}>{error}</div>
          <div className="text-[10px] mt-2" style={{ color: '#636e7b' }}>Check your API key or try a different ticker</div>
        </div>
      </div>
    );
  }

  const h4 = signals['4H'];
  const d = signals.D;

  const h4Color = getBiasColor(h4?.score);
  const dColor = getBiasColor(d?.score);
  const h4Bias = getBiasLabel(h4?.score);
  const dBias = getBiasLabel(d?.score);

  return (
    <div className="flex flex-col overflow-y-auto h-full" style={{ background: '#0d1117', scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>
      <CompositeScore composite={signals.composite} lastFetch={lastFetch} />
      <ConflictBadge signals={signals} />

      {/* Dual timeframe headers */}
      <div className="grid grid-cols-2 mt-3" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{ color: h4Color, borderRight: '1px solid #1e2d3d' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: h4Color, boxShadow: `0 0 6px ${h4Color}` }} />
          4H · {h4Bias}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-[0.15em] uppercase"
          style={{ color: dColor }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: dColor, boxShadow: `0 0 6px ${dColor}` }} />
          DAILY · {dBias}
        </div>
      </div>

      {/* Dual timeframe panels */}
      <div className="grid grid-cols-2" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <div style={{ borderRight: '1px solid #1e2d3d' }}>
          <TimeframePanel label="4H" signals={h4} />
        </div>
        <div>
          <TimeframePanel label="D" signals={d} />
        </div>
      </div>

      {/* Pattern Breakouts */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2d3d' }}>
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
          Pattern Breakouts
        </span>
        {!h4?.pattern && !d?.pattern && (
          <div className="text-[10px] mt-2 tracking-wide" style={{ color: '#636e7b' }}>
            No active pattern breakouts detected
          </div>
        )}
        {h4?.pattern && (
          <PatternCard pattern={h4.pattern} timeframe="4H" atr={h4.atr} close={h4.close} />
        )}
        {d?.pattern && (
          <PatternCard pattern={d.pattern} timeframe="Daily" atr={d.atr} close={d.close} />
        )}
      </div>

      {/* Mini Signal Cards */}
      <MiniCardGrid signals={h4} />
    </div>
  );
}
