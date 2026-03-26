import { useState } from 'react';

const INDICATORS = [
  { key: 'ema', label: 'EMA Stack', desc: '20/50/100/200 alignment' },
  { key: 'smma', label: 'SMMA 99', desc: 'Price vs smoothed MA' },
  { key: 'rsi', label: 'RSI', desc: 'Relative Strength Index' },
  { key: 'macd', label: 'MACD', desc: 'Momentum crossover' },
  { key: 'pattern', label: 'Pattern', desc: 'Candlestick detection' },
];

const DEFAULT_WEIGHTS = { ema: 20, smma: 20, rsi: 20, macd: 20, pattern: 20 };

function SliderRow({ label, desc, value, onChange }) {
  const pct = Math.round((value / 40) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{ fontSize: 10, color: 'var(--text-body)', marginLeft: 6 }}>{desc}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>{value}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="range" min="0" max="40" step="1" value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            width: '100%', height: 6, appearance: 'none', WebkitAppearance: 'none',
            background: `linear-gradient(to right, var(--green) ${pct}%, var(--border) ${pct}%)`,
            borderRadius: 3, outline: 'none', cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}

const STORAGE_KEY = 'biasboard_weights';

export function loadWeights() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate
      if (parsed && typeof parsed.ema === 'number') return parsed;
    }
  } catch {}
  return { ...DEFAULT_WEIGHTS };
}

function saveWeights(w) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
}

export default function WeightSettings({ weights, onChange, onClose }) {
  const [local, setLocal] = useState({ ...weights });

  const total = Object.values(local).reduce((a, b) => a + b, 0);

  const handleChange = (key, val) => {
    setLocal((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    saveWeights(local);
    onChange(local);
    onClose();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_WEIGHTS });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10,
          width: '90%', maxWidth: 420, overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>INDICATOR WEIGHTS</div>
            <div style={{ fontSize: 10, color: 'var(--text-body)', marginTop: 2 }}>Adjust how each indicator contributes to the bias score</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>

        {/* Sliders */}
        <div style={{ padding: '16px 16px 8px' }}>
          {INDICATORS.map((ind) => (
            <SliderRow
              key={ind.key}
              label={ind.label}
              desc={ind.desc}
              value={local[ind.key]}
              onChange={(val) => handleChange(ind.key, val)}
            />
          ))}

          {/* Total indicator */}
          <div className="flex items-center justify-between" style={{
            padding: '10px 0', borderTop: '1px solid var(--border-inner)', marginTop: 4
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-body)' }}>Total weight</span>
            <span style={{
              fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: total === 100 ? 'var(--green)' : total > 100 ? 'var(--red)' : 'var(--amber)',
            }}>
              {total}/100
            </span>
          </div>
          {total !== 100 && (
            <div style={{ fontSize: 10, color: 'var(--amber)', marginBottom: 8 }}>
              Weights don't sum to 100. Scores will be normalized proportionally.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleReset} style={{
            fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-body)',
          }}>
            RESET DEFAULTS
          </button>
          <button onClick={handleApply} style={{
            fontSize: 10, fontWeight: 700, padding: '5px 16px', borderRadius: 4, cursor: 'pointer',
            background: 'var(--green)', border: 'none', color: '#0a1218', letterSpacing: '0.06em',
          }}>
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
}
