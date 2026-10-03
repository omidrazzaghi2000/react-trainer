// Exercise: make the playlist and the "Now playing" panel agree by lifting state up.
import { useState } from 'react';

const TRACKS = [
  { id: 't1', title: 'Blue in Green', artist: 'Miles Davis' },
  { id: 't2', title: 'Naima', artist: 'John Coltrane' },
  { id: 't3', title: 'Peace Piece', artist: 'Bill Evans' },
];

// Controlled: the parent says which track is selected and hears about clicks.
function Playlist({ selectedId, onSelect }) {
  return (
    <section className="card" aria-label="Playlist">
      <h3>Playlist</h3>
      <ul className="list">
        {TRACKS.map((track) => (
          <li key={track.id}>
            <button
              aria-pressed={track.id === selectedId}
              onClick={() => onSelect(track.id)}
            >
              {track.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NowPlaying({ track, onNext }) {
  return (
    <section className="card" aria-label="Now playing">
      <h3>Now playing</h3>
      <p>
        <strong>{track.title}</strong>
      </p>
      <p className="muted">{track.artist}</p>
      <button onClick={onNext}>Next</button>
    </section>
  );
}

export default function App() {
  // The single source of truth, owned by the closest common parent.
  const [selectedId, setSelectedId] = useState(TRACKS[0].id);
  const track = TRACKS.find((t) => t.id === selectedId);

  function playNext() {
    const index = TRACKS.findIndex((t) => t.id === selectedId);
    setSelectedId(TRACKS[(index + 1) % TRACKS.length].id);
  }

  return (
    <div className="grid">
      <Playlist selectedId={selectedId} onSelect={setSelectedId} />
      <NowPlaying track={track} onNext={playNext} />
    </div>
  );
}
