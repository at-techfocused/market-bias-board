import { useMemo, useState, useRef, useEffect } from 'react';
import { runBacktest } from '../utils/indicators';
import { TF_DISPLAY } from '../utils/format';
import BacktestChart from './BacktestChart';
import BacktestStats from './BacktestStats';

const LOOK_FORWARD_OPTIONS = [3, 5, 10, 20];

export default function BacktestPanel({ data, activeTf, weights }) {
  const [lookForward, setLookForward] = useState(5);
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(428);

  const candles = data?.[activeTf]?.candles;

  const results = useMemo(() => {
    if (!candles || candles.length < 201) return [];
    return runBacktest(candles, weights, lookForward);
  }, [candles, weights, lookForward]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!candles || candles.length < 201) {
    return (
      <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'var(--text-body)' }}>
        Need 200+ candles for backtest ({candles?.length || 0} available)
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Controls */}
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-body)' }}>
          {results.length} data points · {TF_DISPLAY[activeTf]}
        </span>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: 9, color: 'var(--text-body)', opacity: 0.6 }}>Forward:</span>
          {LOOK_FORWARD_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setLookForward(n)}
              style={{
                fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 3, cursor: 'pointer',
                background: lookForward === n ? 'rgba(91,201,138,0.15)' : 'transparent',
                border: `1px solid ${lookForward === n ? 'var(--green)' : 'var(--border-inner)'}`,
                color: lookForward === n ? 'var(--green)' : 'var(--text-body)',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ margin: '0 -16px' }}>
        <BacktestChart results={results} width={chartWidth + 32} height={180} />
      </div>

      {/* Stats */}
      <div style={{ marginTop: 10 }}>
        <BacktestStats results={results} />
      </div>
    </div>
  );
}
