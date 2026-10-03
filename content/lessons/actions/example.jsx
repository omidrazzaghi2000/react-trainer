// Actions: a café booking form built with useActionState, useFormStatus and FormData.
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// An action: (previous state, FormData) → next state. It may be async.
async function bookTable(previous, formData) {
  const name = formData.get('name').trim();
  const guests = formData.get('guests');
  console.log('bookTable called with', { name, guests });

  // Validation errors are simply returned as the next state.
  const errors = {};
  if (!name) errors.name = 'Please enter your name.';
  if (!(Number(guests) >= 1 && Number(guests) <= 8)) errors.guests = 'We seat 1 to 8 guests.';
  if (errors.name || errors.guests) {
    return { ...previous, errors, values: { name, guests } }; // keep what was typed
  }

  await wait(1000); // pretend to talk to the server
  const booking = { id: previous.bookings.length + 1, text: `${name} · ${guests} guests` };
  const bookings = [...previous.bookings, booking];
  return { errors: {}, values: { name: '', guests: '2' }, bookings }; // fields reset to these
}

// useFormStatus reads the status of the PARENT <form>, so it must live in a child.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="primary" disabled={pending}>
      {pending ? 'Booking…' : 'Book a table'}
    </button>
  );
}

const initialState = { errors: {}, values: { name: '', guests: '2' }, bookings: [] };

export default function App() {
  const [state, formAction, isPending] = useActionState(bookTable, initialState);

  return (
    <section className="card stack">
      {/* No onSubmit, no preventDefault: React calls the action with the form's FormData. */}
      <form action={formAction} className="stack">
        <label>
          Name <input name="name" defaultValue={state.values.name} />
        </label>
        {state.errors.name && <p className="error">{state.errors.name}</p>}
        <label>
          Guests <input name="guests" type="number" defaultValue={state.values.guests} />
        </label>
        {state.errors.guests && <p className="error">{state.errors.guests}</p>}
        <SubmitButton />
      </form>
      <p className="muted">
        {isPending ? 'Saving your booking…' : `${state.bookings.length} booking(s) today`}
      </p>
      <ul className="list">
        {state.bookings.map((b) => (
          <li key={b.id}>{b.text}</li>
        ))}
      </ul>
    </section>
  );
}
