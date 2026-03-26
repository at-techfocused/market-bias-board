import { useMemo, useState, useRef, useEffect } from 'react';
import { runBacktest } from '../utils/indicators';
import { TF_DISPLAY } from '../utils/format';
import BacktestChart from './BacktestChart';
import BacktestStats from './BacktestStats';

const LOOK_FORWARD_OPTIONS = [3, 5, 10, 20];

function PopoutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h5v5" />
      <path d="M14 2L8 8" />
      <path d="M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" />
    </svg>
  );
}

function BacktestContent({ results, lookForward, setLookForward, chartWidth, chartHeight, activeTf, flush }) {
  return (
    <>
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
      <div style={flush ? { margin: '0 -16px' } : undefined}>
        <BacktestChart results={results} width={chartWidth} height={chartHeight} />
      </div>

      {/* Stats */}
      <div style={{ marginTop: 10 }}>
        <BacktestStats results={results} />
      </div>
    </>
  );
}

function BacktestPopout({ results, lookForward, setLookForward, activeTf, onClose }) {
  const containerRef = useRef(null);
  const [popoutWidth, setPopoutWidth] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setPopoutWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div
        ref={containerRef}
        style={{
          background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12,
          width: '92%', maxWidth: 900, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
            BACKTEST · {TF_DISPLAY[activeTf]}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <BacktestContent
            results={results}
            lookForward={lookForward}
            setLookForward={setLookForward}
            chartWidth={popoutWidth - 40}
            chartHeight={320}
            activeTf={activeTf}
          />
        </div>
      </div>
    </div>
  );
}

export default function BacktestPanel({ data, activeTf, weights }) {
  const [lookForward, setLookForward] = useState(5);
  const [popout, setPopout] = useState(false);
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
      {/* Popout button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button
          onClick={() => setPopout(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 3, cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border-inner)', color: 'var(--text-body)',
            opacity: 0.7, letterSpacing: '0.04em',
          }}
        >
          <PopoutIcon /> EXPAND
        </button>
      </div>

      {/* Inline content */}
      <BacktestContent
        results={results}
        lookForward={lookForward}
        setLookForward={setLookForward}
        chartWidth={chartWidth + 32}
        chartHeight={180}
        activeTf={activeTf}
        flush
      />

      {/* Popout modal */}
      {popout && (
        <BacktestPopout
          results={results}
          lookForward={lookForward}
          setLookForward={setLookForward}
          activeTf={activeTf}
          onClose={() => setPopout(false)}
        />
      )}
    </div>
  );
}
