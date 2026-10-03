import App, { Card, List } from './App';

const DRINKS = [
  { id: 1, name: 'Mocha' },
  { id: 2, name: 'Latte' },
];

test({ en: 'Card renders header, children and footer, in that order', fa: 'Card به ترتیب header، children و footer را رندر می‌کند' }, () => {
  const { container } = render(
    <Card header={<h2>Specials</h2>} footer={<em>Open until 6 pm</em>}>
      <p>Flat white</p>
    </Card>
  );
  expect(screen.getByRole('heading', { name: 'Specials' })).toBeInTheDocument();
  expect(screen.getByText('Flat white')).toBeInTheDocument();
  expect(screen.getByText('Open until 6 pm')).toBeInTheDocument();
  const text = container.textContent;
  expect(text.indexOf('Specials')).toBeLessThan(text.indexOf('Flat white'));
  expect(text.indexOf('Flat white')).toBeLessThan(text.indexOf('Open until 6 pm'));
});

test({ en: 'List draws every item with renderItem', fa: 'List هر آیتم را با renderItem رسم می‌کند' }, () => {
  render(<List items={DRINKS} renderItem={(drink) => <button>Order {drink.name}</button>} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Order Mocha' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Order Latte' })).toBeInTheDocument();
});

test({ en: 'List shows the empty message when there are no items', fa: 'List وقتی آیتمی نیست، پیام خالی بودن را نشان می‌دهد' }, () => {
  render(<List items={[]} renderItem={(drink) => drink.name} empty="No drinks yet." />);
  expect(screen.getByText('No drinks yet.')).toBeInTheDocument();
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});

test({ en: 'The shop shows both cards with their slots filled', fa: 'فروشگاه هر دو کارت را با اسلات‌های پرشده نشان می‌دهد' }, () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Coffee beans' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Kenya AA' })).toBeInTheDocument();
  expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  expect(screen.getByText('Total: $0')).toBeInTheDocument();
});

test({ en: 'Adding beans fills the cart and updates the footer', fa: 'افزودن قهوه سبد را پر می‌کند و footer را به‌روز می‌کند' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Add Ethiopia Guji' }));
  await user.click(screen.getByRole('button', { name: 'Add Ethiopia Guji' }));
  await user.click(screen.getByRole('button', { name: 'Add Kenya AA' }));
  expect(screen.getByText('2 × Ethiopia Guji')).toBeInTheDocument();
  expect(screen.getByText('1 × Kenya AA')).toBeInTheDocument();
  expect(screen.getByText('Total: $44')).toBeInTheDocument();
  expect(screen.queryByText('Your cart is empty.')).toBeNull();
});
