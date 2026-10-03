// Lists & keys: a playlist built with map(), sorted from a copy and keyed by stable ids.
import { Fragment, useState } from 'react';

const SONGS = [
  { id: 'so-what', title: 'So What', artist: 'Miles Davis', minutes: 9 },
  { id: 'take-five', title: 'Take Five', artist: 'Dave Brubeck', minutes: 5 },
  { id: 'blue-train', title: 'Blue Train', artist: 'John Coltrane', minutes: 10 },
];
const MORE = [
  { id: 'naima', title: 'Naima', artist: 'John Coltrane', minutes: 4 },
  { id: 'autumn', title: 'Autumn Leaves', artist: 'Cannonball Adderley', minutes: 11 },
];

function SongRow({ song }) {
  // Each row owns a piece of state. React keeps it with the row's key, not with the song.
  const [liked, setLiked] = useState(false);
  return (
    <li className="row">
      <label className="row">
        <input type="checkbox" checked={liked} onChange={(e) => setLiked(e.target.checked)} />
        {song.title}
      </label>
      <span className="muted">{song.minutes} min</span>
    </li>
  );
}

export default function App() {
  const [songs, setSongs] = useState(SONGS);
  const [sortByTitle, setSortByTitle] = useState(false);
  const [useIndexKeys, setUseIndexKeys] = useState(false);

  // sort() reorders an array in place, so sort a copy, never the state array itself.
  const visible = sortByTitle
    ? [...songs].sort((a, b) => a.title.localeCompare(b.title))
    : songs;
  // filter() already returns a new array, so no copy is needed here.
  const shortOnes = songs.filter((song) => song.minutes < 6);
  const nextSong = MORE[songs.length - SONGS.length];

  function addToTop() {
    setSongs([nextSong, ...songs]);
    const keyMode = useIndexKeys ? 'index' : 'id';
    console.log(`Added "${nextSong.title}" at index 0 (keys: ${keyMode})`);
  }

  return (
    <section className="card stack">
      <h2>Playlist</h2>
      <div className="row">
        <button onClick={addToTop} disabled={!nextSong}>Add to top</button>
        <button aria-pressed={sortByTitle} onClick={() => setSortByTitle(!sortByTitle)}>
          Sort A–Z
        </button>
        <label className="row">
          <input
            type="checkbox"
            checked={useIndexKeys}
            onChange={(e) => setUseIndexKeys(e.target.checked)}
          />
          Use index as key (buggy)
        </label>
      </div>
      <ul className="list">
        {visible.map((song, index) => (
          <SongRow key={useIndexKeys ? index : song.id} song={song} />
        ))}
      </ul>
      <h3>Short tracks</h3>
      <dl>
        {shortOnes.map((song) => (
          // Two elements per item and no wrapper element: the key goes on a Fragment.
          <Fragment key={song.id}>
            <dt>{song.title}</dt>
            <dd className="muted">{song.artist}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
