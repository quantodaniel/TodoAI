# Deep Dive into Prompting: Reviewing Patches Against a Ruleset

**Task chosen:** reviewing a proposed patch against this repo's `.claude/rules/` — the recurring
review job here, and the one I most want reliable.

**Method:** rather than judge prompts by how good their output *reads*, I planted a known set of
defects in a patch and scored each prompt on how many it found. The scoring key was written
**before** any result came back. All runs used the same model, the same input, in parallel, blind
to each other.

Everything is reproducible from [`prompting/`](prompting/): both patches, both ground-truth keys,
the four prompts verbatim, and the scores.

## Round 1 — four prompts, one blatant patch

A patch adding a "priority star" feature with **16 planted violations** across all six rule files
(CDN script, `innerHTML` with user input, clickable `div`, missing `aria-label`, `console.log`,
in-place mutation, `render()` without `save()`, unchecked `closest()`, hardcoded hex,
`outline: none`, 24px target, `!important`, …).

| Prompt | Technique added | Hits /16 |
| --- | --- | --- |
| v1 | none — *"review this code and tell me what's wrong"* | **16** |
| v2 | + role, + pointer to the rule files | **16** |
| v3 | + decomposition: six forced passes, one per rule file | **16** |
| v4 | + checklist extraction, line-by-line CoT, reverse sweep for omissions, self-critique, worked example, output schema | **16** |

**The task saturated immediately.** My starting hypothesis — more technique, better recall — was
simply not supported. With the rules sitting on disk and the violations blatant, the agent goes
and reads the rules regardless of how the request is phrased. Technique changed the *shape* of the
output, not its content.

### The one genuinely surprising result

**v1 (naive) found more real bugs than v2 (role + rules).**

v2 ended with *"Report the rule violations you find"* — and returned exactly that. v1 asked the
open question *"what's wrong with it"* — and returned the rule violations **plus** functional bugs
neither the rules nor I had thought to ask about:

- `renderPriority()` is never called anywhere, so the whole feature is dead on arrival
- `priority` would be stripped by the four *existing* object rebuilds in `commitEdit`/toggle
- `innerHTML +=` re-parses the `<li>`, clobbering an open edit input and live checkbox state
- a second `list` click listener registered instead of extending the existing one

**Lesson: over-specifying the output target narrows the search.** Asking for "rule violations" got
rule violations and stopped. This is the opposite of the usual advice to be maximally specific,
and it is the single most useful thing I learned here.

## Round 2 — the same prompts, a subtle patch

Round 1 could not discriminate, so I wrote a second patch where every defect requires actually
knowing the rules *and* the codebase: `save()`/`render()` present but in the wrong **order**; an
`aria-label` that exists but doesn't name its target; `height: 38px` (2px under the threshold); a
new token added to the light `:root` but not the dark one; nesting exactly 3 levels; a test that
exists but asserts only the DOM. **10 planted defects.**

| Prompt | Hits /10 | Cost |
| --- | --- | --- |
| v2 role + rules | **9** | 84k tokens, 124s |
| v4 full stack | **9** | 125k tokens, 453s |

Recall was identical. So technique bought nothing? No — it bought **precision**:

|  | v2 | v4 |
| --- | --- | --- |
| Root cause | found the swapped `iconButton()` args | same, then traced the cascade further: the class becomes `Archive`, so `e.target.matches('.archive')` **never fires** and the click handler never runs |
| Calibration | reported `height: 38px` flatly | noted `.icon`'s `min-height: 40px` would clamp it in practice — a violation as authored, not yet a visible bug |
| | reported the missing dark token flatly | noted an unredefined custom property silently keeps its light value |
| Negative space | — | coverage table showing `dom-safety.md` and `no-dependencies.md` clean, *with justification* |

For a review I act on, calibrated severity matters as much as recall: a reviewer that flags
everything at the same pitch is one I start ignoring.

### The reviewers found a bug in my own fixture

I wrote `iconButton('Archive', glyph, 'archive')` assuming the signature was
`(label, glyph, className)`. It is actually `(className, glyph, label)` — verified in
[app.js:133](app.js:133). I introduced a real bug by accident, did not notice, and **both**
reviewers caught it and traced its consequences correctly. Worth recording plainly: the agents
were right about something I had wrong.

### The miss was mine, not theirs

Both prompts missed planted defect #3 — `announce('Archived')` doesn't name the item, unlike every
other announcement (`Deleted "<text>"`).

```
$ grep -rin "announce" .claude/rules/
(no matches)
```

**No rule covers announcement wording.** It is a convention violation, not a rule violation — and
v4 was explicitly told to "remove anything you cannot tie to a specific rule bullet", i.e.
instructed *not* to report it. Scored against rule-covered defects only, both prompts got **9/9**.

**Lesson: the ruleset is the ceiling.** A rules-based reviewer cannot catch what the rules don't
encode. The fix is not a better prompt — it's a new rule bullet.

## What worked, ranked for this use case

1. **Open-ended framing beats a narrow output target.** The highest-value change was asking
   "what's wrong" instead of "list rule violations". Everything else was refinement.
2. **Self-critique (v4 Step 5–6)** produced the calibration difference — qualifying the 38px
   finding, admitting the dark-token issue is latent. Cheap, high return.
3. **Cross-referencing existing code (v4 Step 5)** caught the deepest finding: tracing `archived`
   through the unchanged `load()` to show the feature breaks on reload.
4. **Reverse sweep for omissions (v4 Step 4)** is the only technique that structurally finds
   violations of *absence* — a missing dark-mode token, a missing assertion. Line-by-line reading
   cannot find these by construction.
5. **Output schema + worked example** improved usability a lot and recall not at all. Worth it for
   reviews a human reads; skip it when piping to another agent.
6. **Decomposition (v3)** produced the best-organised output — a per-line × per-rule matrix showing
   which single lines break several rules — but did not raise recall.
7. **Few-shot** was the weakest lever here. One worked example set the format; it did not teach
   the model to find anything it wasn't already finding.

**Did not help:** role-playing ("you are a senior reviewer") had no measurable effect. Stating
*why* the rules exist may have, but I did not isolate it.

## The final prompt

```
You are the reviewer for <project>. The rules in .claude/rules/ are binding.

Patch under review: <path>

METHOD
1. Read every rule file, then the source files the patch touches, then the existing tests,
   so you know the conventions the patch must match.
2. Extract every rule bullet as a separate checklist item. Write it out.
3. Read the patch line by line: for each added line, which checklist items does it violate?
   One line often violates several — record all. Beware lines that APPEAR to comply: a call
   present but in the wrong order, a label that exists but says the wrong thing, a value close
   to a threshold but on the wrong side.
4. Reverse the direction: walk the checklist and ask "does the patch break this by OMISSION?"
   A token added to one theme block but not the other, an assertion a test should make and
   doesn't. A line-by-line read cannot find these.
5. Cross-reference the EXISTING code: given how the app already works, does this patch do what
   it claims? Trace any new data through the existing load/save path.
6. Self-critique: drop anything you cannot tie to a specific rule bullet or a demonstrable bug.
   Then ask which rule files you reported nothing against, and whether that is genuine.
7. Finally, set the rules aside and ask plainly: what else is wrong with this code?

Report each finding as: severity / rule file + quoted bullet / offending line / concrete
failure with a specific input / fix. End with a coverage table per rule file and a total.
```

Step 7 is the addition Round 1 forced on me. Without it the prompt inherits v2's failure mode —
comprehensive on rules, blind to everything else.

## Honest limits

- **n = 1 per cell.** Six runs, no repeats. LLM output varies between runs; the round-1 v1-vs-v2
  gap in particular could partly be variance. The saturation result is robust (four independent
  runs agreed); the finer round-2 distinctions are indicative, not measured.
- **One model, one codebase, one task.** A small, well-documented repo with explicit written rules
  is close to the best case for this. Conclusions may not transfer to a large codebase with
  implicit conventions.
- **I wrote both the defects and the scoring key**, so the ground truth reflects what I thought to
  plant. Round 2 showed the obvious hazard: one of my ten defects wasn't covered by any rule, and
  another was a bug I introduced without meaning to.
- **Recall was measured; usefulness was judged.** The precision differences between v2 and v4 are
  my assessment, not a metric.
