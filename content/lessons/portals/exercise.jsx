// Exercise: move the share dialog into a portal and make it keyboard-friendly.
import { useEffect, useId, useRef, useState } from 'react';
// TODO 1: import { createPortal } from 'react-dom';

function ShareDialog({ onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);

  // TODO 3: when the dialog opens, move focus to the Close button (closeRef).
  //         When it closes (effect cleanup), give focus back to whatever opened it.
  //         Tip: read document.activeElement *before* you move the focus.

  function handleKeyDown(e) {
    // TODO 4: close the dialog when the Escape key is pressed.
  }

  // TODO 1: return this markup through createPortal(…, document.body) so it
  //         escapes the card below, which clips everything inside it.
  // TODO 2: tell assistive technology this dialog is modal: aria-modal="true".
  return (
    <div className="overlay">
      <div className="modal stack" role="dialog" aria-labelledby={titleId}
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
    </div>
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
