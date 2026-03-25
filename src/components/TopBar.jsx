import { useState, useEffect } from 'react';
import WatchlistChip from './WatchlistChip';
import TickerSearch from './TickerSearch';

export default function TopBar({ activeTicker, watchlist, onTickerChange, onAddToWatchlist, onRemoveFromWatchlist, signals }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().slice(11, 19) + ' UTC');
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = (ticker) => {
    onTickerChange(ticker);
    onAddToWatchlist(ticker);
    setSearchOpen(false);
  };

  const isInWatchlist = watchlist.includes(activeTicker);

  return (
    <div className="topbar" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
      {/* Single compact row: logo, search trigger, watchlist chips, clock */}
      <div className="flex items-center gap-2 px-3 topbar-row" style={{ height: 36 }}>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-[6px] h-[6px] rounded-full animate-pulse"
            style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
            BIASBOARD
          </span>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="topbar-search-btn"
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 3,
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            color: 'var(--text-body)',
            opacity: 0.6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Search ticker…
        </button>

        <div className="flex items-center gap-1 topbar-watchlist" style={{ flex: 1, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
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
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap',
                background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-body)',
              }}>
              + ADD
            </button>
          )}
        </div>

        <div className="shrink-0">
          <span style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-body)', opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        </div>
      </div>

      {searchOpen && (
        <TickerSearch
          onSelect={handleSelect}
          onClose={() => setSearchOpen(false)}
          watchlist={watchlist}
        />
      )}
    </div>
  );
}
