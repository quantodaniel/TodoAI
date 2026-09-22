import { test, expect } from '@playwright/test';
import { seed, todo, stored, storedRaw, texts, count, expectAnnounced } from './helpers.mjs';

const MIXED = [todo('a', 'Active one'), todo('b', 'Done one', true), todo('c', 'Active two')];

const filter = (page, name) => page.getByRole('button', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await seed(page, MIXED);
  await page.goto('/');
});

test('All shows everything and starts selected', async ({ page }) => {
  expect(await texts(page)).toEqual(['Active one', 'Done one', 'Active two']);
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await expect(filter(page, 'Active')).toHaveAttribute('aria-pressed', 'false');
});

test('Active hides done items', async ({ page }) => {
  await filter(page, 'Active').click();
  expect(await texts(page)).toEqual(['Active one', 'Active two']);
  await expect(filter(page, 'Active')).toHaveAttribute('aria-pressed', 'true');
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'false');
});

test('Done shows only done items', async ({ page }) => {
  await filter(page, 'Done').click();
  expect(await texts(page)).toEqual(['Done one']);
  await expect(filter(page, 'Done')).toHaveAttribute('aria-pressed', 'true');
});

test('the count ignores the active filter', async ({ page }) => {
  await expect(count(page)).toHaveText('2 items left');
  await filter(page, 'Done').click();
  await expect(count(page)).toHaveText('2 items left');
});

test('an empty filter result shows the empty state', async ({ page }) => {
  await seed(page, [todo('a', 'Active only')]);
  await page.goto('/');
  await filter(page, 'Done').click();
  await expect(page.locator('li.empty')).toHaveText('Nothing here yet.');
});

test('the filter resets to All after a reload', async ({ page }) => {
  await filter(page, 'Done').click();
  await page.reload();
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  expect(await texts(page)).toEqual(['Active one', 'Done one', 'Active two']);
});

test.describe('clear done', () => {
  test('removes done items and announces the count', async ({ page }) => {
    await page.getByRole('button', { name: 'Clear done' }).click();

    expect(await texts(page)).toEqual(['Active one', 'Active two']);
    expect((await stored(page)).map(t => t.text)).toEqual(['Active one', 'Active two']);
    await expectAnnounced(page, 'Cleared 1 done item');
  });

  test('pluralises the announcement', async ({ page }) => {
    await seed(page, [todo('a', 'One', true), todo('b', 'Two', true), todo('c', 'Keep')]);
    await page.goto('/');
    await page.getByRole('button', { name: 'Clear done' }).click();
    await expectAnnounced(page, 'Cleared 2 done items');
  });

  test('with nothing done it announces and does not touch storage', async ({ page }) => {
    await seed(page, [todo('a', 'Active only')]);
    await page.goto('/');
    const before = await storedRaw(page);

    await page.getByRole('button', { name: 'Clear done' }).click();

    await expectAnnounced(page, 'No done items to clear');
    expect(await storedRaw(page)).toBe(before);
  });
});
