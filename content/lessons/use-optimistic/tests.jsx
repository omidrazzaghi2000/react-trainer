import App from './App';

// The fake server answers after 300 ms, so anything checked right after a click
// is what the user sees *before* the server has replied.
const list = () => screen.getByRole('list', { name: 'Comments' });
const items = () => within(list()).queryAllByRole('listitem');
const item = (text) => within(list()).getByText(text, { exact: false }).closest('li');

async function post(text) {
  await user.type(screen.getByRole('textbox', { name: 'Comment' }), text);
  await user.click(screen.getByRole('button', { name: 'Post' }));
}

test({ en: 'Shows the two existing comments and the comment box', fa: 'دو نظر موجود و جعبهٔ نوشتن نظر نمایش داده می‌شوند' }, () => {
  render(<App />);
  expect(items()).toHaveLength(2);
  expect(screen.getByRole('textbox', { name: 'Comment' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
});

test({ en: 'A new comment appears immediately, marked "Sending…"', fa: 'نظر جدید بلافاصله با برچسب «Sending…» ظاهر می‌شود' }, async () => {
  render(<App />);
  await post('Great with rice');
  // No waiting here: the server has not answered yet.
  expect(item('Great with rice')).toHaveTextContent(/sending/i);
  expect(items()).toHaveLength(3);
  await waitFor(() => expect(item('Great with rice')).not.toHaveTextContent(/sending/i));
});

test({ en: 'Once the server confirms it, the comment stays and loses "Sending…"', fa: 'بعد از تأیید سرور، نظر می‌ماند و برچسب «Sending…» حذف می‌شود' }, async () => {
  render(<App />);
  await post('Great with rice');
  await waitFor(() => expect(item('Great with rice')).not.toHaveTextContent(/sending/i));
  await wait(50);
  expect(items()).toHaveLength(3);
});

test({ en: 'A rejected comment rolls back: it disappears and an error is shown', fa: 'نظر ردشده برمی‌گردد: ناپدید می‌شود و پیام خطا نمایش داده می‌شود' }, async () => {
  render(<App />);
  await post('This will fail');
  expect(item('This will fail')).toHaveTextContent(/sending/i);
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(/could not post/i);
  const gone = () => within(list()).queryByText('This will fail', { exact: false });
  await waitFor(() => expect(gone()).toBeNull());
  expect(items()).toHaveLength(2);
});

test({ en: 'Two comments sent back to back are both pending, then both saved', fa: 'دو نظر پشت‌سرهم هر دو در انتظار نمایش داده می‌شوند و سپس هر دو ذخیره می‌شوند' }, async () => {
  render(<App />);
  await post('First!');
  await post('Second!');
  expect(item('First!')).toHaveTextContent(/sending/i);
  expect(item('Second!')).toHaveTextContent(/sending/i);
  await waitFor(() => {
    expect(item('First!')).not.toHaveTextContent(/sending/i);
    expect(item('Second!')).not.toHaveTextContent(/sending/i);
  });
  expect(items()).toHaveLength(4);
});
