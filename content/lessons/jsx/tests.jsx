import App from './App';

const card = () => screen.getByRole('article', { name: 'Now playing' });

test({ en: 'Shows the title and "artist · album (year)" from the data', fa: 'عنوان و «artist · album (year)» از روی داده نمایش داده می‌شوند' }, () => {
  render(<App />);
  expect(within(card()).getByRole('heading', { level: 2, name: 'Blue in Green' })).toBeInTheDocument();
  expect(within(card()).getByText('Miles Davis · Kind of Blue (1959)')).toBeInTheDocument();
});

test({ en: 'Shows the time as "1:20 / 5:20" using formatTime()', fa: 'زمان با formatTime() به شکل «1:20 / 5:20» نمایش داده می‌شود' }, () => {
  render(<App />);
  expect(within(card()).getByText('1:20 / 5:20')).toBeInTheDocument();
});

test({ en: 'The progress bar gets an inline width of 25%', fa: 'نوار پیشرفت یک style درون‌خطی با عرض 25% می‌گیرد' }, () => {
  render(<App />);
  expect(screen.getByRole('progressbar', { name: 'Played' })).toHaveStyle({ width: '25%' });
});

test({ en: 'The "Lossless" label has the badge class', fa: 'برچسب «Lossless» کلاس badge را دارد' }, () => {
  render(<App />);
  expect(screen.getByText('Lossless')).toHaveClass('badge');
});

test({ en: '"Up next" is rendered after the card, outside it', fa: '«Up next» بعد از کارت و بیرون از آن رندر می‌شود' }, () => {
  render(<App />);
  const upNext = screen.getByText('Up next: So What');
  expect(card()).not.toContainElement(upNext);
});
