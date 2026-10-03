import App from './App';

const genre = (name) => screen.getByRole('button', { name });

test({ en: 'Starts with the Jazz playlist', fa: 'با پلی‌لیست Jazz شروع می‌شود' }, () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Jazz playlist' })).toBeInTheDocument();
  expect(screen.getByText('So What')).toBeInTheDocument();
  expect(genre('Jazz')).toHaveAttribute('aria-pressed', 'true');
});

test({ en: 'The clicked genre is highlighted right away (urgent update)', fa: 'ژانر کلیک‌شده بلافاصله انتخاب‌شده نمایش داده می‌شود (به‌روزرسانی فوری)' }, async () => {
  render(<App />);
  await user.click(genre('Rock'));
  // Checked immediately — long before the 250 ms fake request can answer.
  expect(genre('Rock')).toHaveAttribute('aria-pressed', 'true');
  expect(genre('Jazz')).toHaveAttribute('aria-pressed', 'false');
});

test({ en: 'While loading, "Loading…" shows and the old songs stay visible', fa: 'در حین بارگذاری «Loading…» نمایش داده می‌شود و آهنگ‌های قبلی روی صفحه می‌مانند' }, async () => {
  render(<App />);
  await user.click(genre('Rock'));
  expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  expect(screen.getByRole('heading', { name: 'Jazz playlist' })).toBeInTheDocument();
  expect(screen.getByText('So What')).toBeInTheDocument();
});

test({ en: 'The new playlist replaces the old one when it arrives', fa: 'وقتی پلی‌لیست جدید رسید، جای قبلی را می‌گیرد' }, async () => {
  render(<App />);
  await user.click(genre('Lo-fi'));
  expect(await screen.findByRole('heading', { name: 'Lo-fi playlist' })).toBeInTheDocument();
  expect(screen.getByText('Coffee Rain')).toBeInTheDocument();
  expect(screen.queryByText('So What')).toBeNull();
});

test({ en: 'The pending state ends once the playlist is shown', fa: 'حالت pending بعد از نمایش پلی‌لیست تمام می‌شود' }, async () => {
  render(<App />);
  await user.click(genre('Rock'));
  expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  await screen.findByRole('heading', { name: 'Rock playlist' });
  await waitFor(() => expect(screen.getByRole('status')).not.toHaveTextContent('Loading…'));
  expect(genre('Rock')).toHaveAttribute('aria-pressed', 'true');
});
