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
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  return (
    <div ref={triggerRef} style={{ display: 'inline-block', width: '100%' }}>
      <div onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      {open && createPortal(
        <div ref={tooltipRef} style={{
          position: 'fixed', zIndex: 99999, top: pos.top, left: pos.left,
          width: pos.width, minWidth: 200, maxWidth: 360,
          background: '#141e2a', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 12px',
          color: 'var(--text-body)', fontSize: 10, lineHeight: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}
