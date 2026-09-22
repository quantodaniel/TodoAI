import { test, expect } from '@playwright/test';
import { seedRaw, seed, todo, stored, storedRaw, texts, add, delButton } from './helpers.mjs';

// load() must never trust localStorage: anything malformed is discarded, not rendered.
const CORRUPT = [
  ['non-JSON text', 'not json at all'],
  ['the literal null', 'null'],
  ['an object instead of an array', '{"a":1}'],
  ['an array of primitives', '[1,2,3]'],
  ['an empty string', ''],
  ['a JSON string', '"just a string"']
];

for (const [label, value] of CORRUPT) {
  test(`recovers from ${label}`, async ({ page }) => {
    await seedRaw(page, value);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');

    await expect(page.locator('li.empty')).toHaveText('Nothing here yet.');
    expect(errors).toEqual([]);

    // Still fully usable afterwards.
    await add(page, 'Recovered');
    expect(await texts(page)).toEqual(['Recovered']);
  });
}

test('drops malformed items but keeps valid ones', async ({ page }) => {
  await seedRaw(page, JSON.stringify([
    { id: 'ok', text: 'Valid', done: false },
    { id: '', text: 'Empty id', done: false },
    { id: 'x', text: '   ', done: false },
    { id: 'y', text: 'Bad done flag', done: 'yes' },
    { id: 'z', done: false },
    'not an object',
    null
  ]));
  await page.goto('/');

  expect(await texts(page)).toEqual(['Valid']);
});

test('keeps the first of two items sharing an id', async ({ page }) => {
  await seedRaw(page, JSON.stringify([
    { id: 'dup', text: 'First wins', done: false },
    { id: 'dup', text: 'Second dropped', done: false }
  ]));
  await page.goto('/');

  expect(await texts(page)).toEqual(['First wins']);
});

test('drops unknown fields and trims text on load', async ({ page }) => {
  await seedRaw(page, JSON.stringify([{ id: 'a', text: '  Padded  ', done: false, foo: 'bar' }]));
  await page.goto('/');

  expect(await texts(page)).toEqual(['Padded']);
  // Nothing is rewritten until the next mutation, so mutate and then inspect.
  await add(page, 'Trigger save');
  expect(await stored(page)).toEqual([
    { id: 'a', text: 'Padded', done: false },
    { id: expect.any(String), text: 'Trigger save', done: false }
  ]);
});

test('does not rewrite corrupt storage until something changes', async ({ page }) => {
  await seedRaw(page, 'not json at all');
  await page.goto('/');

  expect(await storedRaw(page)).toBe('not json at all');

  await add(page, 'Now it saves');
  expect((await stored(page)).map(t => t.text)).toEqual(['Now it saves']);
});

test('survives a reload', async ({ page }) => {
  await page.goto('/');
  await add(page, 'Persisted');
  await page.reload();

  expect(await texts(page)).toEqual(['Persisted']);
});

test('state written by one mutation is visible after reload', async ({ page }) => {
  await seed(page, [todo('a', 'Keep'), todo('b', 'Remove')]);
  await page.goto('/');
  await delButton(page, 'Remove').click();
  await page.reload();

  expect(await texts(page)).toEqual(['Keep']);
});
