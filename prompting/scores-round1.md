# Round 1 scores (blatant patch, 16 planted)

| Prompt | Hits /16 | Extras beyond ground truth | Notes |
| --- | --- | --- | --- |
| v1 naive | 16 | renderPriority never called (feature dead); priority wiped by existing commitEdit/toggle rebuilds; innerHTML += clobbers open edit input; duplicate listener registration; priorityCount dead state; diff not a real unified diff; scope creep | Open-ended "what's wrong" invited functional bug-finding |
| v2 role+rules | 16 | dead lodash import; clearAll undefined -> ReferenceError; README not updated (git.md); load() strips priority on reload | "Report the rule violations you find" narrowed output to rule violations |
| v3 decomposition | 16 | missing `found` guard in togglePriority; duplicate listener registration; renderPriority never called | Only run to produce a per-line x per-rule matrix; best-organised output |
| v4 full stack | 16 | load() strips priority + 4 other object rebuilds also strip it; renderPriority never wired in; missing `found` guard | Only run to produce severity ordering, per-finding fixes and a coverage table; longest output (~5x v1) |

## Round 1 verdict

All four prompts scored 16/16. The task saturated: when the rules are on disk and the
violations are blatant, an agentic model reads the rules and finds them regardless of prompt
scaffolding. Technique changed the SHAPE of the output (severity, fixes, coverage tables),
not what was found.

Most interesting inversion: v1 (naive) found MORE real bugs than v2 (role + rules). v2 ended
with "Report the rule violations you find" and returned exactly that; v1 asked the open
"what's wrong with it" and returned rule violations plus functional bugs (dead feature,
clobbered edit input, duplicate listener). Over-specifying the output target narrowed the
search.
