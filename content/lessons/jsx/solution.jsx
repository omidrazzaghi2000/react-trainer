// Exercise: turn the track data into JSX — expressions, className, style and a fragment.
const track = {
  title: 'Blue in Green',
  artist: 'Miles Davis',
  album: 'Kind of Blue',
  year: 1959,
  lengthSec: 320,
  playedSec: 80,
};

// Finished helper: formatTime(80) → "1:20"
function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = String(sec % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const percent = (track.playedSec / track.lengthSec) * 100;
const upNext = <p className="muted">Up next: So What</p>;

export default function App() {
  return (
    <>
      <article className="card stack" aria-label="Now playing">
        <h2 style={{ margin: 0 }}>{track.title}</h2>
        <p className="muted">
          {track.artist} · {track.album} ({track.year})
        </p>

        <p>
          {formatTime(track.playedSec)} / {formatTime(track.lengthSec)}
        </p>

        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
          <div
            role="progressbar"
            aria-label="Played"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${percent}%`, height: '100%', background: '#6366f1' }}
          />
        </div>

        <span className="badge">Lossless</span>
      </article>
      {upNext}
    </>
  );
}
