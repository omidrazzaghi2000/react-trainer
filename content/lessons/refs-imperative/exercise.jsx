// Exercise: let the parent focus and clear a search field through a small ref API.
import { useImperativeHandle, useRef, useState } from 'react';

export function SearchField({ ref, label }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  // TODO 1: expose exactly two methods to the parent through the `ref` prop:
  //         useImperativeHandle(ref, () => ({ focus() { … }, clear() { … } }), []);
  //         focus() puts the cursor in the input.
  //         clear() empties the text (it lives in state!) and then focuses the input.

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
  // TODO 2: create a ref with useRef(null) and pass it down: <SearchField ref={…} />.

  function handleFocus() {
    // TODO 3: ask the search field to focus itself (call focus() on your ref).
  }

  function handleClear() {
    // TODO 4: ask the search field to clear itself (call clear() on your ref).
  }

  return (
    <section className="card stack">
      <SearchField label="Search songs" />
      <div className="row">
        <button onClick={handleFocus}>Focus search</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </section>
  );
}
