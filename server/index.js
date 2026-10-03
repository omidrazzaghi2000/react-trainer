'use strict';

const { createApp } = require('./app');
const { loadLibrary } = require('./content');
const { reactBundle } = require('./bundle');

// All learner code runs in the browser's sandboxed iframe, never on this
// server, so exposing it is safe; it still defaults to localhost.
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 3001;

const library = loadLibrary();
for (const { id, errors, warnings } of library.problems) {
  for (const e of errors) console.warn(`[content] ${id}: ${e}`);
  for (const w of warnings) console.warn(`[content] ${id}: ${w}`);
}

const app = createApp({ library });
const { version } = reactBundle(); // build the React bundle up front (~100 ms)

app.listen(PORT, HOST, () => {
  console.log(`\n  React Trainer  →  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n`);
  console.log(`  ${library.lessons.length} lessons loaded · React ${version} (runs in the browser sandbox)`);
});
