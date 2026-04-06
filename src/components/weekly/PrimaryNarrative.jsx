export default function PrimaryNarrative({ narrative }) {
  if (!narrative?.length) {
    return (
      <div className="rounded-[10px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>WEEKLY NARRATIVE</div>
        <div style={{ fontSize: 11, color: 'var(--text-body)', opacity: 0.5 }}>Data unavailable — refresh to retry</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px]"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 10 }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase' }}>
          WEEKLY NARRATIVE
        </div>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '1px 6px',
            borderRadius: 3,
            background: 'rgba(200,124,0,0.12)',
            color: 'var(--amber)',
            textTransform: 'uppercase',
          }}
        >
          AI GENERATED
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {narrative.map((item, i) => (
          <div key={i} className="flex gap-2" style={{ fontSize: 12, lineHeight: 1.6 }}>
            <span style={{ color: 'var(--text-body)', opacity: 0.4, flexShrink: 0 }}>-</span>
            <span style={{ color: 'var(--text-body)' }}>
              {renderBoldText(item.text, item.bold)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderBoldText(text, boldWord) {
  if (!boldWord || !text.includes(boldWord)) {
    return text;
  }
  const idx = text.indexOf(boldWord);
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#e8f0f8', fontWeight: 700 }}>{boldWord}</span>
      {text.slice(idx + boldWord.length)}
    </>
  );
}
