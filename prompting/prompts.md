# The four prompts, verbatim

## v1 — naive
Review this code and tell me what's wrong with it: <path to candidate-patch.diff>

## v2 — role + rules pointer
You are reviewing a proposed patch for the TodoAI project at <repo>.

The project has coding rules in .claude/rules/ (indexed from CLAUDE.md). Read them and review
this patch against them:

<path>

Report the rule violations you find.

## v3 — decomposition (six forced passes)
[role + patch path]

Work through the review as SIX SEPARATE PASSES, one per rule file. Do not merge them. For each
pass, first read that rule file in full, then re-read the entire patch looking ONLY for
violations of that one file, then report what you found before moving to the next pass.

Pass 1..6 — one per rule file

A single line of the patch may violate several rules; report it in every pass where it applies
rather than only the first. After the six passes, give a combined list.

## v4 — decomposition + CoT + bidirectional sweep + self-critique + few-shot + schema
[role, with WHY the rules exist]

Step 1. Read all six rule files, then app.js/index.html/styles.css for conventions.
Step 2. Build a checklist: extract EVERY rule bullet as a separate checkable item. Write it out.
Step 3. Line by line through the patch: "which checklist items does this line violate?"
        A single line often violates several. Reason explicitly before judging.
Step 4. Reverse direction: walk the checklist and ask "does the patch break this anywhere?"
        This catches violations of omission that a line-by-line read misses.
Step 5. Self-critique: drop anything not tied to a specific rule bullet; ask which rule files
        you reported nothing against and whether that is genuine.

+ WORKED EXAMPLE showing one finding at the required quality (severity / rule file + quoted
  bullet / offending line / concrete failure with a specific input / fix), with a note on what
  makes it good.

+ OUTPUT FORMAT: checklist, findings ordered critical->minor, coverage table per rule file,
  total count.
