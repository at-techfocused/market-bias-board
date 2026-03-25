import { useState, useEffect } from 'react';
import WatchlistChip from './WatchlistChip';

export default function TopBar({ activeTicker, watchlist, onTickerChange, onAddToWatchlist, onRemoveFromWatchlist, signals }) {
  const [search, setSearch] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().slice(11, 19) + ' UTC');
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ticker = search.trim().toUpperCase();
    if (ticker) {
      onTickerChange(ticker);
      setSearch('');
    }
  };

  const isInWatchlist = watchlist.includes(activeTicker);

  return (
    <div className="topbar" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
      {/* Top row: logo, search, clock */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ minHeight: 44 }}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-[7px] h-[7px] rounded-full animate-pulse"
            style={{ background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            BIASBOARD
          </span>
        </div>

        <form onSubmit={handleSubmit} className="shrink-0 topbar-search">
          <input
            type="text"
            placeholder="Search ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '7px 12px',
              borderRadius: 4,
              outline: 'none',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />
        </form>

        <div className="ml-auto shrink-0">
          <span style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        </div>
      </div>

      {/* Watchlist row */}
      <div className="flex items-center gap-1.5 px-4 pb-2 topbar-watchlist" style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {watchlist.map((ticker) => (
          <WatchlistChip
            key={ticker}
            ticker={ticker}
            active={ticker === activeTicker}
            signals={signals}
            onClick={() => onTickerChange(ticker)}
            onRemove={() => onRemoveFromWatchlist(ticker)}
          />
        ))}
        {!isInWatchlist && (
          <button onClick={() => onAddToWatchlist(activeTicker)}
            style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap',
              background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-body)',
            }}>
            + ADD
          </button>
        )}
      </div>
    </div>
  );
}
