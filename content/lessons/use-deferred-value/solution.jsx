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

const BookList = memo(function BookList({ query }) {
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
});

export default function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

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
        <BookList query={deferredQuery} />
      </div>
    </section>
  );
}
