import { useState, useEffect, useRef, useCallback } from 'react';

// Static ticker list — no API needed, instant filtering
const TICKERS = [
  // Crypto — Binance spot
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:SOLUSDT', name: 'Solana', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:BNBUSDT', name: 'BNB', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:XRPUSDT', name: 'XRP', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:ADAUSDT', name: 'Cardano', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:DOTUSDT', name: 'Polkadot', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:MATICUSDT', name: 'Polygon', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:LINKUSDT', name: 'Chainlink', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:ATOMUSDT', name: 'Cosmos', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:LTCUSDT', name: 'Litecoin', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:NEARUSDT', name: 'NEAR Protocol', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:UNIUSDT', name: 'Uniswap', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:APTUSDT', name: 'Aptos', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:ARUSDT', name: 'Arweave', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:OPUSDT', name: 'Optimism', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:ARBUSDT', name: 'Arbitrum', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:SUIUSDT', name: 'Sui', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:PEPEUSDT', name: 'Pepe', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:WIFUSDT', name: 'dogwifhat', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:FETUSDT', name: 'Fetch.ai', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:INJUSDT', name: 'Injective', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:RENDERUSDT', name: 'Render', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:TRXUSDT', name: 'TRON', type: 'crypto', exchange: 'BINANCE' },
  { symbol: 'BINANCE:SHIBUSDT', name: 'Shiba Inu', type: 'crypto', exchange: 'BINANCE' },
  // Stocks — NASDAQ
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'UBER', name: 'Uber Technologies', type: 'stock', exchange: 'NYSE' },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'stock', exchange: 'NYSE' },
  { symbol: 'SOFI', name: 'SoFi Technologies', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'MSTR', name: 'MicroStrategy Inc.', type: 'stock', exchange: 'NASDAQ' },
  // Stocks — NYSE
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'DIS', name: 'Walt Disney Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'BA', name: 'Boeing Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'GS', name: 'Goldman Sachs Group', type: 'stock', exchange: 'NYSE' },
  // ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf', exchange: 'NYSE' },
  { symbol: 'QQQ', name: 'Invesco Nasdaq 100 ETF', type: 'etf', exchange: 'NASDAQ' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'DIA', name: 'SPDR Dow Jones ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'GLD', name: 'SPDR Gold Shares ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'SLV', name: 'iShares Silver Trust ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'USO', name: 'United States Oil Fund', type: 'etf', exchange: 'NYSE' },
  { symbol: 'TLT', name: 'iShares 20+ Yr Treasury ETF', type: 'etf', exchange: 'NASDAQ' },
  { symbol: 'XLF', name: 'Financial Select Sector ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'XLE', name: 'Energy Select Sector ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'XLK', name: 'Technology Select Sector ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'BITO', name: 'ProShares Bitcoin Strategy ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF', type: 'etf', exchange: 'NASDAQ' },
  { symbol: 'SOXL', name: 'Direxion Semiconductor Bull 3X', type: 'etf', exchange: 'NYSE' },
  { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ 3X', type: 'etf', exchange: 'NASDAQ' },
  { symbol: 'SQQQ', name: 'ProShares UltraPro Short QQQ', type: 'etf', exchange: 'NASDAQ' },
  { symbol: 'EEM', name: 'iShares Emerging Markets ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', exchange: 'NYSE' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', exchange: 'NYSE' },
  // Futures / Commodities
  { symbol: 'WTI', name: 'WTI Crude Oil', type: 'futures', exchange: 'NYMEX' },
  { symbol: 'USOIL', name: 'WTI Crude Oil', type: 'futures', exchange: 'NYMEX' },
  { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'futures', exchange: 'ICE' },
  { symbol: 'XAUUSD', name: 'Gold', type: 'futures', exchange: 'COMEX' },
  { symbol: 'GOLD', name: 'Gold', type: 'futures', exchange: 'COMEX' },
  { symbol: 'XAGUSD', name: 'Silver', type: 'futures', exchange: 'COMEX' },
  { symbol: 'SILVER', name: 'Silver', type: 'futures', exchange: 'COMEX' },
  { symbol: 'NATGAS', name: 'Natural Gas', type: 'futures', exchange: 'NYMEX' },
  // Indices
  { symbol: 'DXY', name: 'US Dollar Index', type: 'index', exchange: 'ICE' },
  { symbol: 'VIX', name: 'CBOE Volatility Index', type: 'index', exchange: 'CBOE' },
  { symbol: 'US30', name: 'Dow Jones Industrial Avg', type: 'futures', exchange: 'CBOT' },
  { symbol: 'US500', name: 'S&P 500 E-mini', type: 'futures', exchange: 'CME' },
  { symbol: 'NAS100', name: 'Nasdaq 100 E-mini', type: 'futures', exchange: 'CME' },
];

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
