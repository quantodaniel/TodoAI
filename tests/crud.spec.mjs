import { test, expect } from '@playwright/test';
import { seed, todo, stored, texts, add, checkbox, delButton, count, expectAnnounced } from './helpers.mjs';

test.describe('add', () => {
  test('appends a todo and persists it', async ({ page }) => {
    await page.goto('/');
    await add(page, 'Buy milk');
    await add(page, 'Write docs');

    expect(await texts(page)).toEqual(['Buy milk', 'Write docs']);
    expect((await stored(page)).map(t => t.text)).toEqual(['Buy milk', 'Write docs']);
    await expect(count(page)).toHaveText('2 items left');
  });

  test('trims surrounding whitespace before storing', async ({ page }) => {
    await page.goto('/');
    await add(page, '   Padded task   ');

    expect(await texts(page)).toEqual(['Padded task']);
    expect((await stored(page))[0].text).toBe('Padded task');
  });

  test('ignores a whitespace-only submission', async ({ page }) => {
    await page.goto('/');
    await add(page, '    ');

    expect(await texts(page)).toEqual([]);
    await expect(page.locator('li.empty')).toHaveText('Nothing here yet.');
  });

  test('clears the input after adding', async ({ page }) => {
    await page.goto('/');
    await add(page, 'Buy milk');
    await expect(page.locator('#todo-input')).toHaveValue('');
  });
});

test.describe('toggle', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, [todo('a', 'Buy milk'), todo('b', 'Write docs')]);
    await page.goto('/');
  });

  test('marks an item done and updates the count', async ({ page }) => {
    await checkbox(page, 'Buy milk').click();

    await expect(page.locator('li[data-id]').first()).toHaveClass(/done/);
    await expect(count(page)).toHaveText('1 item left');
    expect((await stored(page))[0].done).toBe(true);
  });

  test('keeps the "Mark … as done" label even once done', async ({ page }) => {
    await checkbox(page, 'Buy milk').click();
    // The label is deliberately static; assert the literal rather than a toggled variant.
    await expect(checkbox(page, 'Buy milk')).toBeChecked();
  });

  test('singular wording at exactly one item left', async ({ page }) => {
    await checkbox(page, 'Buy milk').click();
    await expect(count(page)).toHaveText('1 item left');
    await checkbox(page, 'Write docs').click();
    await expect(count(page)).toHaveText('0 items left');
  });

  test('toggles back to active', async ({ page }) => {
    await checkbox(page, 'Buy milk').click();
    await checkbox(page, 'Buy milk').click();
    await expect(page.locator('li[data-id]').first()).not.toHaveClass(/done/);
    expect((await stored(page))[0].done).toBe(false);
  });
});

test.describe('delete', () => {
  test('removes the item and announces it', async ({ page }) => {
    await seed(page, [todo('a', 'Buy milk'), todo('b', 'Write docs')]);
    await page.goto('/');

    await delButton(page, 'Buy milk').click();

    expect(await texts(page)).toEqual(['Write docs']);
    expect((await stored(page)).map(t => t.text)).toEqual(['Write docs']);
    await expectAnnounced(page, 'Deleted “Buy milk”');
  });

  test('deleting the last item shows the empty state', async ({ page }) => {
    await seed(page, [todo('a', 'Only one')]);
    await page.goto('/');

    await delButton(page, 'Only one').click();

    await expect(page.locator('li.empty')).toHaveText('Nothing here yet.');
    expect(await stored(page)).toEqual([]);
    await expect(count(page)).toHaveText('0 items left');
  });
});
