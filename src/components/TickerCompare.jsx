import { useState, useEffect, useMemo } from 'react';
import { fetchTripleTimeframe } from '../utils/finnhub';
import { computeSignals } from '../utils/indicators';
import { getScoreColor, getBiasLabel, TF_KEYS, TF_DISPLAY } from '../utils/format';
import { getTickerName } from '../utils/tickers';

function MiniBar({ score }) {
  const color = getScoreColor(score);
  return (
    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--border)', marginTop: 4 }}>
      <div style={{ height: '100%', borderRadius: 2, width: `${score ?? 0}%`, background: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

function TickerRow({ ticker, signals, isActive, onClick }) {
  const short = ticker.includes(':') ? ticker.split(':')[1] : ticker;
  const name = getTickerName(ticker);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '8px 12px', background: isActive ? 'rgba(91,201,138,0.06)' : 'transparent',
        border: 'none', borderBottom: '1px solid var(--border-inner)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Ticker info */}
      <div style={{ minWidth: 80, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? 'var(--green)' : 'var(--text-primary)' }}>{short}</div>
        <div style={{ fontSize: 9, color: 'var(--text-body)', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{name !== short ? name : ''}</div>
      </div>

      {/* TF scores */}
      {TF_KEYS.map((tf) => {
        const score = signals?.[tf]?.score;
        const color = getScoreColor(score);
        return (
          <div key={tf} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {score ?? '--'}
            </div>
            <MiniBar score={score} />
          </div>
        );
      })}

      {/* Avg bias */}
      <div style={{ minWidth: 52, textAlign: 'right' }}>
        {(() => {
          const scores = TF_KEYS.map((tf) => signals?.[tf]?.score).filter((s) => s != null);
          if (scores.length === 0) return <span style={{ fontSize: 10, color: 'var(--text-body)' }}>--</span>;
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          return (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: getScoreColor(avg) }}>{getBiasLabel(avg).toUpperCase()}</div>
              <div style={{ fontSize: 9, color: 'var(--text-body)' }}>avg {avg}</div>
            </div>
          );
        })()}
      </div>
    </button>
  );
}

export default function TickerCompare({ watchlist, activeTicker, onTickerChange, onClose }) {
  const [allSignals, setAllSignals] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'score-asc' | 'score-desc'

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchAll() {
      const results = {};
      // Fetch in batches of 3 to avoid hammering the API
      for (let i = 0; i < watchlist.length; i += 3) {
        const batch = watchlist.slice(i, i + 3);
        const promises = batch.map(async (ticker) => {
          try {
            const data = await fetchTripleTimeframe(ticker);
            const signals = {};
            for (const tf of TF_KEYS) {
              signals[tf] = data[tf] ? computeSignals(data[tf]) : null;
            }
            return { ticker, signals };
          } catch {
            return { ticker, signals: {} };
          }
        });
        const batchResults = await Promise.all(promises);
        if (cancelled) return;
        for (const r of batchResults) {
          results[r.ticker] = r.signals;
        }
        setAllSignals({ ...results });
      }
      if (!cancelled) setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [watchlist]);

  const sortedList = useMemo(() => {
    if (sortBy === 'default') return watchlist;
    return [...watchlist].sort((a, b) => {
      const getAvg = (t) => {
        const s = allSignals[t];
        if (!s) return 50;
        const scores = TF_KEYS.map((tf) => s[tf]?.score).filter((v) => v != null);
        return scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 50;
      };
      return sortBy === 'score-desc' ? getAvg(b) - getAvg(a) : getAvg(a) - getAvg(b);
    });
  }, [watchlist, allSignals, sortBy]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10,
          width: '90%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>WATCHLIST COMPARISON</div>
            <div style={{ fontSize: 10, color: 'var(--text-body)', marginTop: 2 }}>{watchlist.length} tickers · click to switch</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                fontSize: 10, padding: '3px 6px', borderRadius: 3, cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-body)',
              }}
            >
              <option value="default">Default order</option>
              <option value="score-desc">Most bullish</option>
              <option value="score-asc">Most bearish</option>
            </select>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center" style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-inner)' }}>
          <div style={{ minWidth: 80, fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.08em' }}>TICKER</div>
          {TF_KEYS.map((tf) => (
            <div key={tf} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.08em' }}>{TF_DISPLAY[tf]}</div>
          ))}
          <div style={{ minWidth: 52, textAlign: 'right', fontSize: 9, color: 'var(--text-body)', letterSpacing: '0.08em' }}>BIAS</div>
        </div>

        {/* Ticker rows */}
        <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          {loading && Object.keys(allSignals).length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div className="w-4 h-4 border-2 rounded-full animate-spin mx-auto mb-2"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-body)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-body)' }}>Loading tickers...</div>
            </div>
          ) : (
            sortedList.map((ticker) => (
              <TickerRow
                key={ticker}
                ticker={ticker}
                signals={allSignals[ticker]}
                isActive={ticker === activeTicker}
                onClick={() => { onTickerChange(ticker); onClose(); }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
