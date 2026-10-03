import { StrictMode } from 'react';
import App from './App';

// The number shown in <p role="timer">, e.g. "1.3 s" → 1.3
const elapsed = () => parseFloat(screen.getByRole('timer').textContent);
const button = (name) => screen.getByRole('button', { name });

// Let real time pass in small slices, so React renders (and re-runs effects) between ticks.
async function pass(ms) {
  for (let t = 0; t < ms; t += 50) await wait(50);
}

test({ en: 'Starts at 0.0 s with a Start button', fa: 'با 0.0 s و یک دکمهٔ Start شروع می‌شود' }, () => {
  render(<App />);
  expect(screen.getByRole('timer')).toHaveTextContent('0.0 s');
  expect(button('Start')).toBeInTheDocument();
});

test({ en: 'Start makes the clock tick every 100 ms', fa: 'دکمهٔ Start ساعت را هر ۱۰۰ میلی‌ثانیه جلو می‌برد' }, async () => {
  render(<App />);
  await user.click(button('Start'));
  expect(button('Pause')).toBeInTheDocument();
  await pass(600);
  // About 6 ticks: allow timer jitter, but not a clock stuck at 0.1 s (stale closure)
  // or a runaway pile of intervals.
  expect(elapsed()).toBeGreaterThanOrEqual(0.2);
  expect(elapsed()).toBeLessThanOrEqual(0.8);
});

test({ en: 'Pause really stops the clock (cleanup clears the interval)', fa: 'دکمهٔ Pause واقعاً ساعت را متوقف می‌کند (cleanup، interval را پاک می‌کند)' }, async () => {
  render(<App />);
  await user.click(button('Start'));
  await pass(350);
  await user.click(button('Pause'));
  const pausedAt = elapsed();
  expect(pausedAt).toBeGreaterThan(0);
  await pass(300);
  expect(elapsed()).toBe(pausedAt);
  expect(button('Start')).toBeInTheDocument();
});

test({ en: 'Reset stops the clock and goes back to 0.0 s', fa: 'دکمهٔ Reset ساعت را متوقف می‌کند و به 0.0 s برمی‌گرداند' }, async () => {
  render(<App />);
  await user.click(button('Start'));
  await pass(250);
  await user.click(button('Reset'));
  expect(screen.getByRole('timer')).toHaveTextContent('0.0 s');
  await pass(250);
  expect(screen.getByRole('timer')).toHaveTextContent('0.0 s');
});

test({ en: 'The tab title always shows the elapsed time', fa: 'عنوان تب مرورگر همیشه زمان سپری‌شده را نشان می‌دهد' }, async () => {
  render(<App />);
  await user.click(button('Start'));
  await pass(350);
  await user.click(button('Pause'));
  expect(elapsed()).toBeGreaterThan(0);
  expect(document.title).toContain(`${elapsed().toFixed(1)} s`);
  await user.click(button('Reset'));
  expect(document.title).toContain('0.0 s');
});

test({ en: 'Still correct inside <StrictMode> (dev runs setup twice)', fa: 'داخل <StrictMode> هم درست است (در حالت توسعه setup دو بار اجرا می‌شود)' }, async () => {
  render(<StrictMode><App /></StrictMode>);
  await user.click(button('Start'));
  await pass(500);
  await user.click(button('Pause'));
  const pausedAt = elapsed();
  expect(pausedAt).toBeGreaterThanOrEqual(0.2);
  expect(pausedAt).toBeLessThanOrEqual(0.7);
  await pass(250);
  expect(elapsed()).toBe(pausedAt);
});
