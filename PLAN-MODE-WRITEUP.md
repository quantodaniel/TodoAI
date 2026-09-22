# Agent-First Problem Solving: Plan Mode Write-up

**Agent:** Claude Code (Opus 5), Plan Mode
**Problem:** TodoAI had no automated tests
**Outcome:** 62 Playwright tests, green, committed in `b81eadd`
**Date:** 2026-09-22

## The problem, and why it was real

`CLAUDE.md` said it outright: *"No test runner. Verify in the browser before committing."*

Every verification up to this point had been ad-hoc browser poking — and it had already
produced a wrong claim. During the refinement pass, a subagent reported two console errors as
"pre-existing, they predate this session." They were actually a `favicon.ico` 404, found later
by a different tool. Nobody was lying; there was simply no repeatable check.

Meanwhile the app had grown behaviour that manual clicking will not reliably cover: inline edit
with four exit paths (Enter, blur, Escape, empty-deletes), reordering that swaps with the
nearest *visible* neighbour under a filter, focus restoration across a full re-render, a 50ms
debounced live region, and `load()` validation against malformed storage.

## The agent's plan

Plan mode ran in four phases.

**Phase 1 — Exploration.** An Explore subagent inventoried the repo and read `app.js` in full,
returning every user-facing behaviour with its exact selectors, `aria-label` formats and
localStorage shape. It also flagged testability hazards I had not considered:

- ids are `Date.now()`-based, so they must be seeded, never asserted
- the announcer's 50ms `setTimeout` makes every announcement assertion async
- focus restoration is gated on `list.contains(document.activeElement)`, so JS-dispatched
  clicks skip it entirely — tests must use real input
- duplicate todo text produces duplicate `aria-label`s and trips Playwright strict mode

**Phase 2 — A blocking contradiction.** The agent found that `.claude/rules/no-dependencies.md`
says *"No npm packages. Ever."* with no scope qualifier — while `.mcp.json`, committed earlier
in the same repo, already runs two npm packages via `npx`.

This is the one point where the agent stopped and asked. It could have inferred a
shipped-app-only reading and quietly added `package.json`; the rule was written by the repo
owner to shape agent behaviour, so exploiting its ambiguity was the wrong move. The owner chose
to **amend the rule first**, then use the real tool.

**Phase 3 — The plan**, presented for approval: amend the rule in its own commit *before* any
`package.json` exists (so the repo is never in a state that violates its own rules), then
`@playwright/test`, six spec files split by concern, and a mutation check to prove the suite
bites.

**Phase 4 — Execution**, after approval.

## Execution

| Step | Result |
| --- | --- |
| Amend `no-dependencies.md` to scope the ban to the shipped app | `b3044e4` |
| `package.json` + `playwright.config.mjs` + chromium | clean install |
| 6 spec files, 62 tests | green in ~3s |
| Mutation check | see below |
| `CLAUDE.md`, `README.md`, new `.claude/rules/testing.md` | `b81eadd` |

The suite starts its own static server (`python3 -m http.server 4173`) so `npm test` is the
only command needed.

## Does the suite actually bite?

A green suite proves nothing on its own. Three deliberate mutants:

| Mutant | Result |
| --- | --- |
| Remove `.trim()` from the add handler | **Caught** — 2 tests failed |
| Remove the `done`-is-boolean check in `isTodo` | **Caught** — 1 test failed |
| Remove the `Array.isArray(parsed)` guard in `load()` | **Survived** |

The third is the interesting one. It is not a coverage gap — it is an *equivalent mutant*.
Calling `.filter` on a non-array throws, and the surrounding `try/catch` already returns `[]`,
so removing the guard changes nothing observable:

```
{"a":1}         -> TypeError (caught -> [])
null            -> TypeError (caught -> [])
"just a string" -> TypeError (caught -> [])
```

The guard is belt-and-braces and documents intent. Worth knowing, and worth not "fixing".

## What worked well

- **Exploration before planning paid for itself.** The subagent's inventory of `aria-label`
  formats and non-ASCII literals (`×` U+00D7, `↑` U+2191, curly quotes in announcements) meant
  the specs were written against the real app, not an imagined one. Almost everything passed
  first try.
- **Catching the rule contradiction before writing code.** Discovering it at `package.json`
  time would have meant either a silent violation or a rewrite.
- **Sequencing the rule amendment first.** The repo never had a commit where `package.json`
  contradicted its own rules.
- **Pre-identified hazards became test design.** Knowing about the focus gate meant focus tests
  used real clicks from the start; knowing about the 50ms announcer meant `toHaveText`'s
  auto-retry rather than a synchronous read.
- **The plan's "investigate before loosening" rule held.** When a test failed, it got a root
  cause, not a weaker assertion.

## What required manual intervention

1. **The dependency ruling — the only true blocker.** Genuinely the owner's call, not the
   agent's. Resolved with one question.
2. **Plan approval**, by design.
3. **Two harness bugs the agent had to debug itself**, both in `seed()`, both real:
   - `addInitScript` re-runs on *every* navigation, so a reload re-applied the fixture and
     resurrected a deleted item. First fix: only seed when the key is absent.
   - That broke 6 other tests, which re-seed a different fixture mid-test — now skipped.
     Final fix: a monotonic token in `sessionStorage`, so the newest seed wins and reloads
     re-apply nothing.

   Worth stating plainly: the agent wrote the bug, and the failing tests caught it. Both
   failures were the harness, not the app — but neither was diagnosable without running them.
4. **Server log noise** drowning the reporter, fixed with `stdout: 'ignore'`.

Notably, **zero app bugs were found.** The refinement pass held up under 62 tests. That is a
real result, though a modest one: it says the app matches its documented behaviour, not that
the behaviour is right.

## Honest limits

- **Chromium only.** Focus-on-click is Chromium-specific, and focus restoration is a core
  assertion. Firefox and WebKit would need those tests conditionalised.
- **No visual assertions.** Dark mode, spacing and hover states are untested — `CLAUDE.md` now
  says so explicitly and keeps a manual pass for them.
- **No real assistive technology.** The suite asserts roles, labels and live-region contents.
  It does not prove a screen reader announces them usefully.
- **One known behaviour is asserted, not fixed:** clicking a control on another row while an
  edit is open is swallowed. It is recorded in `TODO.md` as a deliberate follow-up.

## Verdict on agent-first

The division of labour was clean. The agent did the work that is tedious and error-prone for a
human — reading 380 lines of `app.js` and extracting every selector and literal — and made
reasonable calls throughout. It correctly refused to make the one decision that was not its
to make.

The single highest-value moment in the whole exercise was the agent *stopping*: noticing that
its task conflicted with a rule the repo owner had written, and asking instead of resolving the
ambiguity in its own favour.
