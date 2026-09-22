# Testing

- Every behaviour change ships with a test in `tests/`. `npm test` must be green before committing.
- Tests drive the real app in a browser. There are no unit seams — `app.js` is a closed IIFE.
- Target elements by role and `aria-label` (`Edit <text>`, `Move <text> up`), not by CSS
  position. A test that breaks when the markup is reshuffled is testing the wrong thing.
- Never assert a todo id — they come from `Date.now()`. Seed `localStorage` via the `seed()`
  helper instead.
- Assert state in both the DOM and `localStorage`. A render that is right but unsaved is a bug.
- When a test fails, assume the app is wrong until proven otherwise. Never loosen an assertion
  to get to green.
