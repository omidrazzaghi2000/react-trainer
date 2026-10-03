// Exercise: fix the messenger's drafts — keep typing smooth, start fresh per contact.
import { useState } from 'react';

const CONTACTS = [
  { id: 'ada', name: 'Ada' },
  { id: 'linus', name: 'Linus' },
  { id: 'grace', name: 'Grace' },
];

function DraftInput({ name, value, onChange }) {
  return (
    <label className="stack">
      Message to {name}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Chat({ contact, compact }) {
  const [draft, setDraft] = useState('');

  return (
    <section className={compact ? 'stack' : 'card stack'}
      aria-label={`Chat with ${contact.name}`}>
      <DraftInput name={contact.name} value={draft} onChange={setDraft} />
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

      <Chat key={contact.id} contact={contact} compact={compact} />
    </div>
  );
}
