import App from './App';

// Every simulated chunk download prints "Downloading <name> chunk" with console.log.
const downloads = () => logs().filter((line) => line.startsWith('Downloading'));

test({ en: 'Starts on the Player without downloading any panel code', fa: 'برنامه با Player شروع می‌شود و هیچ کد پنلی دانلود نمی‌شود' }, () => {
  render(<App />);
  expect(screen.getByText('Now playing: Here Comes the Sun')).toBeInTheDocument();
  expect(downloads()).toEqual([]);
});

test({ en: 'Opening Lyrics downloads its chunk and shows "Loading panel…" below the buttons', fa: 'باز کردن Lyrics چانک آن را دانلود می‌کند و زیر دکمه‌ها «Loading panel…» نشان می‌دهد' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Lyrics' }));
  expect(downloads()).toEqual(['Downloading lyrics chunk']);
  expect(screen.getByRole('status')).toHaveTextContent(/loading panel/i);
  // The boundary wraps only the panel, so the buttons are still there while it loads.
  expect(screen.getByRole('button', { name: 'Player' })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Lyrics' })).toBeInTheDocument();
  expect(screen.queryByRole('status')).toBeNull();
});

test({ en: 'Hovering Equalizer starts its download before the click', fa: 'بردن نشانگر روی Equalizer دانلودش را پیش از کلیک شروع می‌کند' }, async () => {
  render(<App />);
  const button = screen.getByRole('button', { name: 'Equalizer' });
  await user.hover(button);
  expect(downloads()).toEqual(['Downloading equalizer chunk']);
  await wait(250);
  await user.click(button);
  // The chunk was ready before the click, so the panel shows without a loading state.
  expect(screen.getByRole('heading', { name: 'Equalizer' })).toBeInTheDocument();
  expect(screen.queryByRole('status')).toBeNull();
  expect(downloads()).toHaveLength(1);
});

test({ en: 'A panel that was already downloaded opens again without a new download', fa: 'پنلی که قبلاً دانلود شده، بدون دانلود دوباره باز می‌شود' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Lyrics' }));
  expect(await screen.findByRole('heading', { name: 'Lyrics' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Player' }));
  await user.click(screen.getByRole('button', { name: 'Lyrics' }));
  expect(screen.getByRole('heading', { name: 'Lyrics' })).toBeInTheDocument();
  expect(downloads()).toEqual([]);
});
