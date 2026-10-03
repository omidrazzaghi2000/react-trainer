// Events: a chat room — submit, keyboard, bubbling and handlers passed as props.
import { useState } from 'react';

let nextId = 3; // id counter for new messages

// Message decides WHEN something happens; the parent decides WHAT (onLike / onDelete).
function Message({ text, likes, onLike, onDelete }) {
  function handleRowClick(e) {
    // e.target = the element you clicked; e.currentTarget = the one with this handler.
    console.log(`click on <${e.target.tagName.toLowerCase()}> bubbled up to the <li>`);
    onLike();
  }

  function handleDelete(e) {
    e.stopPropagation(); // otherwise the click bubbles to the <li> and adds a like
    onDelete();
  }

  return (
    <li className="row" onClick={handleRowClick} style={{ cursor: 'pointer' }}>
      <span style={{ flex: 1 }}>{text}</span>
      <span className="badge">{likes} likes</span>
      <button onClick={handleDelete} aria-label={`Delete "${text}"`}>×</button>
    </li>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi team!', likes: 0 },
    { id: 2, text: 'Stand-up in 5 minutes', likes: 2 },
  ]);
  const [draftLength, setDraftLength] = useState(0);

  function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default: a full-page form submission
    const form = e.currentTarget;
    const text = form.elements.message.value.trim(); // read the input by its name
    if (text) setMessages([...messages, { id: nextId++, text, likes: 0 }]);
    form.reset();
    setDraftLength(0);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.currentTarget.value = '';
      setDraftLength(0);
    }
  }

  function like(id) {
    setMessages(messages.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)));
  }

  return (
    <section className="card stack">
      <h2 style={{ margin: 0 }}>#general</h2>
      <ul className="list">
        {messages.map((m) => (
          <Message
            key={m.id}
            text={m.text}
            likes={m.likes}
            // Pass a function. onLike={like(m.id)} would run it during render.
            onLike={() => like(m.id)}
            onDelete={() => setMessages(messages.filter((x) => x.id !== m.id))}
          />
        ))}
      </ul>
      <form className="row" onSubmit={handleSubmit}>
        <input
          name="message"
          aria-label="Message"
          placeholder="Enter sends, Esc clears"
          maxLength={80}
          onChange={(e) => setDraftLength(e.target.value.length)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="primary">Send</button>
        <span className="muted">{draftLength}/80</span>
      </form>
    </section>
  );
}
