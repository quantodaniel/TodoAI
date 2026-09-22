# TodoAI

A zero-dependency todo app: plain HTML, CSS and vanilla JavaScript, persisted in `localStorage`.

## Run

Open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
```

## Features

- Add, toggle and delete todos
- Filter by All / Active / Done
- Clear completed
- State survives reloads via `localStorage` (key: `todoai.todos`)

## Rules

Agent-facing coding rules live in [.claude/rules/](.claude/rules/) and are indexed from [CLAUDE.md](CLAUDE.md):
no-dependencies, javascript, dom-safety, css, accessibility, git.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup |
| `styles.css` | Styles |
| `app.js` | State, persistence and rendering |
| `CLAUDE.md` | Rule index for agents |
| `.claude/rules/` | Individual rule files |
