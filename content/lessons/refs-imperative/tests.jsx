import App, { SearchField } from './App';

const field = () => screen.getByLabelText('Search songs');

test({ en: 'Typing updates the search hint', fa: 'تایپ کردن، متن راهنمای جست‌وجو را به‌روز می‌کند' }, async () => {
  render(<App />);
  expect(screen.getByText('Type to search')).toBeInTheDocument();
  await user.type(field(), 'jazz');
  expect(screen.getByText('Searching for "jazz"')).toBeInTheDocument();
});

test({ en: 'SearchField exposes focus() and clear() through its ref — not the <input> node', fa: 'SearchField از طریق ref فقط focus() و clear() را در اختیار می‌گذارد، نه خودِ گرهٔ <input> را' }, () => {
  const ref = { current: null };
  render(<SearchField ref={ref} label="Find" />);
  expect(ref.current).not.toBeNull();
  expect(typeof ref.current.focus).toBe('function');
  expect(typeof ref.current.clear).toBe('function');
  // A custom handle object, not a DOM element.
  expect(ref.current.tagName).toBeUndefined();
});

test({ en: '"Focus search" puts the cursor in the field', fa: 'دکمهٔ «Focus search» مکان‌نما را داخل فیلد می‌برد' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Focus search' }));
  expect(field()).toHaveFocus();
});

test({ en: '"Clear" empties the field and resets the hint', fa: 'دکمهٔ «Clear» فیلد را خالی و متن راهنما را ریست می‌کند' }, async () => {
  render(<App />);
  await user.type(field(), 'lofi beats');
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(field()).toHaveValue('');
  expect(screen.getByText('Type to search')).toBeInTheDocument();
});

test({ en: '"Clear" puts the cursor back in the field', fa: 'دکمهٔ «Clear» مکان‌نما را دوباره داخل فیلد می‌گذارد' }, async () => {
  render(<App />);
  await user.type(field(), 'rock');
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(field()).toHaveFocus();
});
