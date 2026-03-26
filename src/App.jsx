import { useState, useEffect, useCallback, useMemo } from 'react';
import TopBar from './components/TopBar';
import TradingViewWidget from './components/TradingViewWidget';
import Panel from './components/Panel';

import { useFinnhub } from './hooks/useFinnhub';
import { useIndicators } from './hooks/useIndicators';
import { useScoreHistory } from './hooks/useScoreHistory';

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

  const [activeTf, setActiveTf] = useState('4H');
  const { data, lastFetch, isStale, loadTicker } = useFinnhub();
  const signals = useIndicators(data);
  const scoreHistory = useScoreHistory(signals);

  const chartInterval = useMemo(() => {
    const map = { '1H': '60', '4H': '240', D: 'D' };
    return map[activeTf] || '240';
  }, [activeTf]);

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
    <div className="flex flex-col" style={{ height: '100vh', background: '#060d13', boxSizing: 'border-box', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <TopBar
        activeTicker={activeTicker}
        watchlist={watchlist}
        onTickerChange={handleTickerChange}
        onAddToWatchlist={handleAddToWatchlist}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        signals={signals}
      />
      <div className="flex-1 flex app-layout" style={{ padding: 12, gap: 12, minHeight: 0 }}>
        {/* Chart card */}
        <div className="flex-1 flex flex-col overflow-hidden chart-card"
          style={{ borderRadius: 10, border: '1px solid #1c2e3d', overflow: 'hidden' }}>
          <TradingViewWidget ticker={activeTicker} interval={chartInterval} />
        </div>
        {/* Panel */}
        <div className="panel-wrapper" style={{ width: 480, minWidth: 480, flexShrink: 0, borderRadius: 10, border: '1px solid #1c2e3d', overflow: 'hidden' }}>
          <Panel signals={signals} data={data} lastFetch={lastFetch} isStale={isStale} scoreHistory={scoreHistory} ticker={activeTicker} activeTf={activeTf} onTfChange={setActiveTf} />
        </div>
      </div>
    </div>
  );
}
