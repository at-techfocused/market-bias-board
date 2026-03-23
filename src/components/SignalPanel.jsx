import CompositeScore from './CompositeScore';
import ConflictBadge from './ConflictBadge';
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

export default function SignalPanel({ signals, data, lastFetch }) {
  const loading = data['4H'].loading || data.D.loading;
  const error = data['4H'].error || data.D.error;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#1e2d3d', borderTopColor: '#00d4ff' }} />
          <div className="text-[13px] tracking-wide" style={{ color: '#636e7b' }}>Loading signals...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <div className="text-center px-6 max-w-full">
          <div className="text-[18px] mb-2" style={{ color: '#f85149' }}>⚠</div>
          <div className="text-[13px] tracking-wide leading-relaxed break-words" style={{ color: '#f85149' }}>{error}</div>
          <div className="text-[12px] mt-2" style={{ color: '#636e7b' }}>Check your API key or try a different ticker</div>
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
      <CompositeScore composite={signals.composite} lastFetch={lastFetch} signals={signals} />
      <ConflictBadge signals={signals} />

      {/* 4H Timeframe - full width */}
      <div>
        <div className="flex items-center gap-2 px-5 py-3 text-[12px] font-bold tracking-[0.12em] uppercase"
          style={{ color: h4Color, borderBottom: '1px solid #1e2d3d', background: '#0a0f14' }}>
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: h4Color, boxShadow: `0 0 8px ${h4Color}` }} />
          4H · {h4Bias} · {h4?.score ?? '--'}/100
        </div>
        <TimeframePanel label="4H" signals={h4} />
      </div>

      {/* Thick separator */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #1e2d3d 0%, #2d4a5e 50%, #1e2d3d 100%)' }} />

      {/* Daily Timeframe - full width */}
      <div>
        <div className="flex items-center gap-2 px-5 py-3 text-[12px] font-bold tracking-[0.12em] uppercase"
          style={{ color: dColor, borderBottom: '1px solid #1e2d3d', background: '#0a0f14' }}>
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dColor, boxShadow: `0 0 8px ${dColor}` }} />
          DAILY · {dBias} · {d?.score ?? '--'}/100
        </div>
        <TimeframePanel label="D" signals={d} />
      </div>

      {/* Thick separator */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #1e2d3d 0%, #2d4a5e 50%, #1e2d3d 100%)' }} />

      {/* Pattern Breakouts */}
      <div className="px-5 py-4" style={{ borderBottom: '2px solid #1e2d3d' }}>
        <span className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
          Pattern Breakouts
        </span>
        {!h4?.pattern && !d?.pattern && (
          <div className="text-[12px] mt-2 tracking-wide" style={{ color: '#636e7b' }}>
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
