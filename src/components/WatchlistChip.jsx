export default function WatchlistChip({ ticker, active, onClick, onRemove }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-[3px] cursor-pointer whitespace-nowrap transition-all relative group"
      style={{
        padding: '5px 11px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: active ? 'rgba(91,201,138,0.08)' : 'var(--bg-base)',
        border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
        color: active ? 'var(--green)' : 'var(--text-body)',
      }}
      onClick={onClick}
    >
      {ticker}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ fontSize: 9, color: 'var(--text-body)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
}
