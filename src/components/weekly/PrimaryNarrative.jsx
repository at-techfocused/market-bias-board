export default function PrimaryNarrative({ narrative }) {
  if (!narrative?.length) {
    return (
      <div className="rounded-[10px]" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase', marginBottom: 6 }}>WEEKLY NARRATIVE</div>
        <div style={{ fontSize: 12, color: 'var(--text-body)', opacity: 0.5 }}>Narrative not available</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px]"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 12 }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-body)', textTransform: 'uppercase' }}>
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
          <div key={i} className="flex gap-2.5" style={{ fontSize: 13, lineHeight: 1.65 }}>
            <span style={{ color: 'var(--text-body)', opacity: 0.3, flexShrink: 0 }}>&#8226;</span>
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
