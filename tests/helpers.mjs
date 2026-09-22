import { expect } from '@playwright/test';

export const KEY = 'todoai.todos';

const seedTokens = new WeakMap();

/**
 * Seed localStorage before the app boots, so ids are deterministic.
 *
 * addInitScript runs on EVERY navigation, including reloads, and calls accumulate. Each seed
 * therefore carries an increasing token and only writes when it is newer than the last one
 * applied: the most recent seed wins, and a reload re-applies nothing — otherwise a reload
 * would resurrect state the test had just changed.
 */
export async function seed(page, todos) {
  const token = (seedTokens.get(page) ?? 0) + 1;
  seedTokens.set(page, token);

  await page.addInitScript(
    ([key, value, tok]) => {
      const mark = '__todoai_seed';
      if (Number(window.sessionStorage.getItem(mark) ?? 0) < tok) {
        window.sessionStorage.setItem(mark, String(tok));
        window.localStorage.setItem(key, value);
      }
    },
    [KEY, typeof todos === 'string' ? todos : JSON.stringify(todos), token]
  );
}

/** Seed a raw (possibly malformed) string into the storage key. */
export const seedRaw = seed;

export function todo(id, text, done = false) {
  return { id, text, done };
}

/** The parsed contents of localStorage. */
export function stored(page) {
  return page.evaluate(key => JSON.parse(window.localStorage.getItem(key) ?? 'null'), KEY);
}

/** The raw string in localStorage, for byte-identical comparisons. */
export function storedRaw(page) {
  return page.evaluate(key => window.localStorage.getItem(key), KEY);
}

/** Visible todo texts, in order. */
export function texts(page) {
  return page.locator('li[data-id] .text').allTextContents();
}

export const item = (page, text) => page.locator(`li[data-id]:has(.text:text-is("${text}"))`);
export const editButton = (page, text) => page.getByRole('button', { name: `Edit ${text}`, exact: true });
export const checkbox = (page, text) => page.getByRole('checkbox', { name: `Mark ${text} as done`, exact: true });
export const delButton = (page, text) => page.getByRole('button', { name: `Delete ${text}`, exact: true });
export const moveUp = (page, text) => page.getByRole('button', { name: `Move ${text} up`, exact: true });
export const moveDown = (page, text) => page.getByRole('button', { name: `Move ${text} down`, exact: true });

export const announcer = page => page.locator('#announcer');
export const count = page => page.locator('#count');

/** Add a todo through the real form. */
export async function add(page, text) {
  await page.locator('#todo-input').fill(text);
  await page.locator('#todo-input').press('Enter');
}

/** The aria-label of the currently focused element. */
export function focusedLabel(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return el ? (el.getAttribute('aria-label') ?? el.id ?? el.tagName) : null;
  });
}

export async function expectAnnounced(page, message) {
  await expect(announcer(page)).toHaveText(message);
}
