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

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup |
| `styles.css` | Styles |
| `app.js` | State, persistence and rendering |
