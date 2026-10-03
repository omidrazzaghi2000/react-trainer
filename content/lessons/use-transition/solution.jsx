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
  const [isPending, startTransition] = useTransition();

  function choose(genre) {
    // Urgent: the button reacts to the click immediately.
    setSelected(genre);

    // Non-urgent: isPending stays true until this async function finishes.
    startTransition(async () => {
      const data = await fetchPlaylist(genre);
      startTransition(() => {
        setPlaylist(data);
      });
    });
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
