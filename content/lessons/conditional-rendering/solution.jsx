// Exercise: show the right UI for each situation in a small inbox.
import { useState } from 'react';

const MESSAGES = [
  { id: 1, from: 'Sina', text: 'The deploy is done', unread: true },
  { id: 2, from: 'Tara', text: 'Can you review my PR?', unread: true },
];

function UnreadBadge({ count }) {
  if (count === 0) return null;
  return (
    <span className="badge" aria-label="Unread count">
      {count}
    </span>
  );
}

function MessageList({ messages, onArchive }) {
  if (messages.length === 0) {
    return <p className="success">All caught up!</p>;
  }
  return (
    <ul className="list">
      {messages.map((m) => (
        <li key={m.id} className={m.unread ? 'row' : 'row muted'}>
          <strong>{m.from}</strong>
          <span style={{ flex: 1 }}>{m.text}</span>
          <button
            onClick={() => onArchive(m.id)}
            aria-label={`Archive message from ${m.from}`}
          >
            Archive
          </button>
        </li>
      ))}
    </ul>
  );
}

function Composer() {
  const [draft, setDraft] = useState(''); // lost whenever Composer unmounts
  return (
    <textarea aria-label="Draft" value={draft} onChange={(e) => setDraft(e.target.value)} />
  );
}

export default function App() {
  const [messages, setMessages] = useState(MESSAGES);
  const [showComposer, setShowComposer] = useState(true);
  const unread = messages.filter((m) => m.unread).length;

  function markAllRead() {
    setMessages(messages.map((m) => ({ ...m, unread: false })));
  }

  function archive(id) {
    setMessages(messages.filter((m) => m.id !== id));
  }

  return (
    <section className="card stack" aria-label="Inbox">
      <div className="row">
        <h2 style={{ margin: 0 }}>Inbox</h2>
        <UnreadBadge count={unread} />
      </div>
      <button onClick={markAllRead} disabled={unread === 0}>
        Mark all as read
      </button>
      <MessageList messages={messages} onArchive={archive} />

      <button onClick={() => setShowComposer(!showComposer)}>
        {showComposer ? 'Hide composer' : 'Show composer'}
      </button>
      <div hidden={!showComposer}>
        <Composer />
      </div>
    </section>
  );
}
