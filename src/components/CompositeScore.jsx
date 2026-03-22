export default function CompositeScore({ composite, lastFetch }) {
  if (!composite) return null;

  const { score, label, description } = composite;

  const color = score <= 45 ? '#f85149' : score >= 56 ? '#3fb950' : '#d29922';
  const glow = score <= 45 ? 'rgba(248,81,73,0.15)' : score >= 56 ? 'rgba(63,185,80,0.15)' : 'rgba(210,153,34,0.15)';

  const fetchTime = lastFetch
    ? lastFetch.toISOString().slice(11, 16)
    : '--:--';

  return (
    <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #1e2d3d', background: '#0d1117' }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: '#3d4a57' }}>
          Composite Signal
        </span>
        <span className="text-[9px] tracking-[0.08em]" style={{ color: '#3d4a57' }}>
          ON DEMAND · LAST FETCH {fetchTime}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <div
          className="text-[42px] font-bold leading-none tracking-tight"
          style={{ color, textShadow: `0 0 20px ${glow}` }}
        >
          {score}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold tracking-[0.08em] mb-1" style={{ color }}>
            ⚡ {label}
          </div>
          <div className="text-[10px] leading-relaxed" style={{ color: '#636e7b' }}>
            {description}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-2.5 h-1 rounded-sm overflow-hidden" style={{ background: '#161e28' }}>
        <div
          className="h-full rounded-sm relative"
          style={{
            width: `${score}%`,
            background: 'linear-gradient(90deg, #f85149 0%, #d29922 50%, #3fb950 100%)',
          }}
        >
          <div
            className="absolute right-0 -top-[3px] w-[2px] h-[10px] rounded-sm"
            style={{ background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }}
          />
        </div>
      </div>
    </div>
  );
}
