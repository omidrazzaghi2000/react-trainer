// Exercise: load playlists in an async transition — urgent highlight, pending state.
import { useState, useTransition } from 'react';

const LIBRARY = {
  Jazz: ['So What', 'Take Five', 'Blue in Green'],
  Rock: ['Back in Black', 'Paranoid', 'Heroes'],
  'Lo-fi': ['Coffee Rain', 'Night Walk', 'Paper Planes'],
};

// A fake API: answers after 250 ms (it never touches the network).
function fetchPlaylist(genre) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ genre, songs: LIBRARY[genre] }), 250);
  });
}

export default function App() {
  const [selected, setSelected] = useState('Jazz');
  const [playlist, setPlaylist] = useState({ genre: 'Jazz', songs: LIBRARY.Jazz });
  // TODO 1: replace this constant with: const [isPending, startTransition] = useTransition();
  const isPending = false;

  function choose(genre) {
    // TODO 2: urgent update — highlight the clicked genre right away with setSelected.
    //
    // TODO 3: start an async transition that awaits fetchPlaylist(genre) and then
    //         stores the result with setPlaylist. Updates that run after `await`
    //         are not part of the transition automatically — wrap that one in
    //         startTransition(() => …) again.
  }

  return (
    <section className="card stack">
      <div className="row" role="group" aria-label="Genres">
        {Object.keys(LIBRARY).map((genre) => (
          <button key={genre} aria-pressed={selected === genre} onClick={() => choose(genre)}>
            {genre}
          </button>
        ))}
      </div>
      <p role="status" className="muted">
        {isPending ? 'Loading…' : ''}
      </p>
      <h3>{playlist.genre} playlist</h3>
      <ul className="list" style={{ opacity: isPending ? 0.5 : 1 }}>
        {playlist.songs.map((song) => (
          <li key={song}>{song}</li>
        ))}
      </ul>
    </section>
  );
}
