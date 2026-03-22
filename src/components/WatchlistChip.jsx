export default function WatchlistChip({ ticker, active, onClick, onRemove }) {
  return (
    <div
      className="flex items-center gap-1.5 px-[11px] py-[5px] rounded-[3px] text-[11px] font-semibold tracking-wide cursor-pointer whitespace-nowrap transition-all relative group"
      style={{
        background: active ? 'rgba(0,212,255,0.08)' : '#111820',
        border: `1px solid ${active ? '#00d4ff' : '#1e2d3d'}`,
        color: active ? '#00d4ff' : '#636e7b',
      }}
      onClick={onClick}
    >
      {ticker}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px]"
        style={{ color: '#636e7b' }}
      >
        ×
      </button>
    </div>
  );
}
