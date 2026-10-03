// useOptimistic: a support chat that shows your message instantly and rolls back on failure.
import { startTransition, useOptimistic, useRef, useState } from 'react';

let nextId = 2;

// Fake server: 1 s of latency; any message containing "fail" is rejected.
function deliver(message) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (/fail/i.test(message.text)) reject(new Error(`"${message.text}" was not sent.`));
      else resolve(message);
    }, 1000);
  });
}

export default function App() {
  // The real state: only messages the server has confirmed.
  const [messages, setMessages] = useState([{ id: 1, text: 'Hi! How can we help?' }]);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  // While an Action runs: real messages + pending ones. When it ends, the layer is dropped.
  const [shownMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (current, pending) => [...current, { ...pending, sending: true }],
  );

  // A form action already runs inside a transition, so optimistic updates are allowed.
  async function sendAction(formData) {
    // The client picks the id, so the row keeps its key when the server confirms it.
    const message = { id: nextId++, text: formData.get('text') };
    addOptimisticMessage(message); // 1. show it right now
    formRef.current.reset();
    try {
      const saved = await deliver(message); // 2. wait for the truth
      console.log('confirmed:', saved.text);
      // After an await, wrap updates again so they join the same Action.
      startTransition(() => {
        setMessages((list) => [...list, saved]);
        setError(null);
      });
    } catch (err) {
      setError(err.message); // 3. no undo code: the pending copy simply disappears
    }
  }

  return (
    <section className="card stack">
      <h2>Support chat</h2>
      <ul className="list" aria-label="Messages">
        {shownMessages.map((m) => (
          <li key={m.id} style={{ opacity: m.sending ? 0.6 : 1 }}>
            {m.text} {m.sending && <small className="muted">Sending…</small>}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="error">{error}</p>}
      <form ref={formRef} action={sendAction} className="row">
        <input name="text" aria-label="Message" placeholder='Try "please fail"' required />
        <button className="primary">Send</button>
      </form>
    </section>
  );
}
