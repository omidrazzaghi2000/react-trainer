// Exercise: wire up the inbox — clicks, bubbling, a search form and the keyboard.
import { useState } from 'react';

const INBOX = [
  { id: 1, from: 'Maryam', subject: 'Design review at 3pm', starred: false },
  { id: 2, from: 'GitHub', subject: 'Your build passed', starred: true },
  { id: 3, from: 'Reza', subject: 'Lunch on Friday?', starred: false },
];

function EmailRow({ email, onOpen, onToggleStar }) {
  return (
    // TODO 1: clicking anywhere on the row must call onOpen.
    //         Pass the function itself: onClick={onOpen}, not onOpen().
    <li className="row" style={{ cursor: 'pointer' }}>
      <button
        aria-label={`Star ${email.subject}`}
        aria-pressed={email.starred}
        onClick={(e) => {
          // TODO 2: call onToggleStar(), and stop this click from bubbling up to
          //         the row (e.stopPropagation()) so starring doesn't open the email.
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
    // TODO 3: stop the browser's default submit (a full page reload) with
    //         e.preventDefault(), then store the typed text:
    //         setSearch(e.currentTarget.elements.q.value);
  }

  function handleKeyDown(e) {
    // TODO 4: when e.key is 'Escape', empty the box (e.currentTarget.value = '')
    //         and show every email again with setSearch('').
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
