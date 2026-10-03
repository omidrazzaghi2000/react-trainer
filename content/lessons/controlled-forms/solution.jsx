// Exercise: turn the table-booking form into a controlled form.
import { useState } from 'react';

const INITIAL = { name: '', guests: '2', notes: '', agree: false };

export default function App() {
  const [form, setForm] = useState(INITIAL);
  const [booking, setBooking] = useState(null);

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setBooking(form);
  }

  const trimmedName = form.name.trim();
  const nameError = trimmedName.length === 1 ? 'Name must be at least 2 characters.' : '';
  const canSubmit = trimmedName.length >= 2 && form.agree;

  return (
    <form className="card stack" aria-label="Book a table" onSubmit={handleSubmit}>
      <h2>Book a table</h2>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" value={form.name} onChange={handleChange} />
      {nameError && (
        <p className="error" role="alert">
          {nameError}
        </p>
      )}
      <label htmlFor="guests">Guests</label>
      <select id="guests" name="guests" value={form.guests} onChange={handleChange}>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
      <label htmlFor="notes">Notes</label>
      <textarea
        id="notes"
        name="notes"
        rows={2}
        maxLength={140}
        value={form.notes}
        onChange={handleChange}
      />
      <p className="muted">{form.notes.length}/140</p>
      <label className="row">
        <input name="agree" type="checkbox" checked={form.agree} onChange={handleChange} />
        I agree to the house rules
      </label>
      <button className="primary" type="submit" disabled={!canSubmit}>
        Book table
      </button>
      {booking && (
        <p className="success" role="status">
          Table for {booking.guests} booked under {booking.name}.
        </p>
      )}
    </form>
  );
}
