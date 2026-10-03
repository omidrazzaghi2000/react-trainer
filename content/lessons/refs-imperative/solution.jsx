// Exercise: let the parent focus and clear a search field through a small ref API.
import { useImperativeHandle, useRef, useState } from 'react';

export function SearchField({ ref, label }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    },
    clear() {
      setQuery('');
      inputRef.current.focus();
    },
  }), []);

  return (
    <div className="stack">
      <label>
        {label}
        <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <p className="muted">{query ? `Searching for "${query}"` : 'Type to search'}</p>
    </div>
  );
}

export default function App() {
  const searchRef = useRef(null);

  function handleFocus() {
    searchRef.current.focus();
  }

  function handleClear() {
    searchRef.current.clear();
  }

  return (
    <section className="card stack">
      <SearchField ref={searchRef} label="Search songs" />
      <div className="row">
        <button onClick={handleFocus}>Focus search</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </section>
  );
}
