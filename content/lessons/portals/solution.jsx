// Exercise: move the share dialog into a portal and make it keyboard-friendly.
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function ShareDialog({ onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current.focus();
    return () => opener?.focus();
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  return createPortal(
    <div className="overlay">
      <div className="modal stack" role="dialog" aria-modal="true" aria-labelledby={titleId}
        onKeyDown={handleKeyDown}>
        <h3 id={titleId}>Share playlist</h3>
        <label>
          Friend's email
          <input type="email" />
        </label>
        <div className="row">
          <button ref={closeRef} onClick={onClose}>Close</button>
          <button className="primary" onClick={onClose}>Send invite</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    // overflow + transform: a "fixed" overlay rendered in here is trapped and clipped.
    <section className="card stack" style={{ overflow: 'hidden', transform: 'translateZ(0)' }}>
      <strong>Road trip mix</strong>
      <p className="muted">14 songs · 52 min</p>
      <button onClick={() => setOpen(true)}>Share</button>
      {open && <ShareDialog onClose={() => setOpen(false)} />}
    </section>
  );
}
