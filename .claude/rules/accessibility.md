# Accessibility Baseline

- Every control is a real `<button>`, `<input>` or `<a>`. No clickable `<div>`.
- Icon-only buttons need an `aria-label` describing the target ("Delete Buy milk").
- Buttons inside a `<form>` that do not submit must be `type="button"`.
- Everything reachable and operable by keyboard; never remove focus outlines without a replacement.
- Never signal state by color alone — pair it with text or a line-through.
- Live-region announcements name the item they refer to (`Deleted "Buy milk"`, not `Deleted`),
  for the same reason icon buttons do: the message is the user's only context.
