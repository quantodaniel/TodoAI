# DOM Safety

- Never write user input into `innerHTML`. Use `textContent` or `createElement`.
- `innerHTML` is allowed only to clear a container (`el.innerHTML = ''`).
- Trim input before storing; reject empty strings.
- Identify list items with `data-id`, then look the item up in state. Never trust DOM text as state.
- Read the id from `e.target.closest('li[data-id]')` and bail out when there is no match.
