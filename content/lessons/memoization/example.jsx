// Memoization: skip needless work with memo, useMemo and useCallback.
import { memo, useCallback, useMemo, useState } from 'react';

const TRACKS = [
  { id: 1, title: 'Blue in Green', plays: 812 },
  { id: 2, title: 'So What', plays: 1940 },
  { id: 3, title: 'Naima', plays: 655 },
  { id: 4, title: 'Take Five', plays: 2310 },
  { id: 5, title: 'Round Midnight', plays: 1204 },
];

// Imagine 50,000 tracks: we log every time this really runs.
function topTracks(tracks, minPlays) {
  console.log('filtering + sorting tracks');
  return tracks.filter((t) => t.plays >= minPlays).sort((a, b) => b.plays - a.plays);
}

// memo: skip this component while every prop is the same (compared with Object.is).
const TrackRow = memo(function TrackRow({ track, isLiked, onLike }) {
  console.log('render row:', track.title);
  return (
    <li className="row">
      <span>{track.title}</span>
      <span className="muted">{track.plays} plays</span>
      <button aria-pressed={isLiked} onClick={() => onLike(track.id)}>
        {isLiked ? 'Liked ✓' : 'Like'}
      </button>
    </li>
  );
});

export default function App() {
  const [minPlays, setMinPlays] = useState(0);
  const [liked, setLiked] = useState([]);
  const [dark, setDark] = useState(false);

  // useMemo: redo the expensive work only when minPlays changes.
  const visible = useMemo(() => topTracks(TRACKS, minPlays), [minPlays]);

  // useCallback: the same function on every render, so memo(TrackRow) can bail out.
  // The updater form means we never read `liked` here — so no dependencies at all.
  const handleLike = useCallback((id) => {
    setLiked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }, []);

  const theme = dark ? { background: '#0f172a', color: '#e2e8f0' } : undefined;
  return (
    <section className="card stack" style={theme}>
      <h2>Top tracks</h2>
      <div className="row">
        <button aria-pressed={dark} onClick={() => setDark((d) => !d)}>Dark mode</button>
        <button onClick={() => setMinPlays((m) => (m === 0 ? 1000 : 0))}>
          {minPlays === 0 ? 'Only hits' : 'Show all'}
        </button>
        <span className="badge">{liked.length} liked</span>
      </div>
      <ul className="list">
        {visible.map((t) => (
          <TrackRow key={t.id} track={t} isLiked={liked.includes(t.id)} onLike={handleLike} />
        ))}
      </ul>
    </section>
  );
}
