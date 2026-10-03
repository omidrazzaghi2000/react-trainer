// Exercise: turn the table-booking form into a controlled form.
import { useState } from 'react';

const INITIAL = { name: '', guests: '2', notes: '', agree: false };

export default function App() {
  const [form, setForm] = useState(INITIAL);
  const [booking, setBooking] = useState(null);

  // TODO 1: write ONE change handler for every field. Read name, type, value and
  //         checked from e.target, then copy the form with the changed key:
  //         setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  function handleChange(e) {}

  function handleSubmit(e) {
    // TODO 3: stop the page reload with e.preventDefault(), then save a
    //         snapshot of the form: setBooking(form)
  }

  // TODO 4: derive validation from state (no extra useState needed):
  //   nameError → 'Name must be at least 2 characters.' when the trimmed name
  //               has exactly 1 character (show nothing while it is still empty)
  //   canSubmit → true only when the trimmed name has 2+ characters AND agree is ticked
  const nameError = '';
  const canSubmit = true;

  return (
    <form className="card stack" aria-label="Book a table" onSubmit={handleSubmit}>
      <h2>Book a table</h2>
      {/* TODO 2: make every field controlled: value={form.…} (checked={form.agree}
          for the checkbox) plus onChange={handleChange}. The name attributes are ready. */}
      <label htmlFor="name">Name</label>
      <input id="name" name="name" />
      {nameError && (
        <p className="error" role="alert">
          {nameError}
        </p>
      )}
      <label htmlFor="guests">Guests</label>
      <select id="guests" name="guests">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" rows={2} maxLength={140} />
      <p className="muted">{form.notes.length}/140</p>
      <label className="row">
        <input name="agree" type="checkbox" />
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
