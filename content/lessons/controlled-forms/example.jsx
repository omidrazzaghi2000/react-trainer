// Controlled forms: a workshop sign-up where React state is the single source of every field.
import { useState } from 'react';

// Every field starts with a defined value ('' not undefined). Switching a field from
// undefined to a string would trigger React's "uncontrolled to controlled" warning.
const EMPTY = { name: '', email: '', level: 'beginner', notes: '', newsletter: true };

export default function App() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(null);

  // One handler for every field: the input's name attribute says which key to update.
  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function handleSubmit(e) {
    e.preventDefault(); // stop the browser's full-page reload
    console.log('Submitted:', form);
    setSent(form);
    setForm(EMPTY); // controlled fields are cleared by resetting state
  }

  // Validation is derived from state on every render. No extra state needed.
  const emailError = form.email && !form.email.includes('@') ? 'Email needs an @.' : '';
  const canSubmit = form.name.trim() !== '' && form.email.includes('@');

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <h2>Workshop sign-up</h2>
      <label className="stack">
        Name
        <input name="name" value={form.name} onChange={handleChange} />
      </label>
      <label className="stack">
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} />
      </label>
      {emailError && <p className="error">{emailError}</p>}
      <label className="stack">
        Level
        <select name="level" value={form.level} onChange={handleChange}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </label>
      <label className="stack">
        Notes ({form.notes.length}/120)
        <textarea
          name="notes"
          rows={2}
          maxLength={120}
          value={form.notes}
          onChange={handleChange}
        />
      </label>
      <label className="row">
        <input
          name="newsletter"
          type="checkbox"
          checked={form.newsletter}
          onChange={handleChange}
        />
        Send me the newsletter
      </label>
      <button className="primary" type="submit" disabled={!canSubmit}>
        Sign up
      </button>
      {sent && (
        <p className="success">
          Thanks, {sent.name}! See you at the {sent.level} workshop.
        </p>
      )}
    </form>
  );
}
