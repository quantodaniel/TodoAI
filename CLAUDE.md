# TodoAI

Zero-dependency todo app: plain HTML + CSS + vanilla JS, state in `localStorage`.

## Rules

Read and follow these before writing code. They are short on purpose.

- [.claude/rules/no-dependencies.md](.claude/rules/no-dependencies.md) — stack constraints
- [.claude/rules/javascript.md](.claude/rules/javascript.md) — JS conventions
- [.claude/rules/dom-safety.md](.claude/rules/dom-safety.md) — XSS and DOM handling
- [.claude/rules/css.md](.claude/rules/css.md) — styling conventions
- [.claude/rules/accessibility.md](.claude/rules/accessibility.md) — a11y baseline
- [.claude/rules/testing.md](.claude/rules/testing.md) — test conventions
- [.claude/rules/git.md](.claude/rules/git.md) — commit workflow

## Verify

Run the regression suite before committing:

```bash
npm test
```

62 Playwright tests cover add/toggle/delete, inline edit, reordering under filters, storage
validation, focus restoration and XSS. Specs live in `tests/`; see `.claude/rules/testing.md`.

The suite is the gate. A quick manual pass in the browser is still worth it for anything
visual (dark mode, spacing, hover states) which the tests do not assert.
