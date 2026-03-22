import { useState, useEffect } from 'react';
import WatchlistChip from './WatchlistChip';

export default function TopBar({ activeTicker, watchlist, onTickerChange, onAddToWatchlist, onRemoveFromWatchlist, signals }) {
  const [search, setSearch] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toISOString().slice(11, 19) + ' UTC'
      );
    };
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
    <div className="flex items-center gap-4 px-5 py-2.5 border-b sticky top-0 z-50"
      style={{ background: '#0d1117', borderColor: '#1e2d3d' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-[7px] h-[7px] rounded-full animate-pulse"
          style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }} />
        <span className="text-[13px] font-bold tracking-[0.15em] uppercase"
          style={{ color: '#00d4ff' }}>BIASBOARD</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="relative w-[200px] shrink-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px]"
          style={{ color: '#636e7b' }}>⌕</span>
        <input
          type="text"
          placeholder="Search ticker..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-[12px] py-[7px] pl-8 pr-3 rounded outline-none transition-colors"
          style={{
            background: '#111820',
            border: '1px solid #1e2d3d',
            color: '#cdd9e5',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
          onFocus={(e) => (e.target.style.borderColor = '#00d4ff')}
          onBlur={(e) => (e.target.style.borderColor = '#1e2d3d')}
        />
      </form>

      {/* Watchlist */}
      <div className="flex gap-1.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
          <button
            onClick={() => onAddToWatchlist(activeTicker)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold tracking-wide cursor-pointer whitespace-nowrap transition-all"
            style={{
              background: '#111820',
              border: '1px solid #1e2d3d',
              color: '#636e7b',
            }}
          >
            + ADD
          </button>
        )}
      </div>

      {/* Timestamp */}
      <div className="ml-auto shrink-0">
        <span className="text-[10px] tracking-[0.08em]" style={{ color: '#636e7b' }}>
          {time}
        </span>
      </div>
    </div>
  );
}
