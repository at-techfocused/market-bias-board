import { TF_KEYS, TF_DISPLAY, getBiasLabel } from '../utils/format';

function getSignalColor(score) {
  if (score == null) return 'var(--amber)';
  if (score <= 40) return 'var(--red)';
  if (score >= 60) return 'var(--green)';
  return 'var(--amber)';
}

function getActiveBg(score) {
  if (score == null) return '#0f1208';
  if (score <= 40) return '#120a0a';
  if (score >= 60) return '#0a120d';
  return '#0f1208';
}

export default function TimeframeTabs({ signals, activeTf, onTfChange }) {
  return (
    <div className="grid grid-cols-3 tf-tabs" style={{ background: 'var(--bg-deep)' }}>
      {TF_KEYS.map((tf) => {
        const isActive = tf === activeTf;
        const sig = signals?.[tf];
        const score = sig?.score;
        const color = getSignalColor(score);
        const bias = getBiasLabel(score);
        const bg = isActive ? getActiveBg(score) : 'transparent';

        return (
          <button key={tf} onClick={() => onTfChange(tf)}
            style={{
              background: bg,
              border: 'none',
              borderBottom: isActive ? `2px solid ${color}` : '2px solid var(--border)',
              cursor: 'pointer',
              padding: '10px 0 8px',
              transition: 'all 0.15s ease',
            }}>
            <div style={{ fontSize: 10, color: 'var(--text-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
              {TF_DISPLAY[tf]}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {score ?? '--'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-body)', marginTop: 2 }}>
              {bias}
            </div>
          </button>
        );
      })}
    </div>
  );
}
