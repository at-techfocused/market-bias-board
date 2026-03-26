import { useState, useEffect, useCallback } from 'react';
import TopBar from './components/TopBar';
import BiasChart from './components/BiasChart';
import Panel from './components/Panel';
import TickerCompare from './components/TickerCompare';
import WeightSettings, { loadWeights } from './components/WeightSettings';

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

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

export default function App() {
  const [activeTicker, setActiveTicker] = useState(() => {
    const wl = loadWatchlist();
    return wl[0] || 'BINANCE:BTCUSDT';
  });
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [mobileView, setMobileView] = useState('panel');
  const [compareOpen, setCompareOpen] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [weights, setWeights] = useState(loadWeights);

  const [activeTf, setActiveTf] = useState('4H');
  const { data, lastFetch, isStale, loadTicker } = useFinnhub();
  const signals = useIndicators(data, weights);
  const scoreHistory = useScoreHistory(signals);
  const isMobile = useIsMobile();

  // Candles for the active timeframe (passed to chart)
  const activeCandles = data?.[activeTf]?.candles;

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
        onCompare={() => setCompareOpen(true)}
      />

      {/* Mobile view toggle */}
      {isMobile && (
        <div className="flex mobile-view-toggle" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setMobileView('panel')}
            style={{
              flex: 1, padding: '8px 0', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              background: mobileView === 'panel' ? 'var(--bg-base)' : 'transparent',
              color: mobileView === 'panel' ? 'var(--text-primary)' : 'var(--text-body)',
              border: 'none', borderBottom: mobileView === 'panel' ? '2px solid var(--green)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            ANALYSIS
          </button>
          <button
            onClick={() => setMobileView('chart')}
            style={{
              flex: 1, padding: '8px 0', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              background: mobileView === 'chart' ? 'var(--bg-base)' : 'transparent',
              color: mobileView === 'chart' ? 'var(--text-primary)' : 'var(--text-body)',
              border: 'none', borderBottom: mobileView === 'chart' ? '2px solid var(--green)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            CHART
          </button>
        </div>
      )}

      <div className="flex-1 flex app-layout" style={{ padding: isMobile ? 0 : 12, gap: isMobile ? 0 : 12, minHeight: 0 }}>
        {/* Chart card */}
        <div
          className="flex-1 flex flex-col overflow-hidden chart-card"
          style={{
            borderRadius: isMobile ? 0 : 10,
            border: isMobile ? 'none' : '1px solid #1c2e3d',
            overflow: 'hidden',
            display: isMobile && mobileView !== 'chart' ? 'none' : 'flex',
          }}
        >
          <BiasChart candles={activeCandles} signals={signals} activeTf={activeTf} />
        </div>
        {/* Panel */}
        <div
          className="panel-wrapper"
          style={{
            width: isMobile ? '100%' : 480,
            minWidth: isMobile ? 0 : 480,
            flexShrink: 0,
            borderRadius: isMobile ? 0 : 10,
            border: isMobile ? 'none' : '1px solid #1c2e3d',
            overflow: 'hidden',
            display: isMobile && mobileView !== 'panel' ? 'none' : 'block',
            flex: isMobile ? 1 : undefined,
          }}
        >
          <Panel
            signals={signals} data={data} lastFetch={lastFetch} isStale={isStale}
            scoreHistory={scoreHistory} ticker={activeTicker} activeTf={activeTf}
            onTfChange={setActiveTf} onOpenWeights={() => setWeightsOpen(true)} weights={weights}
          />
        </div>
      </div>

      {/* Modals */}
      {compareOpen && (
        <TickerCompare
          watchlist={watchlist}
          activeTicker={activeTicker}
          onTickerChange={handleTickerChange}
          onClose={() => setCompareOpen(false)}
        />
      )}
      {weightsOpen && (
        <WeightSettings
          weights={weights}
          onChange={setWeights}
          onClose={() => setWeightsOpen(false)}
        />
      )}
    </div>
  );
}
