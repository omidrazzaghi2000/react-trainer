import App, { useToggle, useLocalStorage } from './App';

// Tiny probe components let us test each hook on its own, the way any component would use it.
function ToggleProbe() {
  const [on, toggle] = useToggle(true);
  return <button onClick={toggle}>{on ? 'On' : 'Off'}</button>;
}

function StorageProbe({ storageKey }) {
  const [value, setValue] = useLocalStorage(storageKey, 'nothing yet');
  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={() => setValue('saved!')}>Save</button>
    </div>
  );
}

test({ en: 'The settings panel renders', fa: 'پنل تنظیمات رندر می‌شود' }, () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Reader settings' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('Welcome, reader!')).toBeInTheDocument();
});

test({ en: 'useToggle starts at the initial value and flips on every call', fa: 'useToggle با مقدار اولیه شروع می‌شود و با هر فراخوانی برعکس می‌شود' }, async () => {
  render(<ToggleProbe />);
  const button = screen.getByRole('button', { name: 'On' });
  await user.click(button);
  expect(button).toHaveTextContent('Off');
  await user.click(button);
  expect(button).toHaveTextContent('On');
});

test({ en: 'Each useToggle call keeps its own state', fa: 'هر فراخوانی useToggle state مخصوص خودش را دارد' }, async () => {
  render(
    <div>
      <ToggleProbe />
      <ToggleProbe />
    </div>
  );
  const [first, second] = screen.getAllByRole('button');
  await user.click(first);
  expect(first).toHaveTextContent('Off');
  expect(second).toHaveTextContent('On');
});

test({ en: 'useLocalStorage starts from the saved JSON value, or the initial one', fa: 'useLocalStorage با مقدار JSON ذخیره‌شده، یا در نبودش با مقدار اولیه، شروع می‌شود' }, () => {
  localStorage.clear();
  localStorage.setItem('probe-saved', JSON.stringify('from storage'));
  render(
    <div>
      <StorageProbe storageKey="probe-saved" />
      <StorageProbe storageKey="probe-empty" />
    </div>
  );
  expect(screen.getByText('Value: from storage')).toBeInTheDocument();
  expect(screen.getByText('Value: nothing yet')).toBeInTheDocument();
});

test({ en: 'useLocalStorage saves every change as JSON', fa: 'useLocalStorage هر تغییر را به شکل JSON ذخیره می‌کند' }, async () => {
  localStorage.clear();
  render(<StorageProbe storageKey="probe-write" />);
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Value: saved!')).toBeInTheDocument();
  expect(localStorage.getItem('probe-write')).toBe(JSON.stringify('saved!'));
});

test({ en: 'Dark mode and the name survive a reload', fa: 'حالت تاریک و نام بعد از بارگذاری دوباره باقی می‌مانند' }, async () => {
  localStorage.clear();
  const first = render(<App />);
  await user.click(screen.getByRole('button', { name: 'Dark mode' }));
  await user.type(screen.getByLabelText('Your name'), 'Sara');
  first.unmount();

  render(<App />);
  expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Your name')).toHaveValue('Sara');
  expect(screen.getByText('Welcome back, Sara!')).toBeInTheDocument();
});
