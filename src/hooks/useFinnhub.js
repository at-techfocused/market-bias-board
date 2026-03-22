import { useState, useCallback } from 'react';
import { fetchDualTimeframe } from '../utils/finnhub';

export function useFinnhub() {
  const [data, setData] = useState({
    '4H': { candles: null, loading: false, error: null },
    D: { candles: null, loading: false, error: null },
  });
  const [lastFetch, setLastFetch] = useState(null);

  const loadTicker = useCallback(async (ticker) => {
    setData({
      '4H': { candles: null, loading: true, error: null },
      D: { candles: null, loading: true, error: null },
    });

    try {
      const result = await fetchDualTimeframe(ticker);
      setData({
        '4H': { candles: result['4H'], loading: false, error: null },
        D: { candles: result.D, loading: false, error: null },
      });
      setLastFetch(new Date());
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch data';
      setData({
        '4H': { candles: null, loading: false, error: errorMsg },
        D: { candles: null, loading: false, error: errorMsg },
      });
    }
  }, []);

  return { data, lastFetch, loadTicker };
}
