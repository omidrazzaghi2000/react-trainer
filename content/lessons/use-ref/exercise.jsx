// Exercise: an "undo send" chat box with a DOM ref (focus) and a ref box (the timer id).
import { useRef, useState } from 'react';

const UNDO_WINDOW_MS = 250; // short on purpose, so the checks run fast

export default function App() {
  const [messages, setMessages] = useState([{ id: 1, text: 'Are we still on for Friday?' }]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(null); // text waiting to be sent

  // TODO 1: create a ref for the message input: const inputRef = useRef(null);
  //         then attach it to the <input> below with ref={inputRef}.

  // TODO 2: a plain variable is reset on every render, so Undo never finds the timer.
  //         Replace it with a ref box: const timeoutRef = useRef(null);
  let timeoutId = null;

  function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setPending(text);
    setDraft('');
    // TODO 3: keep the id in timeoutRef.current instead of the plain variable.
    timeoutId = setTimeout(() => {
      setMessages((list) => [...list, { id: list.length + 1, text }]);
      setPending(null);
    }, UNDO_WINDOW_MS);
    // TODO 4: put the cursor back in the input: inputRef.current.focus();
  }

  function undo() {
    // TODO 5: clear the timer whose id is stored in timeoutRef.current.
    clearTimeout(timeoutId);
    setDraft(pending);
    setPending(null);
  }

  return (
    <section className="card stack" aria-label="Chat">
      <ul className="list" aria-label="Messages">
        {messages.map((m) => (
          <li key={m.id}>{m.text}</li>
        ))}
      </ul>
      {pending && (
        <p className="row muted" role="status">
          Sending “{pending}”…
          <button type="button" onClick={undo}>Undo</button>
        </p>
      )}
      <form className="row" onSubmit={send}>
        <input
          aria-label="Message"
          placeholder="Write a message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="primary">Send</button>
      </form>
    </section>
  );
}
