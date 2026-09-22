# TodoAI

A zero-dependency todo app: plain HTML, CSS and vanilla JavaScript, persisted in `localStorage`.

## Run

Open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
```

## Features

- Add, toggle and delete todos
- Edit a todo inline: click (or double-click) its text, or press Enter or
  Space on it when focused. Enter saves, Escape cancels, leaving the field
  saves; saving empty text deletes the todo
- Reorder with the per-item Move up / Move down buttons (keyboard
  operable, no drag and drop); under a filter an item swaps with its
  nearest visible neighbour and hidden items keep their place
- Filter by All / Active / Done
- Clear completed
- Follows the system light/dark preference (`prefers-color-scheme`); the
  dark theme only redefines the `:root` colour tokens
- Hover and toggle changes use a short 150ms transition, disabled under
  `prefers-reduced-motion`
- Screen reader friendly: every control is labelled, the remaining count
  is a polite live region, the filter buttons expose their selected
  state with `aria-pressed`, and deleting, moving or clearing items is
  announced
- Keyboard focus survives re-renders: toggling keeps focus on the same
  checkbox, saving or cancelling an edit returns it to the item's text,
  moving keeps it on the move button (or its sibling once it is disabled
  at an edge), deleting moves it to the item that takes the deleted one's place (or to
  the add field when the list empties)
- State survives reloads via `localStorage` (key: `todoai.todos`)
- Stored data is validated on load: anything that is not an array of
  `{ id: string, text: string, done: boolean }` is discarded (duplicate ids,
  blank text and unknown fields too) and surviving text is trimmed, so a
  corrupted or foreign value never breaks the app

## Rules

Agent-facing coding rules live in [.claude/rules/](.claude/rules/) and are indexed from [CLAUDE.md](CLAUDE.md):
no-dependencies, javascript, dom-safety, css, accessibility, git.

## MCP servers

Two MCP servers are configured in [.mcp.json](.mcp.json) and were tested against this app —
see [MCP-COMPARISON.md](MCP-COMPARISON.md) for the write-up, and
[tools/mcp-probe.mjs](tools/mcp-probe.mjs) for the stdio client used to drive them.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup |
| `styles.css` | Styles |
| `app.js` | State, persistence and rendering |
| `CLAUDE.md` | Rule index for agents |
| `.claude/rules/` | Individual rule files |
| `.mcp.json` | MCP server config (Playwright, Chrome DevTools) |
| `MCP-COMPARISON.md` | MCP server evaluation |
| `tools/mcp-probe.mjs` | Minimal MCP stdio client |
