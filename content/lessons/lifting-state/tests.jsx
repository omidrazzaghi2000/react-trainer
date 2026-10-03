import App from './App';

// Each panel is a <section aria-label="…">, so we can query inside one of them.
const playlist = () => within(screen.getByRole('region', { name: 'Playlist' }));
const nowPlaying = () => screen.getByRole('region', { name: 'Now playing' });
const nextButton = () => within(nowPlaying()).getByRole('button', { name: 'Next' });

// Both panels must agree: exactly one highlighted track, and it is the one playing.
function expectPlaying(title) {
  const highlighted = playlist().getAllByRole('button', { pressed: true });
  expect(highlighted).toHaveLength(1);
  expect(highlighted[0]).toHaveTextContent(title);
  expect(nowPlaying()).toHaveTextContent(title);
}

test({ en: 'Both panels start on the first track', fa: 'هر دو پنل با اولین آهنگ شروع می‌کنند' }, () => {
  render(<App />);
  expectPlaying('Blue in Green');
});

test({ en: 'Clicking a track in the playlist plays it in "Now playing"', fa: 'کلیک روی یک آهنگ در پلی‌لیست، آن را در «Now playing» پخش می‌کند' }, async () => {
  render(<App />);
  await user.click(playlist().getByRole('button', { name: 'Naima' }));
  expectPlaying('Naima');
  expect(nowPlaying()).toHaveTextContent('John Coltrane');
  expect(nowPlaying()).not.toHaveTextContent('Blue in Green');
});

test({ en: '"Next" in "Now playing" moves the highlight in the playlist too', fa: 'دکمهٔ «Next» در «Now playing» هایلایت پلی‌لیست را هم جابه‌جا می‌کند' }, async () => {
  render(<App />);
  await user.click(nextButton());
  expectPlaying('Naima');
});

test({ en: 'The panels stay in sync: after the last track, "Next" wraps to the first', fa: 'پنل‌ها هماهنگ می‌مانند: بعد از آخرین آهنگ، «Next» به آهنگ اول برمی‌گردد' }, async () => {
  render(<App />);
  await user.click(playlist().getByRole('button', { name: 'Peace Piece' }));
  expectPlaying('Peace Piece');
  await user.click(nextButton());
  expectPlaying('Blue in Green');
  await user.click(nextButton());
  expectPlaying('Naima');
});
