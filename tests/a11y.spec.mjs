import { test, expect } from '@playwright/test';
import { seed, todo, texts, checkbox, delButton, editButton, moveDown, focusedLabel } from './helpers.mjs';

const THREE = [todo('a', 'First'), todo('b', 'Second'), todo('c', 'Third')];

test.describe('focus survives the re-render', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, THREE);
    await page.goto('/');
  });

  test('toggling keeps focus on the checkbox', async ({ page }) => {
    await checkbox(page, 'Second').click();
    expect(await focusedLabel(page)).toBe('Mark Second as done');
  });

  test('deleting moves focus to the row that took its place', async ({ page }) => {
    await delButton(page, 'Second').click();
    expect(await texts(page)).toEqual(['First', 'Third']);
    expect(await focusedLabel(page)).toBe('Delete Third');
  });

  test('deleting the last remaining item focuses the add field', async ({ page }) => {
    await seed(page, [todo('a', 'Only one')]);
    await page.goto('/');
    await delButton(page, 'Only one').click();
    expect(await focusedLabel(page)).toBe('todo-input');
  });

  test('moving keeps focus on the pressed arrow', async ({ page }) => {
    await moveDown(page, 'First').click();
    expect(await focusedLabel(page)).toBe('Move First down');
  });

  test('moving to an edge falls back to the sibling arrow', async ({ page }) => {
    // 'Second' moved down becomes last, so its own down arrow is disabled.
    await moveDown(page, 'Second').click();
    expect(await focusedLabel(page)).toBe('Move Second up');
  });

  test('saving an edit returns focus to the text button', async ({ page }) => {
    await editButton(page, 'Second').click();
    await page.locator('input.edit').fill('Renamed');
    await page.keyboard.press('Enter');
    expect(await focusedLabel(page)).toBe('Edit Renamed');
  });

  test('cancelling an edit returns focus to the text button', async ({ page }) => {
    await editButton(page, 'Second').click();
    await page.keyboard.press('Escape');
    expect(await focusedLabel(page)).toBe('Edit Second');
  });
});

test.describe('semantics', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, THREE);
    await page.goto('/');
  });

  test('the list and filter group are labelled', async ({ page }) => {
    await expect(page.getByRole('list', { name: 'Todos' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Filter todos' })).toBeVisible();
  });

  test('the count is a live status region', async ({ page }) => {
    await expect(page.locator('#count')).toHaveAttribute('role', 'status');
  });

  test('every row control is a real, labelled button or checkbox', async ({ page }) => {
    const row = page.locator('li[data-id]').first();
    await expect(row.locator('input.check[type=checkbox]')).toHaveCount(1);
    for (const label of ['Edit First', 'Move First up', 'Move First down', 'Delete First']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveCount(1);
    }
  });

  test('the whole app is reachable by keyboard', async ({ page }) => {
    await page.locator('#todo-input').focus();
    const seen = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      seen.push(await focusedLabel(page));
    }
    expect(seen).toContain('Edit First');
    expect(seen).toContain('Delete First');
  });
});

test('todo text is rendered literally, never as HTML', async ({ page }) => {
  const payload = '<img src=x onerror="window.__XSS=1">';
  await page.goto('/');
  await page.locator('#todo-input').fill(payload);
  await page.locator('#todo-input').press('Enter');

  expect(await texts(page)).toEqual([payload]);
  await expect(page.locator('li[data-id] img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__XSS)).toBeUndefined();
});
