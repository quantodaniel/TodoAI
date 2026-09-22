# Ground truth — round 2, subtle violations (written BEFORE seeing any output)

Round 1 saturated: a modest prompt found all 16 blatant defects. Round 2 plants violations
that require actually knowing the rules and the codebase. 10 planted defects.

| # | Rule file | Violation | Why it is subtle |
| --- | --- | --- | --- |
| 1 | javascript | `render()` called BEFORE `save()` | The rule says "call `save()` then `render()`". Both are present, so a shallow read passes it. |
| 2 | accessibility | `aria-label="Archive"` does not name its target | Rule: icon-only buttons need a label "describing the target" — every other button uses `Archive <text>`. An aria-label IS present, so a checklist tick passes. |
| 3 | accessibility / dom-safety | `announce('Archived')` does not name the item | Every other announcement names the todo (`Deleted "<text>"`). Inconsistency, not an absent feature. |
| 4 | css | `#todo-list .icon.archive` styles via an ID selector | Rule: "No IDs for styling." Looks like ordinary scoping. |
| 5 | css | `height: 38px` — under the 40px minimum | Just 2px under. Requires knowing the exact threshold. |
| 6 | css | CSS nesting 3 levels deep (`.list > .item > .icon:hover`) | Rule: "nesting max 2 levels". Requires counting. |
| 7 | css | New `--archive` token added to light `:root` only, not the dark block | Breaks dark mode silently. A violation of OMISSION — invisible to a line-by-line read of added lines. |
| 8 | testing | Test asserts DOM only, never `localStorage` | Rule: "Assert state in both the DOM and `localStorage`." A test exists, so "has tests" passes. |
| 9 | testing | Test selects by `li[data-id="a"]` — targeting an id | Rule: "Never assert a todo id" / target by role and aria-label. |
| 10 | javascript | `archived: true` is silently dropped by `load()` on reload | Requires cross-referencing the patch against `isTodo`/`load()` in existing `app.js`, which rebuilds items as `{id, text, done}` only. The feature is simply broken on refresh. |

Bonus (not counted, but a strong reviewer should note): nothing ever filters archived items out
of `visible()`, so `archived` has no effect at all — the accompanying test would fail.

Scoring: hits out of 10, false positives counted separately.
