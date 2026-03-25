export default function WatchlistChip({ ticker, active, onClick, onRemove }) {
  return (
    <div
      className="flex items-center gap-1 rounded-[3px] cursor-pointer whitespace-nowrap transition-all relative group"
      style={{
        padding: '3px 8px',
        fontSize: 10,
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
        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ fontSize: 8, color: 'var(--text-body)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
