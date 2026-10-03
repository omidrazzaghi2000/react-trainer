// Exercise: a newsletter form built with Actions — useActionState + useFormStatus.
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const initialState = { error: null, email: '', subscribed: null };

// TODO 1: make this the form's action: (previousState, formData) → next state.
//   - read the email with formData.get('email') and trim it
//   - no "@" in it? return { error: 'Please enter a valid email.', email, subscribed: null }
//     (returning the typed email lets the input keep it after React resets the form)
//   - otherwise `await wait(250)` (the fake server) and return
//     { error: null, email: '', subscribed: email }
async function subscribe(previousState, formData) {
  return previousState;
}

function SubmitButton() {
  // TODO 2: read { pending } from useFormStatus() instead of this constant.
  const pending = false;
  return (
    <button type="submit" className="primary" disabled={pending}>
      {pending ? 'Subscribing…' : 'Subscribe'}
    </button>
  );
}

export default function App() {
  // TODO 3: get [state, formAction] from useActionState(subscribe, initialState).
  const state = initialState;
  const formAction = () => {};

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
