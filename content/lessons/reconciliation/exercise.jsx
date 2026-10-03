// Exercise: fix the messenger's drafts — keep typing smooth, start fresh per contact.
import { useState } from 'react';

const CONTACTS = [
  { id: 'ada', name: 'Ada' },
  { id: 'linus', name: 'Linus' },
  { id: 'grace', name: 'Grace' },
];

function Chat({ contact, compact }) {
  const [draft, setDraft] = useState('');

  // TODO 1: DraftInput is defined inside Chat, so every render of Chat creates a NEW
  //         component type. React then unmounts the old <input> and mounts a new one
  //         on each keystroke. Move it to the top level of the file and pass what it
  //         needs as props (name, value, onChange).
  function DraftInput() {
    return (
      <label className="stack">
        Message to {contact.name}
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      </label>
    );
  }

  return (
    <section className={compact ? 'stack' : 'card stack'}
      aria-label={`Chat with ${contact.name}`}>
      <DraftInput />
      <div className="row">
        <span className="muted">{draft.length} / 140</span>
        <button disabled={!draft} onClick={() => setDraft('')}>Send</button>
      </div>
    </section>
  );
}

export default function App() {
  const [contactId, setContactId] = useState('ada');
  const [compact, setCompact] = useState(false);
  const contact = CONTACTS.find((c) => c.id === contactId);

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Contacts">
        {CONTACTS.map((c) => (
          <button key={c.id} aria-pressed={c.id === contactId}
            onClick={() => setContactId(c.id)}>
            {c.name}
          </button>
        ))}
        <label>
          <input type="checkbox" checked={compact}
            onChange={(e) => setCompact(e.target.checked)} /> Compact
        </label>
      </div>

      {/* TODO 2: switching contacts keeps the old draft, because <Chat> is the same type
                  at the same position. Give it a key that changes with the contact. */}
      {/* TODO 3: toggling Compact wraps the chat in an extra <div>, which moves <Chat> to
                  a different position in the tree, so React throws its state away.
                  Render one <Chat … compact={compact} /> in a single place instead. */}
      {compact ? (
        <div className="muted">
          <Chat contact={contact} compact />
        </div>
      ) : (
        <Chat contact={contact} compact={false} />
      )}
    </div>
  );
}
