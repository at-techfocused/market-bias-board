import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ children, content }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [open]);

  return (
    <div ref={triggerRef} style={{ display: 'inline-block', width: '100%' }}>
      <div onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      {open && createPortal(
        <div
          ref={tooltipRef}
          className="px-3 py-2.5 rounded shadow-lg text-[11px] leading-relaxed"
          style={{
            position: 'fixed',
            zIndex: 99999,
            background: '#1a2332',
            border: '1px solid #2d4a5e',
            color: '#cdd9e5',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            minWidth: 180,
            maxWidth: 360,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}
