import App, { Greeting, LanguageContext } from './App';

const greeting = () => within(screen.getByRole('banner')).getByRole('heading');
const preview = () => screen.getByRole('region', { name: 'Persian preview' });
const pick = (name) => user.click(screen.getByRole('button', { name }));

test({ en: 'Starts in English in the header and the menu', fa: 'در ابتدا هدر و منو انگلیسی هستند' }, () => {
  render(<App />);
  expect(greeting()).toHaveTextContent('Welcome back!');
  expect(screen.getByRole('button', { name: 'Order coffee' })).toBeInTheDocument();
});

test({ en: 'Choosing فارسی translates deep components without props', fa: 'انتخاب «فارسی» کامپوننت‌های عمیق را بدون props ترجمه می‌کند' }, async () => {
  render(<App />);
  await pick('فارسی');
  expect(greeting()).toHaveTextContent('خوش برگشتید!');
  expect(screen.getByRole('button', { name: 'سفارش قهوه' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Order coffee' })).toBeNull();
});

test({ en: 'English switches everything back', fa: 'دکمهٔ English همه‌چیز را به انگلیسی برمی‌گرداند' }, async () => {
  render(<App />);
  await pick('فارسی');
  expect(greeting()).toHaveTextContent('خوش برگشتید!');
  await pick('English');
  expect(greeting()).toHaveTextContent('Welcome back!');
  expect(screen.getByRole('button', { name: 'Order coffee' })).toBeInTheDocument();
});

test({ en: 'The preview card is always Persian (a nested provider overrides the value)', fa: 'کارت پیش‌نمایش همیشه فارسی است (یک provider تو در تو مقدار را override می‌کند)' }, async () => {
  render(<App />);
  expect(preview()).toHaveTextContent('از سفارش شما سپاسگزاریم');
  expect(preview()).not.toHaveTextContent('Thanks for your order');
  await pick('فارسی');
  await pick('English');
  expect(preview()).toHaveTextContent('از سفارش شما سپاسگزاریم');
  expect(greeting()).toHaveTextContent('Welcome back!');
});

test({ en: 'Greeting reads the nearest provider, or the default "en" without one', fa: 'Greeting مقدار نزدیک‌ترین provider را می‌خواند و بدون provider از پیش‌فرض «en» استفاده می‌کند' }, () => {
  const alone = render(<Greeting />);
  expect(within(alone.container).getByRole('heading')).toHaveTextContent('Welcome back!');
  const wrapped = render(
    <LanguageContext value="fa">
      <Greeting />
    </LanguageContext>,
  );
  expect(within(wrapped.container).getByRole('heading')).toHaveTextContent('خوش برگشتید!');
});
