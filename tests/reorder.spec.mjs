import { test, expect } from '@playwright/test';
import { seed, todo, stored, texts, moveUp, moveDown, expectAnnounced } from './helpers.mjs';

const THREE = [todo('a', 'First'), todo('b', 'Second'), todo('c', 'Third')];

test.describe('unfiltered', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, THREE);
    await page.goto('/');
  });

  test('moves an item up', async ({ page }) => {
    await moveUp(page, 'Second').click();
    expect(await texts(page)).toEqual(['Second', 'First', 'Third']);
    expect((await stored(page)).map(t => t.text)).toEqual(['Second', 'First', 'Third']);
  });

  test('moves an item down', async ({ page }) => {
    await moveDown(page, 'Second').click();
    expect(await texts(page)).toEqual(['First', 'Third', 'Second']);
  });

  test('disables the arrows at the edges', async ({ page }) => {
    await expect(moveUp(page, 'First')).toBeDisabled();
    await expect(moveDown(page, 'First')).toBeEnabled();
    await expect(moveUp(page, 'Third')).toBeEnabled();
    await expect(moveDown(page, 'Third')).toBeDisabled();
  });

  test('a single item has both arrows disabled', async ({ page }) => {
    await seed(page, [todo('a', 'Lonely')]);
    await page.goto('/');
    await expect(moveUp(page, 'Lonely')).toBeDisabled();
    await expect(moveDown(page, 'Lonely')).toBeDisabled();
  });

  test('announces the new position, 1-based, out of the visible total', async ({ page }) => {
    await moveDown(page, 'First').click();
    await expectAnnounced(page, 'Moved “First” down to 2 of 3');
  });
});

test.describe('under a filter', () => {
  // 'Hidden' is done, so it disappears under the Active filter. Moving across it must
  // swap with the nearest VISIBLE neighbour, not the adjacent array element.
  test.beforeEach(async ({ page }) => {
    await seed(page, [todo('a', 'Visible A'), todo('h', 'Hidden', true), todo('b', 'Visible B')]);
    await page.goto('/');
    await page.getByRole('button', { name: 'Active' }).click();
  });

  test('moving down swaps with the next visible item', async ({ page }) => {
    expect(await texts(page)).toEqual(['Visible A', 'Visible B']);
    await moveDown(page, 'Visible A').click();
    expect(await texts(page)).toEqual(['Visible B', 'Visible A']);
  });

  test('moving up swaps with the previous visible item', async ({ page }) => {
    await moveUp(page, 'Visible B').click();
    expect(await texts(page)).toEqual(['Visible B', 'Visible A']);
    // Locks the exact array semantics: the hidden item keeps its relative place.
    expect((await stored(page)).map(t => t.text)).toEqual(['Visible B', 'Visible A', 'Hidden']);
  });

  test('arrows are disabled at the visible edges, ignoring hidden items', async ({ page }) => {
    await expect(moveUp(page, 'Visible A')).toBeDisabled();
    await expect(moveDown(page, 'Visible B')).toBeDisabled();
  });

  test('announcement counts only visible items', async ({ page }) => {
    await moveDown(page, 'Visible A').click();
    await expectAnnounced(page, 'Moved “Visible A” down to 2 of 2');
  });
});
