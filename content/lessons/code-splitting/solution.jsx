// Exercise: download the music app's heavy panels only when the listener opens them.
import { lazy, Suspense, useState } from 'react';

// Pretend each panel lives in its own file, so it can become its own chunk.
function LyricsPanel() {
  return (
    <div className="stack">
      <h3>Lyrics</h3>
      <p className="muted">Here comes the sun, doo-doo-doo-doo…</p>
    </div>
  );
}

function EqualizerPanel() {
  return (
    <div className="stack">
      <h3>Equalizer</h3>
      <p className="muted">Bass +2 · Mid 0 · Treble +1</p>
    </div>
  );
}

// Stand-in for import('./LyricsPanel.jsx'): the first call "downloads" the chunk
// (200 ms), later calls return the same cached promise, like a real bundler.
const chunks = new Map();
function fakeImport(name, component) {
  if (!chunks.has(name)) {
    console.log(`Downloading ${name} chunk`);
    const download = new Promise((resolve) => setTimeout(resolve, 200));
    chunks.set(name, download.then(() => ({ default: component })));
  }
  return chunks.get(name);
}
const loadLyrics = () => fakeImport('lyrics', LyricsPanel);
const loadEqualizer = () => fakeImport('equalizer', EqualizerPanel);

const Lyrics = lazy(loadLyrics);
const Equalizer = lazy(loadEqualizer);

function Loading() {
  return (
    <p className="row muted" role="status">
      <span className="spinner" /> Loading panel…
    </p>
  );
}

export default function App() {
  const [panel, setPanel] = useState('player');

  return (
    <section className="card stack" aria-label="Music app">
      <div className="row">
        <button aria-pressed={panel === 'player'} onClick={() => setPanel('player')}>
          Player
        </button>
        <button aria-pressed={panel === 'lyrics'} onClick={() => setPanel('lyrics')}>
          Lyrics
        </button>
        <button
          aria-pressed={panel === 'equalizer'}
          onClick={() => setPanel('equalizer')}
          onMouseEnter={loadEqualizer}
        >
          Equalizer
        </button>
      </div>

      <Suspense fallback={<Loading />}>
        {panel === 'player' && <p>Now playing: Here Comes the Sun</p>}
        {panel === 'lyrics' && <Lyrics />}
        {panel === 'equalizer' && <Equalizer />}
      </Suspense>
    </section>
  );
}
