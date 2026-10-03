// Exercise: stop needless re-renders and recalculations in a road-trip playlist.
import { memo, useCallback, useMemo, useState } from 'react';

const SONGS = [
  { id: 1, title: 'Africa', minutes: 5 },
  { id: 2, title: 'Dreams', minutes: 4 },
  { id: 3, title: 'Jolene', minutes: 3 },
  { id: 4, title: 'Hey Jude', minutes: 7 },
  { id: 5, title: 'Wonderwall', minutes: 4 },
];

// Pretend this is slow. Keep the console.log: the tests count how often it runs.
function totalMinutes(songs) {
  console.log('calculating total');
  return songs.reduce((sum, song) => sum + song.minutes, 0);
}

// TODO 1: wrap SongRow in memo() so it skips rendering when its props are unchanged.
function SongRow({ song, onRemove }) {
  console.log('render', song.title);
  return (
    <li className="row">
      <span>{song.title}</span>
      <span className="muted">{song.minutes} min</span>
      <button onClick={() => onRemove(song.id)}>Remove {song.title}</button>
    </li>
  );
}

export default function App() {
  const [songs, setSongs] = useState(SONGS);
  const [volume, setVolume] = useState(5);

  // TODO 2: only recalculate the total when `songs` changes (useMemo).
  const total = totalMinutes(songs);

  // TODO 3: keep the same function between renders with useCallback. Use the
  //         updater form of setSongs so the callback needs no dependencies.
  function removeSong(id) {
    setSongs(songs.filter((s) => s.id !== id));
  }

  return (
    <section className="card stack">
      <h2>Road trip playlist</h2>
      <div className="row">
        <button aria-label="Volume down" onClick={() => setVolume((v) => Math.max(0, v - 1))}>
          −
        </button>
        <span>Volume: {volume}</span>
        <button aria-label="Volume up" onClick={() => setVolume((v) => Math.min(10, v + 1))}>
          +
        </button>
      </div>
      <p>Total: {total} min</p>
      <ul className="list">
        {songs.map((song) => (
          <SongRow key={song.id} song={song} onRemove={removeSong} />
        ))}
      </ul>
    </section>
  );
}
