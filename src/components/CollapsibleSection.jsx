import { useState } from 'react';

export default function CollapsibleSection({ title, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full collapsible-btn"
        style={{
          padding: '0 0 10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 9, color: '#c8d8e8', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 0 }}>
            {title}
          </span>
          {badge}
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          style={{
            color: 'var(--text-body)',
            opacity: 0.5,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}
