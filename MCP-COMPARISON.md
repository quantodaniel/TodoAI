# MCP Server Comparison: Playwright MCP vs Chrome DevTools MCP

Tested 2026-09-22 against this repo's own app (TodoAI) served at `http://localhost:4173`.

| | Playwright MCP | Chrome DevTools MCP |
| --- | --- | --- |
| Package | `@playwright/mcp@latest` | `chrome-devtools-mcp@latest` |
| Version tested | 1.64.0-alpha | 1.9.0 |
| Tools exposed | 25 | 29 |
| Browser | Own managed browser, clean profile | Chrome via DevTools Protocol |
| Headline strength | Deterministic interaction | Measurement and diagnostics |

Install (both are stdio servers, no API key):

```bash
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest
claude mcp add chrome-devtools -s project -- npx -y chrome-devtools-mcp@latest
```

Both are committed in [.mcp.json](.mcp.json). Project-scope servers need one interactive
approval (`claude` → approve) before a session will load them.

## The scenario

Both servers were pointed at the same practical task from this repo: **regression-test the
TodoAI refinement work** (inline edit, keyboard reorder, ARIA live regions, localStorage
persistence) and **audit the result**. This is real work — the app had just been through a
refinement pass whose keyboard and accessibility claims had not been independently verified.

## Playwright MCP

### What it does well

**Real input events.** The decisive result. An earlier verification pass on this same app,
using a different browser tool, could not trigger native `Enter`/`Space` activation and had to
fall back to `.focus()` + `.click()`. Playwright MCP drives the real flows:

```
browser_type  { target: "#todo-input", text: "Ship MCP comparison", submit: true }
→ await page.locator('#todo-input').fill('Ship MCP comparison');
  await page.locator('#todo-input').press('Enter');
```

The full inline-edit cycle, including Escape-cancel, verified in one run:

```
browser_click     { target: 'button[aria-label="Edit Ship MCP comparison"]' }
browser_type      { target: "input.edit", text: "Edited by Playwright", submit: true }
browser_click     { target: 'button[aria-label="Edit Second item"]' }
browser_type      { target: "input.edit", text: "THIS MUST NOT STICK" }
browser_press_key { key: "Escape" }
browser_evaluate  → { "dom": ["Edited by Playwright", "Second item"],
                      "ls":  ["Edited by Playwright", "Second item"] }
```

Escape discarded the edit in both the DOM and `localStorage`. That is a genuine behavioural
assertion, not an inference.

**Accessibility-tree snapshots as the primary interface.** `browser_snapshot` returns
structured YAML rather than pixels, so the agent reads semantics directly:

```yaml
- list "Todos" [ref=e8]:
  - listitem [ref=e25]:
    - checkbox "Mark Ship MCP comparison as done" [ref=e27]
    - button "Edit Ship MCP comparison" [ref=e28]
    - button "Move Ship MCP comparison up" [disabled] [ref=e29]
- status [ref=e11]: 0 items left
- group "Filter todos" [ref=e12]:
  - button "All" [pressed] [ref=e13]
```

This single output confirmed four separate refinement claims — `role="status"`, the filter
`group`, `aria-pressed`, and move buttons disabled at the list edges — with no screenshot.

**It emits the Playwright code it ran.** Every call echoes the equivalent script, so an
exploratory session converts into a committed spec file almost directly.

**Strict-mode ambiguity errors.** `li[data-id] .text` matched two elements and the call
*failed*:

```
Error: strict mode violation: locator('li[data-id] .text') resolved to 2 elements
```

Most automation silently takes the first match. Failing loudly turns a would-be flaky test
into an immediate, obvious error.

### Limitations

- **No performance or resource measurement.** No Lighthouse, no trace, no heap snapshot. It
  tells you the app *behaves* correctly, never whether it is fast or leaking.
- **Clean profile by default** — no existing logins. Good isolation, extra work for
  authenticated flows.
- **First launch downloads a browser**, so the first call is slow (~5s here).
- **`element` vs `target` are both present** and easy to confuse; only `target` is required,
  and passing just `element` fails validation.

### Recommended for

E2E and regression testing, accessibility structure verification, cross-browser checks,
scraping an authoring session into a real spec file, and any flow where keyboard fidelity
matters.

## Chrome DevTools MCP

### What it does well

**Lighthouse as a single tool call.** This is the capability Playwright has no answer to:

```
lighthouse_audit { pageId: 1, device: "desktop" }
→ Accessibility: 100 | Best Practices: 100 | SEO: 90 | Agentic Browsing: 100
  Passed: 47  Failed: 1
```

The accessibility 100 is meaningful here: it is an independent instrument agreeing with the
refinement pass, rather than the same agent marking its own homework.

**It found a real defect.** The one failure was `meta-description`, which no amount of
behavioural testing would surface. Combined with a `favicon.ico` 404 that Playwright's console
reader caught, that produced commit `938a993` — and a clean re-run:

```
Passed: 48  Failed: 0   |   Console: 0 errors, 0 warnings
```

**Real performance traces with interpreted insights.** `performance_start_trace` returns
metrics plus a menu of named insights:

```
LCP: 179 ms  (TTFB 2 ms, render delay 178 ms)
CLS: 0.00
Available insights: LCPBreakdown, RenderBlocking, Cache, ...
```

`performance_analyze_insight { insightName: "RenderBlocking" }` then explains *which* requests
blocked render and why. For this app the render delay dominates LCP — the styles and script
are tiny, so the cost is parse/execute, not transfer.

**Deeper diagnostics:** `take_heapsnapshot`, `list_network_requests`, `get_network_request`,
`emulate` for CPU/network throttling.

### Limitations

- **`pageId` is mandatory and 1-based, and the model cannot guess it.** Every session must
  start with `list_pages`. Omitting it is a hard validation error, and `pageId: 0` returns
  `Error: No page found` — a sharp edge that cost two wasted calls during this test.
- **Interaction exists but is secondary.** It has `click`/`fill`/`press_key`, but no
  strict-mode safety net and no emitted reusable code.
- **Chrome only**, by definition. No Firefox or WebKit.
- **Slower calls** — the Lighthouse audit took ~4s, the trace ~5s.
- **Reports land in temp directories** unless `outputDirPath` is set; parsing the failing
  audit out of `report.json` was a manual step.

### Recommended for

Performance budgets and Core Web Vitals, Lighthouse gates in CI, memory-leak hunting,
diagnosing slow or janky pages, and auditing a build you did not write.

## Verdict

**They are complementary, not competing, and the split is clean:** Playwright MCP answers
*"does it behave correctly?"*, Chrome DevTools MCP answers *"is it any good?"*.

In this test each one found something the other could not. Playwright proved the Escape-cancel
path genuinely discards state; Lighthouse proved the page was missing a meta description. Neither
tool alone would have produced commit `938a993`.

For my workflow I would keep **both**, defaulting to Playwright MCP for day-to-day feature work
and reaching for Chrome DevTools MCP at review time and before a release.

One caveat worth stating: nothing here validates *real* assistive-technology output. Lighthouse
scoring 100 on accessibility and a snapshot showing correct roles both confirm structure, not
the experience of a screen-reader user.

## Reproducing

The servers were exercised through a ~60-line stdio MCP client
([`tools/mcp-probe.mjs`](tools/mcp-probe.mjs)) rather than through the agent's own tool list,
because project-scope servers only load after interactive approval. This turned out to be a
useful technique in its own right: it makes tool schemas, timings and raw responses directly
inspectable.

```bash
node tools/mcp-probe.mjs "npx -y @playwright/mcp@latest" \
  '[{"name":"browser_navigate","args":{"url":"http://localhost:4173"}},
    {"name":"browser_snapshot","args":{}}]'
```
