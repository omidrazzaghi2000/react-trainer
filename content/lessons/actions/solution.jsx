// Exercise: a newsletter form built with Actions — useActionState + useFormStatus.
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const initialState = { error: null, email: '', subscribed: null };

async function subscribe(previousState, formData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) {
    // Returned as state; `email` becomes the input's defaultValue after the reset.
    return { error: 'Please enter a valid email.', email, subscribed: null };
  }
  await wait(250); // the fake server
  return { error: null, email: '', subscribed: email };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="primary" disabled={pending}>
      {pending ? 'Subscribing…' : 'Subscribe'}
    </button>
  );
}

export default function App() {
  const [state, formAction] = useActionState(subscribe, initialState);

  return (
    <section className="card stack">
      <h3>Join the newsletter</h3>
      <form action={formAction} className="row">
        <label>
          Email <input name="email" defaultValue={state.email} />
        </label>
        <SubmitButton />
      </form>
      {state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
      {state.subscribed && (
        <p role="status" className="success">
          Thanks! {state.subscribed} is subscribed.
        </p>
      )}
    </section>
  );
}
