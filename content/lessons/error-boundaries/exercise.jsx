// Exercise: build an error boundary so one bad review can't take down the whole page.
import { Component, useState } from 'react';

// Ready to use: the fallback UI your boundary should show.
function ReviewsFallback({ error, onRetry }) {
  return (
    <div role="alert" className="card">
      <p className="error">Reviews failed to load: {error.message}</p>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}

export class ErrorBoundary extends Component {
  // TODO 1: start with state = { error: null } and add
  //         static getDerivedStateFromError(error) that returns { error }.

  // TODO 2: add componentDidCatch(error, info) and report the error with
  //         console.log (not console.error), including error.message.

  // TODO 3: add a reset method (an arrow function field): call this.props.onReset?.()
  //         so the parent can fix the data, then clear the error from state.

  render() {
    // TODO 4: when state holds an error, render
    //         <ReviewsFallback error={…} onRetry={…} /> instead of the children.
    return this.props.children;
  }
}

function Review({ review }) {
  // A review without an author is bad data: rendering it throws.
  if (!review.author) throw new Error(`Review #${review.id} has no author`);
  return (
    <li>
      <strong>{review.author}</strong>: {review.text}
    </li>
  );
}

const SAVED = [
  { id: 1, author: 'Mina', text: 'Great beans, fast delivery.' },
  { id: 2, author: 'Leo', text: 'A bit too bitter for me.' },
];
const BROKEN = { id: 3, text: 'Five stars!' }; // like a bad API response

export default function App() {
  const [reviews, setReviews] = useState(SAVED);

  return (
    <section className="card stack">
      <h3>Colombia beans · Reviews</h3>
      <ErrorBoundary onReset={() => setReviews(SAVED)}>
        <ul className="list">
          {reviews.map((r) => <Review key={r.id} review={r} />)}
        </ul>
      </ErrorBoundary>
      <button onClick={() => setReviews([...SAVED, BROKEN])}>Load new reviews</button>
    </section>
  );
}
