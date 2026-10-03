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
    <article className="card stack" aria-label="Now playing">
      {/* TODO 1: replace the placeholders with data from `track`: the title in the
          <h2>, and "Miles Davis · Kind of Blue (1959)" in the paragraph below it. */}
      <h2 style={{ margin: 0 }}>Track title</h2>
      <p className="muted">Artist · Album (Year)</p>

      {/* TODO 2: show "played / total" by calling formatTime(), e.g. 1:20 / 5:20 */}
      <p>0:00 / 0:00</p>

      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
        {/* TODO 3: give the bar an inline style object: width `${percent}%`,
            height '100%' and background '#6366f1'. */}
        <div
          role="progressbar"
          aria-label="Played"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* TODO 4: `class` is a reserved word in JavaScript. Give this label the
          built-in "badge" class the JSX way. */}
      <span>Lossless</span>
    </article>
    // TODO 5: also render {upNext} AFTER the card, outside the <article>.
    //         JSX needs a single root, so wrap both in a fragment <>…</>.
  );
}
