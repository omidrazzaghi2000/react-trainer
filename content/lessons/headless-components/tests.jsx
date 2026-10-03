import App, { useChoice } from './App';

const group = (name) => within(screen.getByRole('group', { name }));

// A brand-new UI, written only for this test, on top of the same headless hook.
function ColorPicker() {
  const colors = ['Red', 'Blue'];
  const { selectedIndex, getGroupProps, getItemProps } = useChoice({
    items: colors,
    initialIndex: 0,
  });
  return (
    <div {...getGroupProps({ 'aria-label': 'Color', className: 'row' })}>
      {colors.map((color, index) => (
        <button key={color} {...getItemProps({ index, title: `Pick ${color}` })}>
          {color}
        </button>
      ))}
      <output>{selectedIndex}</output>
    </div>
  );
}

test({ en: 'Both pickers render as labelled groups of buttons', fa: 'هر دو انتخاب‌گر به شکل گروه‌های برچسب‌دار از دکمه‌ها رندر می‌شوند' }, () => {
  render(<App />);
  expect(group('Size').getAllByRole('button')).toHaveLength(3);
  expect(group('Milk').getAllByRole('button')).toHaveLength(3);
});

test({ en: 'Items announce their selection with aria-pressed', fa: 'آیتم‌ها انتخاب‌شدنشان را با aria-pressed اعلام می‌کنند' }, async () => {
  render(<App />);
  const milk = group('Milk');
  expect(milk.getByRole('button', { name: 'Oat' })).toHaveAttribute('aria-pressed', 'false');
  await user.click(milk.getByRole('button', { name: 'Oat' }));
  expect(milk.getByRole('button', { name: 'Oat' })).toHaveAttribute('aria-pressed', 'true');
  expect(milk.getByRole('button', { name: 'Soy' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('Milk: Oat')).toBeInTheDocument();
});

test({ en: "The size picker's own onClick still runs, and the size is selected", fa: 'onClick خودِ انتخاب‌گر اندازه هنوز اجرا می‌شود و اندازه هم انتخاب می‌شود' }, async () => {
  render(<App />);
  const size = group('Size');
  await user.click(size.getByRole('button', { name: 'Large' }));
  expect(logs()).toContain('analytics: size Large');
  expect(size.getByRole('button', { name: 'Large' })).toHaveAttribute('aria-pressed', 'true');
  expect(size.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('Size: Large')).toBeInTheDocument();
});

test({ en: 'The exported hook drives a brand-new UI and passes extra props through', fa: 'هوک export‌شده یک UI کاملاً جدید را هم می‌گرداند و propsهای اضافه را عبور می‌دهد' }, async () => {
  render(<ColorPicker />);
  const red = screen.getByRole('button', { name: 'Red' });
  expect(red).toHaveAttribute('aria-pressed', 'true');
  expect(red).toHaveAttribute('title', 'Pick Red');
  expect(screen.getByRole('group', { name: 'Color' })).toHaveClass('row');
  await user.click(screen.getByRole('button', { name: 'Blue' }));
  expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true');
  expect(red).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('status')).toHaveTextContent('1');
});

test({ en: 'A custom reducer changes the rules: clicking the chosen milk again clears it', fa: 'یک reducer سفارشی قواعد را عوض می‌کند: کلیک دوباره روی شیر انتخاب‌شده آن را پاک می‌کند' }, async () => {
  render(<App />);
  const milk = group('Milk');
  await user.click(milk.getByRole('button', { name: 'Oat' }));
  expect(screen.getByText('Milk: Oat')).toBeInTheDocument();
  await user.click(milk.getByRole('button', { name: 'Oat' }));
  expect(screen.getByText('Milk: none')).toBeInTheDocument();
  expect(milk.getByRole('button', { name: 'Oat' })).toHaveAttribute('aria-pressed', 'false');
});
