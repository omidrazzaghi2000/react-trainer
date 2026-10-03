// Exercise: an "undo send" chat box with a DOM ref (focus) and a ref box (the timer id).
import { useRef, useState } from 'react';

const UNDO_WINDOW_MS = 250; // short on purpose, so the checks run fast

export default function App() {
  const [messages, setMessages] = useState([{ id: 1, text: 'Are we still on for Friday?' }]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(null); // text waiting to be sent

  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setPending(text);
    setDraft('');
    timeoutRef.current = setTimeout(() => {
      setMessages((list) => [...list, { id: list.length + 1, text }]);
      setPending(null);
    }, UNDO_WINDOW_MS);
    inputRef.current.focus();
  }

  function undo() {
    clearTimeout(timeoutRef.current);
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
          ref={inputRef}
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
