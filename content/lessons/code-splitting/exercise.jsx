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

// TODO 1: these are "static imports": both panels ship in the main bundle.
//         Turn them into lazy components here, at module level:
//         const Lyrics = lazy(loadLyrics);  const Equalizer = lazy(loadEqualizer);
const Lyrics = LyricsPanel;
const Equalizer = EqualizerPanel;

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
        {/* TODO 3: preload the equalizer chunk when the pointer enters this button
                    (onMouseEnter), so it is ready before the click. */}
        <button aria-pressed={panel === 'equalizer'} onClick={() => setPanel('equalizer')}>
          Equalizer
        </button>
      </div>

      {/* TODO 2: wrap only the panel area (not the buttons) in
                  <Suspense fallback={<Loading />}> so a loading message shows. */}
      {panel === 'player' && <p>Now playing: Here Comes the Sun</p>}
      {panel === 'lyrics' && <Lyrics />}
      {panel === 'equalizer' && <Equalizer />}
    </section>
  );
}
