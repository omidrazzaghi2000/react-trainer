import App from './App';

// jsdom has no layout engine: every size and position is 0. These helpers fake the
// measurements the component reads, so we can check where the tooltip ends up.
const box = (top, height, left = 16, width = 160) =>
  ({ top, left, width, height, bottom: top + height, right: left + width, x: left, y: top });

// anchors: { 'Button text': top }, all 30px tall. The tooltip is 40px tall for the short
// "Lo-fi" text and 150px tall for the long "Synthwave" text.
function fakeLayout(anchors) {
  const originalRect = Element.prototype.getBoundingClientRect;
  const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  const isTip = (el) => el.getAttribute('role') === 'tooltip';
  const tipHeight = (el) => (el.textContent.includes('Synthwave') ? 150 : 40);
  Element.prototype.getBoundingClientRect = function () {
    if (isTip(this)) return box(0, tipHeight(this));
    const top = anchors[this.textContent.trim()];
    return top === undefined ? box(0, 0, 0, 0) : box(top, 30);
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return isTip(this) ? tipHeight(this) : 0; },
  });
  return function restore() {
    Element.prototype.getBoundingClientRect = originalRect;
    if (originalHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalHeight);
    else delete HTMLElement.prototype.offsetHeight;
  };
}

const track = (name) => screen.getByRole('button', { name });

test({ en: 'Hovering a track shows its tooltip, leaving hides it', fa: 'هاور روی یک ترک، tooltip آن را نشان می‌دهد و خروج از آن، پنهانش می‌کند' }, async () => {
  render(<App />);
  await user.hover(track('Morning Run'));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Lo-fi · 3:12');
  await user.unhover(track('Morning Run'));
  expect(screen.queryByRole('tooltip')).toBeNull();
});

test({ en: 'The tooltip sits exactly its measured height (+ 8px gap) above the anchor', fa: 'tooltip دقیقاً به اندازهٔ ارتفاع اندازه‌گیری‌شده‌اش (به‌علاوهٔ فاصلهٔ ۸ پیکسلی) بالای anchor قرار می‌گیرد' }, async () => {
  const restore = fakeLayout({ 'Morning Run': 200 });
  try {
    render(<App />);
    await user.hover(track('Morning Run'));
    const tip = screen.getByRole('tooltip');
    // anchor.top 200 − tooltip height 40 − gap 8 = 152
    expect(tip).toHaveAttribute('data-placement', 'top');
    expect(tip).toHaveStyle({ top: '152px' });
  } finally {
    restore();
  }
});

test({ en: 'Near the top edge the tooltip flips below the anchor', fa: 'نزدیک لبهٔ بالایی، tooltip برمی‌گردد و زیر anchor قرار می‌گیرد' }, async () => {
  const restore = fakeLayout({ 'Morning Run': 20 });
  try {
    render(<App />);
    await user.hover(track('Morning Run'));
    const tip = screen.getByRole('tooltip');
    // 20 − 40 − 8 < 0 → no room above → anchor.bottom 50 + gap 8 = 58
    expect(tip).toHaveAttribute('data-placement', 'bottom');
    expect(tip).toHaveStyle({ top: '58px' });
  } finally {
    restore();
  }
});

test({ en: 'New tooltip text is measured again (moving straight to another track)', fa: 'متن جدید tooltip دوباره اندازه‌گیری می‌شود (رفتن مستقیم به ترک دیگر)' }, async () => {
  const restore = fakeLayout({ 'Morning Run': 100, 'Night Drive': 140 });
  try {
    render(<App />);
    await user.hover(track('Morning Run'));
    expect(screen.getByRole('tooltip')).toHaveStyle({ top: '52px' }); // 100 − 40 − 8
    // Same Tooltip instance, longer text: 140 − 150 − 8 < 0 → flip below: 170 + 8
    await user.hover(track('Night Drive'));
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Synthwave');
    expect(tip).toHaveAttribute('data-placement', 'bottom');
    expect(tip).toHaveStyle({ top: '178px' });
  } finally {
    restore();
  }
});
