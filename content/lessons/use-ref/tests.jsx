import App from './App';

const input = () => screen.getByRole('textbox', { name: 'Message' });
const messages = () => within(screen.getByRole('list', { name: 'Messages' }));

async function send(text) {
  await user.type(input(), text);
  await user.click(screen.getByRole('button', { name: 'Send' }));
}

test({ en: 'A sent message shows up after the short undo window', fa: 'پیام ارسال‌شده بعد از مهلت کوتاه Undo در فهرست ظاهر می‌شود' }, async () => {
  render(<App />);
  await send('Lunch at 1?');
  expect(screen.getByRole('status')).toHaveTextContent('Lunch at 1?');
  expect(await messages().findByText('Lunch at 1?')).toBeInTheDocument();
  expect(screen.queryByRole('status')).toBeNull();
});

test({ en: 'After Send, the cursor is back in the message input', fa: 'بعد از Send، مکان‌نما دوباره در ورودی پیام قرار می‌گیرد' }, async () => {
  render(<App />);
  await send('On my way');
  expect(input()).toHaveFocus();
});

test({ en: 'Undo cancels the message and puts the text back', fa: 'دکمهٔ Undo پیام را لغو می‌کند و متن را به ورودی برمی‌گرداند' }, async () => {
  render(<App />);
  await send('Oops, wrong chat');
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(input()).toHaveValue('Oops, wrong chat');
  await wait(400);
  expect(messages().queryByText('Oops, wrong chat')).toBeNull();
});

test({ en: 'Undo still works after other re-renders (the timer id survives)', fa: 'Undo بعد از رندرهای دیگر هم کار می‌کند (شناسهٔ تایمر باقی می‌ماند)' }, async () => {
  render(<App />);
  await send('See you at 8');
  // Typing while the message is pending re-renders the component several times.
  await user.type(input(), 'pm');
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  await wait(400);
  expect(messages().queryByText('See you at 8')).toBeNull();
  expect(input()).toHaveValue('See you at 8');
});
