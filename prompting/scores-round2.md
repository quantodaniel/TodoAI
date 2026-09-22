# Round 2 scores (subtle patch, 10 planted)

| Prompt | Hits /10 | Missed | Unplanted bugs found |
| --- | --- | --- | --- |
| v2 role+rules | 9 | #3 announce('Archived') does not name the item | iconButton() args swapped -> class becomes `Archive`, so the CSS rule AND the test locator never match (verified true; a real bug in the fixture, not planted); visible() never filters archived so the feature is inert; README not updated |
| v4 full stack | 9 | #3 (same miss) | Same iconButton root cause, traced further: class `Archive` also makes `e.target.matches('.archive')` never fire, so the click handler never runs; visible() never filters archived; plus qualifications v2 lacked (38px would be clamped by `.icon`'s min-height; an unredefined custom property silently keeps its light value) |

## The miss was mine, not theirs

Both prompts missed planted defect #3 (`announce('Archived')` does not name the item).
`grep -rin "announce" .claude/rules/` returns nothing: **no rule covers announcement wording.**
It is a convention violation, not a rule violation. v4 was explicitly instructed to "remove
anything you cannot tie to a specific rule bullet", so it was told not to report it.

Scored against rule-covered defects only, both prompts got 9/9.

## Cost

| Prompt | Tokens | Wall clock | Tool calls |
| --- | --- | --- | --- |
| v2 | 84k | 124s | 13 |
| v4 | 125k | 453s | 19 |

v4 costs ~1.5x the tokens and ~3.6x the wall clock for the same recall, buying root-cause
depth, calibrated severity, per-finding fixes, and an explicit clean-coverage table.
