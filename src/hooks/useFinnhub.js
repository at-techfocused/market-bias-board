import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTripleTimeframe } from '../utils/finnhub';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD = 6 * 60 * 1000;  // 6 minutes (grace buffer)

export function useFinnhub() {
  const [data, setData] = useState({
    '1H': { candles: null, loading: false, error: null },
    '4H': { candles: null, loading: false, error: null },
    D: { candles: null, loading: false, error: null },
  });
  const [lastFetch, setLastFetch] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const tickerRef = useRef(null);
  const intervalRef = useRef(null);

  const loadTicker = useCallback(async (ticker, { silent } = {}) => {
    tickerRef.current = ticker;

    if (!silent) {
      setData({
        '1H': { candles: null, loading: true, error: null },
        '4H': { candles: null, loading: true, error: null },
        D: { candles: null, loading: true, error: null },
      });
    }

    try {
      const result = await fetchTripleTimeframe(ticker);
      // Ignore result if ticker changed while fetching
      if (tickerRef.current !== ticker) return;
      const makeTf = (candles) => ({
        candles,
        loading: false,
        error: candles ? null : 'No data available',
      });
      setData({
        '1H': makeTf(result['1H']),
        '4H': makeTf(result['4H']),
        D: makeTf(result.D),
      });
      setLastFetch(new Date());
      setIsStale(false);
    } catch (err) {
      if (tickerRef.current !== ticker) return;
      const errorMsg = err.message || 'Failed to fetch data';
      console.error(`[BiasBoard] Failed to load ${ticker}:`, errorMsg);
      if (!silent) {
        setData({
          '1H': { candles: null, loading: false, error: errorMsg },
          '4H': { candles: null, loading: false, error: errorMsg },
          D: { candles: null, loading: false, error: errorMsg },
        });
      }
      // On silent refresh failure, mark stale but keep old data
      if (silent) setIsStale(true);
    }
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (tickerRef.current) {
      intervalRef.current = setInterval(() => {
        if (tickerRef.current) {
          loadTicker(tickerRef.current, { silent: true });
        }
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastFetch, loadTicker]);

  // Stale detection
  useEffect(() => {
    if (!lastFetch) return;
    const check = () => {
      const elapsed = Date.now() - lastFetch.getTime();
      setIsStale(elapsed > STALE_THRESHOLD);
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [lastFetch]);

  return { data, lastFetch, isStale, loadTicker };
}
