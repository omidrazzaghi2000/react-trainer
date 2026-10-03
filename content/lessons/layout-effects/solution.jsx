// Exercise: measure the tooltip before paint and flip it below when there is no room above.
import { useLayoutEffect, useRef, useState } from 'react';

const GAP = 8;

function Tooltip({ anchor, children }) {
  const tipRef = useRef(null);
  const [tipHeight, setTipHeight] = useState(0); // unknown until it is in the DOM

  useLayoutEffect(() => {
    setTipHeight(tipRef.current.getBoundingClientRect().height);
  }, [children]);

  const placement = anchor.top - tipHeight - GAP < 0 ? 'bottom' : 'top';

  const top = placement === 'top' ? anchor.top - tipHeight - GAP : anchor.bottom + GAP;

  return (
    <div ref={tipRef} role="tooltip" data-placement={placement} className="card"
      style={{ position: 'fixed', top, left: anchor.left, maxWidth: 220, padding: 8 }}>
      {children}
    </div>
  );
}

const TRACKS = [
  { title: 'Morning Run', info: 'Lo-fi · 3:12' },
  {
    title: 'Night Drive',
    info: 'Synthwave · 4:05 · Linus says it sounds best on an empty highway after midnight.',
  },
];

export default function App() {
  const [active, setActive] = useState(null); // { track, anchor }

  function show(track, e) {
    setActive({ track, anchor: e.currentTarget.getBoundingClientRect() });
  }

  return (
    <section className="card stack">
      <strong>Playlist (hover a track)</strong>
      {TRACKS.map((track) => (
        <button key={track.title} style={{ alignSelf: 'flex-start' }}
          onMouseEnter={(e) => show(track, e)} onMouseLeave={() => setActive(null)}>
          {track.title}
        </button>
      ))}
      {active && <Tooltip anchor={active.anchor}>{active.track.info}</Tooltip>}
    </section>
  );
}
