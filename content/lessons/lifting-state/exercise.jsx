// Exercise: make the playlist and the "Now playing" panel agree by lifting state up.
import { useState } from 'react';

const TRACKS = [
  { id: 't1', title: 'Blue in Green', artist: 'Miles Davis' },
  { id: 't2', title: 'Naima', artist: 'John Coltrane' },
  { id: 't3', title: 'Peace Piece', artist: 'Bill Evans' },
];

// TODO 2: make Playlist a controlled component: receive { selectedId, onSelect }
//         as props and delete its own copy of the state.
function Playlist() {
  const [selectedId, setSelectedId] = useState(TRACKS[0].id);
  return (
    <section className="card" aria-label="Playlist">
      <h3>Playlist</h3>
      <ul className="list">
        {TRACKS.map((track) => (
          <li key={track.id}>
            <button
              aria-pressed={track.id === selectedId}
              onClick={() => setSelectedId(track.id)}
            >
              {track.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// TODO 3: receive { track, onNext } as props instead of keeping a second copy of the state.
function NowPlaying() {
  const [selectedId, setSelectedId] = useState(TRACKS[0].id);
  const track = TRACKS.find((t) => t.id === selectedId);

  function next() {
    const index = TRACKS.findIndex((t) => t.id === selectedId);
    setSelectedId(TRACKS[(index + 1) % TRACKS.length].id);
  }

  return (
    <section className="card" aria-label="Now playing">
      <h3>Now playing</h3>
      <p>
        <strong>{track.title}</strong>
      </p>
      <p className="muted">{track.artist}</p>
      <button onClick={next}>Next</button>
    </section>
  );
}

export default function App() {
  // TODO 1: lift the selected id up to this closest common parent:
  //         const [selectedId, setSelectedId] = useState(TRACKS[0].id);
  //         Then derive the current track and move the "next" logic up here too.

  // TODO 4: pass it down — selectedId + onSelect to Playlist,
  //         and the current track + onNext to NowPlaying.
  return (
    <div className="grid">
      <Playlist />
      <NowPlaying />
    </div>
  );
}
