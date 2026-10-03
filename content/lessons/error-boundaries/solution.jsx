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
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.log('Caught by the reviews boundary:', error.message);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <ReviewsFallback error={this.state.error} onRetry={this.reset} />;
    }
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
