# JavaScript Conventions

- All code lives inside the IIFE in `app.js` with `'use strict'`. Never create globals.
- State is the `todos` array. Every mutation must call `save()` then `render()` — never one without the other.
- Treat state as immutable: `map`/`filter` to a new array instead of mutating items in place.
- `load()` and `save()` wrap `localStorage` in `try/catch`. Storage failure must never break the app.
- Use event delegation on a container, not per-element listeners. Re-rendering replaces nodes.
- No `console.log` in committed code.
- Early-return on invalid input instead of nesting.
