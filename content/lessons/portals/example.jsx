// Portals: a confirm dialog rendered into document.body that still lives in the React tree.
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const BoardContext = createContext('Board');

function ConfirmDialog({ task, onConfirm, onClose }) {
  const board = useContext(BoardContext); // context flows through the portal
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement; // remember who opened the dialog
    cancelRef.current.focus(); // move focus into the dialog
    return () => opener?.focus(); // and hand it back when the dialog closes
  }, []);

  // The DOM nodes go to <body>, but React still treats the dialog as a child of <TaskCard>.
  return createPortal(
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal stack" role="dialog" aria-modal="true" aria-labelledby={titleId}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h3 id={titleId}>Delete "{task}"?</h3>
        <p className="muted">It will be removed from {board}.</p>
        <div className="row">
          <button ref={cancelRef} onClick={onClose}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TaskCard({ task, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    // overflow + transform would trap and clip a normal "fixed" modal inside this row.
    // Clicks inside the portal still bubble up to this onClick, through the React tree.
    <li className="row" style={{ overflow: 'hidden', transform: 'translateZ(0)' }}
      onClick={(e) => console.log('<TaskCard> saw a click on:', e.target.textContent)}>
      <span>{task}</span>
      <button onClick={() => setConfirming(true)}>Delete</button>
      {confirming && (
        <ConfirmDialog task={task} onConfirm={() => onDelete(task)}
          onClose={() => setConfirming(false)} />
      )}
    </li>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(['Write release notes', 'Fix login bug', 'Ship v2.1']);

  function remove(task) {
    setTasks((all) => all.filter((t) => t !== task));
  }

  return (
    <BoardContext value="Sprint 12">
      <section className="card stack">
        <strong>Sprint 12 · To do</strong>
        <ul className="list">
          {tasks.map((t) => <TaskCard key={t} task={t} onDelete={remove} />)}
        </ul>
      </section>
    </BoardContext>
  );
}
