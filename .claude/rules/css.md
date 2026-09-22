# CSS Conventions

- Colors only from CSS custom properties in `:root`. No hardcoded hex outside that block.
- Plain class selectors. No IDs for styling, no `!important`, nesting max 2 levels.
- Layout with flexbox. No absolute positioning unless there is no alternative.
- State lives in a class on the element (`.done`, `.active`), never in inline styles from JS.
- Keep interactive targets at least 40px tall and always keep a visible `:focus` outline.
