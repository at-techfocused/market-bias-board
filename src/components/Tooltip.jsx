import { useState, useRef, useEffect } from 'react';

export default function Tooltip({ children, content }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative" style={{ display: 'inline-block', width: '100%' }}>
      <div onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      {open && (
        <div
          className="absolute z-50 px-3 py-2.5 rounded shadow-lg text-[11px] leading-relaxed"
          style={{
            background: '#1a2332',
            border: '1px solid #2d4a5e',
            color: '#cdd9e5',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: 4,
            minWidth: 180,
            maxWidth: 320,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
