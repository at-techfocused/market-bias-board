import { useState, useCallback } from 'react';
import { fetchTripleTimeframe } from '../utils/finnhub';

export function useFinnhub() {
  const [data, setData] = useState({
    '1H': { candles: null, loading: false, error: null },
    '4H': { candles: null, loading: false, error: null },
    D: { candles: null, loading: false, error: null },
  });
  const [lastFetch, setLastFetch] = useState(null);

  const loadTicker = useCallback(async (ticker) => {
    setData({
      '1H': { candles: null, loading: true, error: null },
      '4H': { candles: null, loading: true, error: null },
      D: { candles: null, loading: true, error: null },
    });

    try {
      const result = await fetchTripleTimeframe(ticker);
      setData({
        '1H': { candles: result['1H'], loading: false, error: null },
        '4H': { candles: result['4H'], loading: false, error: null },
        D: { candles: result.D, loading: false, error: null },
      });
      setLastFetch(new Date());
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch data';
      console.error(`[BiasBoard] Failed to load ${ticker}:`, errorMsg);
      setData({
        '1H': { candles: null, loading: false, error: errorMsg },
        '4H': { candles: null, loading: false, error: errorMsg },
        D: { candles: null, loading: false, error: errorMsg },
      });
    }
  }, []);

  return { data, lastFetch, loadTicker };
}
