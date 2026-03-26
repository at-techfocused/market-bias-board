import { useState, useEffect, useRef, useCallback } from 'react';
import { getTickerList } from '../utils/tickers';

const TICKERS = getTickerList();

const TYPE_COLORS = {
  crypto: 'var(--amber)',
  stock: 'var(--ema-200)',
  etf: '#a78bfa',
  futures: 'var(--ema-100)',
  index: 'var(--ema-50)',
};

const TYPE_LABELS = {
  crypto: 'crypto',
  stock: 'stock',
  etf: 'etf',
  futures: 'futures',
  index: 'index',
};

export default function TickerSearch({ onSelect, onClose, watchlist }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim().length === 0
    ? TICKERS.slice(0, 14)
    : TICKERS.filter((t) => {
        const q = query.toUpperCase();
        const sym = t.symbol.includes(':') ? t.symbol.split(':')[1] : t.symbol;
        return sym.toUpperCase().includes(q) || t.name.toUpperCase().includes(q) || t.symbol.toUpperCase().includes(q);
      }).slice(0, 14);

  // Check if typed query is a valid custom ticker (not matching any filtered result exactly)
  const customTicker = query.trim().toUpperCase();
  const hasExactMatch = filtered.some((t) => {
    const sym = t.symbol.includes(':') ? t.symbol.split(':')[1] : t.symbol;
    return sym.toUpperCase() === customTicker || t.symbol.toUpperCase() === customTicker;
  });
  const showCustom = customTicker.length >= 1 && !hasExactMatch;
  const totalItems = filtered.length + (showCustom ? 1 : 0);

  const handleSelect = useCallback((symbol) => {
    onSelect(symbol);
  }, [onSelect]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showCustom && selectedIdx === 0) {
        handleSelect(customTicker);
      } else {
        const idx = showCustom ? selectedIdx - 1 : selectedIdx;
        if (filtered[idx]) handleSelect(filtered[idx].symbol);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Reset selection on query change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const inWatchlist = (sym) => watchlist.includes(sym);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'var(--bg-deep)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Search input */}
        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-inner)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 4, padding: '6px 10px',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.4 }}>&#x1F50D;</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search symbol or name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1, fontSize: 13, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ESC
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {showCustom && (
            <div
              onClick={() => handleSelect(customTicker)}
              onMouseEnter={() => setSelectedIdx(0)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 14px', cursor: 'pointer',
                background: selectedIdx === 0 ? 'rgba(91,201,138,0.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {customTicker}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5 }}>
                  Go to ticker
                </span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-body)', opacity: 0.3 }}>ENTER ↵</span>
            </div>
          )}
          {filtered.map((t, i) => {
            const idx = showCustom ? i + 1 : i;
            const isSelected = selectedIdx === idx;
            const isWatched = inWatchlist(t.symbol);
            const displaySym = t.symbol.includes(':') ? t.symbol.split(':')[1] : t.symbol;
            const typeColor = TYPE_COLORS[t.type] || 'var(--text-body)';
            return (
              <div
                key={t.symbol}
                onClick={() => handleSelect(t.symbol)}
                onMouseEnter={() => setSelectedIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 14px', cursor: 'pointer',
                  background: isSelected ? 'rgba(91,201,138,0.06)' : 'transparent',
                  borderLeft: isSelected ? '2px solid var(--green)' : '2px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
                    minWidth: 80, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {displaySym}
                  </span>
                  <span style={{
                    fontSize: 11, color: 'var(--text-body)', opacity: 0.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {t.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  {isWatched && (
                    <span style={{ fontSize: 9, color: 'var(--green)', opacity: 0.6 }}>★</span>
                  )}
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                    color: typeColor, opacity: 0.7,
                  }}>
                    {TYPE_LABELS[t.type]}
                  </span>
                  <span style={{
                    fontSize: 9, color: 'var(--text-body)', opacity: 0.3,
                    minWidth: 48, textAlign: 'right',
                  }}>
                    {t.exchange}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !showCustom && (
            <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12, color: 'var(--text-body)', opacity: 0.4 }}>
              No matches found
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '6px 14px', borderTop: '1px solid var(--border-inner)',
          fontSize: 10, color: 'var(--text-body)', opacity: 0.3,
          display: 'flex', gap: 12,
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
