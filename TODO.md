# Refinement log

Record of the refinement pass over the plain HTML/CSS/JS todo app. Every
change respects the rules in `.claude/rules/`: no dependencies, all JS inside
the IIFE with `save()` then `render()` on each mutation, no user input in
`innerHTML`, colours only from `:root` tokens, real `<button>`/`<input>`
controls with labels, 40px targets and visible focus.

## Audit of the starting point

Rule violations and weaknesses found before changing anything:

- css.md 40px targets: `.del` measured 27px, filter buttons 39.5px, the
  checkbox the browser default (~13px).
- accessibility.md "never state by colour alone": the selected filter was
  conveyed only by `.active` accent colouring; no `aria-pressed`.
- accessibility.md labels: the add input had a placeholder but no label.
- Keyboard operability: `render()` wiped the list, so focus fell to `<body>`
  after every toggle or delete.
- `#count` was not a live region; screen readers never heard it change.
- Filter buttons lacked `type="button"` (not inside a form, so not a strict
  breach, but inconsistent with the other non-submit buttons).
- Buttons and the checkbox relied on browser-default focus rings; only
  `.field:focus` was styled.
- `--muted: #86868b` on white was about 3.5:1, below AA for the 0.9rem count
  and struck-through items.
- No dark mode.
- `load()` already validated shape and dropped duplicate ids (commit
  `158b197`) but did not trim stored text the way the add path does.
- `.filters` had no group semantics.
- javascript.md and dom-safety.md: no violations found.

## Changes, grouped by refinement

### Baseline fixes (commit `73374ee`)

- Wrapped the checkbox in a 40px `<label class="toggle">` so the hit area
  grows without scaling the box; `accent-color` ties it to the accent token.
- Delete and filter buttons sized to at least 40px; one shared
  `:focus-visible` outline (2px accent, 2px offset) for every control.
- `--muted` darkened to `#6e6e73` and `--border` to `#d2d2d7` for contrast.
- Added the `.sr-only` helper (the one place absolute positioning is used,
  because there is no other way to hide visually while keeping the text
  available to assistive tech).

### 3. Accessible status (commit `a7ff110`)

- `#count` is `role="status"` (polite, atomic) and `render()` only rewrites
  its text when the value changes, so nothing is announced needlessly.
- Filter buttons carry `aria-pressed`, `type="button"`, live in a
  `role="group"` named "Filter todos", and the selected one is filled with
  the accent rather than only recoloured, so the state survives grayscale.
- The add input has a visually hidden `<label>`; the list is named "Todos".

### 6. Render efficiency and focus (commit `08c22c5`)

- Before each mutation the handler records `{ id, controls, index }` via
  `focusAfterRender()`; after `render()` rebuilds the list, `restoreFocus()`
  moves focus to that control on the same item, or to the item now at the
  same visible index, or to the add field when the list is empty.
- The record is only taken when focus is already inside the list, so a
  mouse click elsewhere (or a blur-save) never has focus pulled back.
- The list is built in a `DocumentFragment` and appended once.
- A visually hidden `role="status"` announcer speaks changes that have no
  other audible feedback: deletions, moves and clears. It clears then sets
  the text after 50ms so a repeated message is spoken again.
- Handlers look the todo up in state (`byId`) before acting and bail out if
  it is missing.

### 1. Inline edit (commit `ea4a6ed`)

- The todo text is rendered as a real `<button class="text">` named
  "Edit <text>" (the visible text stays inside the accessible name). Click,
  double-click, Enter or Space open the editor; touch users get it too.
- While editing, the button is replaced by `<input class="edit">` labelled
  "Edit <text>", focused with the caret at the end.
- Enter saves, Escape cancels, `focusout` saves. Empty text after trim
  deletes the todo and announces it; unchanged text just closes the field
  without a `save()`. A second commit for the same edit (Enter followed by
  the blur it causes) is a no-op because `editingId` is cleared first.
- `flushEdit()` commits a still-open edit before a filter click, clear or
  add runs, covering browsers that do not move focus to clicked buttons.
- Focus returns to the item's text button unless the user moved it away.

### 4. Reordering (commit `148783e`)

- Every item has "Move <text> up" / "Move <text> down" buttons (real
  buttons, arrow glyphs, `aria-label`), disabled at the edges of the
  visible list. No drag and drop.
- `move()` swaps the todo with its nearest visible neighbour, so under a
  filter hidden items keep their place; done immutably with
  `filter`/`slice`/`concat`.
- Focus stays on the pressed button; when it becomes disabled at an edge it
  falls to the sibling move button, then to the text. The new position is
  announced ("Moved "X" up to 1 of 3").

### 5. Data hardening (commit `c85d40e`)

- `load()` already rejected non-arrays, malformed items (id must be a
  non-empty string, text a non-blank string, done a boolean), duplicate ids
  and unknown fields, and swallowed parse/storage errors. Verified in the
  browser with a mixed array, non-JSON text, an object, `null` and a bare
  string: each yields the sanitised list or an empty list, never a throw,
  and the next mutation rewrites the key with a clean array.
- Added the missing piece: surviving text is trimmed on load, matching the
  add path.

### 2. Dark mode (commit `b730dab`)

- `@media (prefers-color-scheme: dark)` redefines only the `:root` tokens
  and sets `color-scheme: dark` so native controls follow. The dark accent
  is lighter, so `--on-accent` flips to a dark colour to keep contrast on
  filled buttons. Checked that no hex value exists outside the two `:root`
  blocks.

### 7. Visual polish (commit `3e42652`)

- 150ms `border-color`/`background-color`/`color` transitions on buttons and
  fields, removed under `prefers-reduced-motion`.
- Hover background on icon buttons (not when disabled), hover border on the
  add field, `tabular-nums` on the count so it does not jitter, tighter
  heading tracking. Spacing kept on the existing 4/8/16/24/48px rhythm.

## Verification

Exercised in Chrome at http://localhost:4173 before each commit: add
(including padded text), edit save/cancel/blur/empty, toggle under each
filter, delete (middle, last, and down to an empty list), move up/down at
edges and under the Active filter, each filter, clear done (with and
without done items), reload persistence, five kinds of corrupted storage,
dark-mode emulation, and a hover/focus pass. Note: the browser pane's
synthetic Space/Enter do not trigger native button activation, so keyboard
activation was driven with `.focus()` + `.click()` (what a real key press
produces) while the app's own Enter/Escape handlers were tested with real
key events.

## Follow-ups deliberately left out

- While an edit is open, clicking a control on another row commits the edit
  but the click itself can be swallowed, because `render()` replaces every
  node between `mousedown` and `mouseup`. A keyed render that reuses
  unchanged `<li>` nodes would fix this; left out to keep `render()` simple.
- Drag-and-drop reordering as an addition to the buttons.
- A keyboard shortcut for moving items (e.g. Alt+Arrow); skipped to avoid
  clashing with text-editing shortcuts in the edit field.
- Persisting the selected filter across reloads.
- A manual light/dark toggle; only the system preference is honoured.
- "Clear done" stays enabled when nothing is done (it announces "No done
  items to clear"); disabling it would drop focus for keyboard users.
- No maximum length on todo text.
