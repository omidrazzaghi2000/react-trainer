// Exercise: keep the book search snappy with useDeferredValue + memo.
import { useState, useDeferredValue, memo } from 'react';

const BOOKS = [
  'Dune', 'Emma', 'Ulysses', 'Beloved', 'Dracula', 'Frankenstein', 'Middlemarch',
  'The Hobbit', 'Rebecca', 'Persuasion', 'Moby-Dick', 'Jane Eyre', 'The Odyssey',
  'Don Quixote', 'War and Peace', 'Anna Karenina', 'The Trial', 'Siddhartha',
  'The Little Prince', 'Invisible Cities', 'The Blind Owl', 'Things Fall Apart',
  'Pride and Prejudice', 'Wuthering Heights',
];

// Each row takes ~1 ms to render — imagine rich cards with covers and ratings.
function SlowBook({ title }) {
  const start = performance.now();
  while (performance.now() - start < 1) {
    // expensive rendering work
  }
  return <li>{title}</li>;
}

// TODO 3: wrap BookList in memo(...) so React can skip it while its `query` prop
//         is unchanged (the urgent render still passes the OLD deferred query).
function BookList({ query }) {
  // Keep this log: the checks count how often the slow list renders.
  console.log(`BookList render: "${query}"`);
  const matches = BOOKS.filter((b) => b.toLowerCase().includes(query.trim().toLowerCase()));
  if (matches.length === 0) return <p>No books match "{query}".</p>;
  return (
    <ul className="list">
      {matches.map((title) => (
        <SlowBook key={title} title={title} />
      ))}
    </ul>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  // TODO 1: create a deferred copy of the query: useDeferredValue(query).
  // TODO 2: the results are stale while `query` and the deferred query differ.
  const isStale = false;

  return (
    <section className="card stack">
      <label>
        Search books <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div
        role="region"
        aria-label="Search results"
        aria-busy={isStale}
        style={{ opacity: isStale ? 0.5 : 1 }}
      >
        {/* TODO 1 (continued): give the slow list the deferred query, not `query`. */}
        <BookList query={query} />
      </div>
    </section>
  );
}
