# Ground truth — planted violations (written BEFORE seeing any reviewer output)

16 planted defects. A reviewer scores a hit only if it names the specific defect.

| # | Rule file | Violation | Offending line |
| --- | --- | --- | --- |
| 1 | no-dependencies | CDN script tag | `<script src="https://cdn.jsdelivr.net/...lodash...">` |
| 2 | accessibility | Button inside a form without `type="button"` (submits) | `<button class="primary" onclick="clearAll()">` |
| 3 | javascript | Inline `onclick` attribute / global `clearAll` | `onclick="clearAll()"` |
| 4 | javascript | Globals — `priorityCount` and functions outside the IIFE | `var priorityCount = 0;` |
| 5 | dom-safety | `innerHTML` with user input | `li.innerHTML += '<span...>' + todo.text` |
| 6 | accessibility | Clickable `<div>` instead of a real button | `var star = document.createElement('div')` + `star.onclick` |
| 7 | javascript | Per-element listener instead of event delegation | `star.onclick = function () {...}` |
| 8 | accessibility | Icon-only button with no `aria-label` | `pin.textContent = '📌'` with no label |
| 9 | javascript | `console.log` in committed code | `console.log('toggling priority for', id)` |
| 10 | javascript | In-place mutation instead of immutable map | `found.priority = !found.priority` |
| 11 | javascript | Mutation calls `render()` but never `save()` | `render();` at end of `togglePriority` |
| 12 | dom-safety | `closest()` result used with no null check | `var id = li.dataset.id;` |
| 13 | css | Hardcoded hex instead of `:root` tokens | `color: #ffcc00; background: #fff;` |
| 14 | css / accessibility | `outline: none` with no replacement | `.star-btn:focus { outline: none; }` |
| 15 | css | Interactive target below 40px | `height: 24px; width: 24px;` |
| 16 | css | `!important` | `font-weight: 700 !important;` |

Scoring: hits out of 16; false positives counted separately (a "finding" not in this table
and not defensible against a real rule bullet).
