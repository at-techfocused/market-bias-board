import Tooltip from './Tooltip';

export default function CompositeScore({ composite, lastFetch }) {
  if (!composite) return null;

  const { score, label, description } = composite;

  const color = score <= 45 ? '#f85149' : score >= 56 ? '#3fb950' : '#d29922';
  const glow = score <= 45 ? 'rgba(248,81,73,0.15)' : score >= 56 ? 'rgba(63,185,80,0.15)' : 'rgba(210,153,34,0.15)';

  const fetchTime = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="px-5 py-4" style={{ borderBottom: '2px solid #1e2d3d', background: '#0d1117' }}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase shrink-0" style={{ color: '#3d4a57' }}>
          Composite Signal
        </span>
        <span className="text-[11px] tracking-[0.06em] text-right truncate" style={{ color: '#3d4a57' }}>
          {fetchTime}
        </span>
      </div>

      <Tooltip
        content={
          <div>
            <strong>Composite Bias Score</strong>
            <br />
            Weighted average of 4H and Daily timeframe scores.
            <br />
            <strong style={{ color }}>⚡ {label}</strong>: {description}
            <br />
            <span style={{ color: '#8b949e' }}>
              {'≤ 30 = Strong Bear · ≤ 45 = Bear Bias · ≤ 55 = Neutral · ≤ 70 = Bull Bias · > 70 = Strong Bull'}
            </span>
          </div>
        }
      >
        <div className="flex items-center gap-4">
          <div
            className="text-[48px] font-bold leading-none tracking-tight"
            style={{ color, textShadow: `0 0 20px ${glow}` }}
          >
            {score}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold tracking-[0.08em] mb-1" style={{ color }}>
              ⚡ {label}
            </div>
            <div className="text-[12px] leading-relaxed" style={{ color: '#636e7b' }}>
              {description}
            </div>
          </div>
        </div>
      </Tooltip>

      {/* Score bar */}
      <div className="mt-3 h-1.5 rounded-sm overflow-hidden" style={{ background: '#161e28' }}>
        <div
          className="h-full rounded-sm relative"
          style={{
            width: `${score}%`,
            background: 'linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)',
          }}
        >
          <div
            className="absolute right-0 -top-[3px] w-[2px] h-[12px] rounded-sm"
            style={{ background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }}
          />
        </div>
      </div>
    </div>
  );
}
