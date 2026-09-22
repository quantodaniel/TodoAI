import { test, expect } from '@playwright/test';
import { seed, todo, stored, storedRaw, texts, editButton, expectAnnounced } from './helpers.mjs';

const FIXTURE = [todo('a', 'Buy milk'), todo('b', 'Write docs')];

test.beforeEach(async ({ page }) => {
  await seed(page, FIXTURE);
  await page.goto('/');
});

test('clicking the text opens an edit field with the caret at the end', async ({ page }) => {
  await editButton(page, 'Buy milk').click();

  const edit = page.locator('input.edit');
  await expect(edit).toHaveValue('Buy milk');
  await expect(edit).toBeFocused();
  expect(await edit.evaluate(el => el.selectionStart)).toBe('Buy milk'.length);
});

test('Enter on the focused text button opens the editor', async ({ page }) => {
  await editButton(page, 'Buy milk').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('input.edit')).toBeFocused();
});

test('Enter saves the new text', async ({ page }) => {
  await editButton(page, 'Buy milk').click();
  await page.locator('input.edit').fill('Buy oat milk');
  await page.keyboard.press('Enter');

  expect(await texts(page)).toEqual(['Buy oat milk', 'Write docs']);
  expect((await stored(page)).map(t => t.text)).toEqual(['Buy oat milk', 'Write docs']);
  await expect(page.locator('input.edit')).toHaveCount(0);
});

test('saving preserves id and done state', async ({ page }) => {
  await seed(page, [todo('a', 'Buy milk', true)]);
  await page.goto('/');

  await editButton(page, 'Buy milk').click();
  await page.locator('input.edit').fill('Buy oat milk');
  await page.keyboard.press('Enter');

  expect(await stored(page)).toEqual([{ id: 'a', text: 'Buy oat milk', done: true }]);
});

test('clicking away saves the edit', async ({ page }) => {
  await editButton(page, 'Buy milk').click();
  await page.locator('input.edit').fill('Saved on blur');
  await page.locator('#todo-input').click();

  expect(await texts(page)).toEqual(['Saved on blur', 'Write docs']);
});

test('Escape cancels and leaves storage byte-identical', async ({ page }) => {
  const before = await storedRaw(page);

  await editButton(page, 'Buy milk').click();
  await page.locator('input.edit').fill('THIS MUST NOT STICK');
  await page.keyboard.press('Escape');

  expect(await texts(page)).toEqual(['Buy milk', 'Write docs']);
  expect(await storedRaw(page)).toBe(before);
});

test('saving unchanged text does not write to storage', async ({ page }) => {
  const before = await storedRaw(page);

  await editButton(page, 'Buy milk').click();
  await page.keyboard.press('Enter');

  expect(await storedRaw(page)).toBe(before);
  expect(await texts(page)).toEqual(['Buy milk', 'Write docs']);
});

test('clearing the text deletes the todo and announces it', async ({ page }) => {
  await editButton(page, 'Buy milk').click();
  await page.locator('input.edit').fill('   ');
  await page.keyboard.press('Enter');

  expect(await texts(page)).toEqual(['Write docs']);
  await expectAnnounced(page, 'Deleted “Buy milk”');
});

test('edit text is trimmed before saving', async ({ page }) => {
  await editButton(page, 'Buy milk').click();
  await page.locator('input.edit').fill('   Trimmed   ');
  await page.keyboard.press('Enter');

  expect((await stored(page))[0].text).toBe('Trimmed');
});

test('only one row is editable at a time', async ({ page }) => {
  await editButton(page, 'Buy milk').click();
  await expect(page.locator('input.edit')).toHaveCount(1);
});
