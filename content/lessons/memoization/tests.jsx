import App from './App';

// The app logs "render <title>" for every SongRow render and "calculating total" for every
// total calculation, so logs() lets us count work without peeking at React internals.
const rowRenders = () => logs().filter((line) => line.startsWith('render ')).length;
const totalRuns = () => logs().filter((line) => line === 'calculating total').length;

test({ en: 'Shows every song and the total length', fa: 'همهٔ آهنگ‌ها و مدت کل را نشان می‌دهد' }, () => {
  render(<App />);
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
  expect(screen.getByText('Total: 23 min')).toBeInTheDocument();
  expect(screen.getByText('Volume: 5')).toBeInTheDocument();
});

test({ en: 'Removing two songs in a row works (no stale callback)', fa: 'حذف پشت‌سرهم دو آهنگ درست کار می‌کند (بدون callback کهنه)' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Remove Africa' }));
  await user.click(screen.getByRole('button', { name: 'Remove Jolene' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.queryByText('Africa')).toBeNull();
  expect(screen.queryByText('Jolene')).toBeNull();
  expect(screen.getByText('Total: 15 min')).toBeInTheDocument();
});

test({ en: 'Changing the volume re-renders none of the song rows', fa: 'تغییر صدا هیچ‌کدام از ردیف‌های آهنگ را دوباره رندر نمی‌کند' }, async () => {
  render(<App />);
  const before = rowRenders();
  expect(before).toBeGreaterThan(0); // keep the console.log in SongRow
  await user.click(screen.getByRole('button', { name: 'Volume up' }));
  await user.click(screen.getByRole('button', { name: 'Volume up' }));
  expect(screen.getByText('Volume: 7')).toBeInTheDocument();
  expect(rowRenders()).toBe(before);
});

test({ en: 'Changing the volume does not recalculate the total', fa: 'تغییر صدا مدت کل را دوباره محاسبه نمی‌کند' }, async () => {
  render(<App />);
  const before = totalRuns();
  expect(before).toBeGreaterThan(0); // keep the console.log in totalMinutes
  await user.click(screen.getByRole('button', { name: 'Volume down' }));
  expect(screen.getByText('Volume: 4')).toBeInTheDocument();
  expect(totalRuns()).toBe(before);
});

test({ en: 'Removing a song re-renders none of the remaining rows', fa: 'حذف یک آهنگ هیچ‌کدام از ردیف‌های باقی‌مانده را دوباره رندر نمی‌کند' }, async () => {
  render(<App />);
  const before = rowRenders();
  await user.click(screen.getByRole('button', { name: 'Remove Hey Jude' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.getByText('Total: 16 min')).toBeInTheDocument();
  expect(rowRenders()).toBe(before);
});
