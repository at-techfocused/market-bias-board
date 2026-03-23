import { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar';
import TradingViewWidget from './components/TradingViewWidget';
import SignalPanel from './components/SignalPanel';
import { useFinnhub } from './hooks/useFinnhub';
import { useIndicators } from './hooks/useIndicators';

const DEFAULT_WATCHLIST = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'AAPL', 'TSLA'];
const STORAGE_KEY = 'biasboard_watchlist';

function loadWatchlist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_WATCHLIST;
}

function saveWatchlist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function App() {
  const [activeTicker, setActiveTicker] = useState(() => {
    const wl = loadWatchlist();
    return wl[0] || 'BINANCE:BTCUSDT';
  });
  const [watchlist, setWatchlist] = useState(loadWatchlist);

  const { data, lastFetch, loadTicker } = useFinnhub();
  const signals = useIndicators(data);

  useEffect(() => {
    loadTicker(activeTicker);
  }, [activeTicker, loadTicker]);

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  const handleTickerChange = useCallback((ticker) => {
    setActiveTicker(ticker);
  }, []);

  const handleAddToWatchlist = useCallback((ticker) => {
    setWatchlist((prev) => {
      if (prev.includes(ticker)) return prev;
      return [...prev, ticker];
    });
  }, []);

  const handleRemoveFromWatchlist = useCallback((ticker) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker));
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: '#080c10', fontFamily: "'IBM Plex Mono', monospace" }}>
      <TopBar
        activeTicker={activeTicker}
        watchlist={watchlist}
        onTickerChange={handleTickerChange}
        onAddToWatchlist={handleAddToWatchlist}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        signals={signals}
      />
      <div className="flex-1 grid" style={{ gridTemplateColumns: '1fr 700px' }}>
        <div className="flex flex-col" style={{ borderRight: '2px solid #1e2d3d' }}>
          <TradingViewWidget ticker={activeTicker} />
        </div>
        <SignalPanel signals={signals} data={data} lastFetch={lastFetch} />
      </div>
    </div>
  );
}
