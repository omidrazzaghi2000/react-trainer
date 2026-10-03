// Exercise: wire up the inbox — clicks, bubbling, a search form and the keyboard.
import { useState } from 'react';

const INBOX = [
  { id: 1, from: 'Maryam', subject: 'Design review at 3pm', starred: false },
  { id: 2, from: 'GitHub', subject: 'Your build passed', starred: true },
  { id: 3, from: 'Reza', subject: 'Lunch on Friday?', starred: false },
];

function EmailRow({ email, onOpen, onToggleStar }) {
  return (
    <li className="row" style={{ cursor: 'pointer' }} onClick={onOpen}>
      <button
        aria-label={`Star ${email.subject}`}
        aria-pressed={email.starred}
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
      >
        {email.starred ? '★' : '☆'}
      </button>
      <strong>{email.from}</strong>
      <span>{email.subject}</span>
    </li>
  );
}

export default function App() {
  const [emails, setEmails] = useState(INBOX);
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');

  const opened = emails.find((mail) => mail.id === openId);
  const visible = emails.filter((mail) =>
    mail.subject.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleStar(id) {
    setEmails(emails.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(e.currentTarget.elements.q.value);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.currentTarget.value = '';
      setSearch('');
    }
  }

  return (
    <div className="stack">
      <form className="row" aria-label="Search mail" onSubmit={handleSearch}>
        <input type="search" name="q" aria-label="Search" onKeyDown={handleKeyDown} />
        <button type="submit">Search</button>
      </form>
      <ul className="list">
        {visible.map((mail) => (
          <EmailRow
            key={mail.id}
            email={mail}
            onOpen={() => setOpenId(mail.id)}
            onToggleStar={() => toggleStar(mail.id)}
          />
        ))}
      </ul>
      <section className="card" aria-label="Reading pane">
        {opened ? (
          <h3 style={{ margin: 0 }}>{opened.subject}</h3>
        ) : (
          <p className="muted">No email open</p>
        )}
      </section>
    </div>
  );
}
