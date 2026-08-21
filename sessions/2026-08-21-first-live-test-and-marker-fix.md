# Session: First Live Test — Full Chain Works, One Real Bug Found

**Date:** 2026-08-21
**Type:** Build / verification

## Context
Continuation of `2026-08-20-addon-register-wiring-checkpoint.md`. First actual live run of the Check → Issue → Apply chain built in the prior sessions, against a real Google Doc.

## Result: the full chain works
Shelton ran it end-to-end and got a real applied label:

```
⟦PLGEN-LABEL-START⟧
PROVENANCE LABEL v1.0
ID: PL-000022
Author: Shelton Davis
Created: 2026-08-21 14:13 UTC

Human contribution: 80%
AI contribution:    20%
AI tools: None

Process: Self written piece

-- Unregistered label. provenancelabel.org/join for permanent ID.
⟦PLGEN-LABEL-END⟧
```

Confirms: real `pl_id` issued (`PL-000022`, `/register` is genuinely incrementing), free-tier format correct, author/split/tools/notes all round-tripped correctly from the sidebar form, applied at the top of the doc as designed.

Also confirms, as expected: the label still shows `PROVENANCE LABEL v1.0` — the already-tracked stale header in the registry's `buildLabelText()` (`registry#4`), now seen live rather than just suspected from reading the source.

## Bug found: sentinel markers were visible
`⟦PLGEN-LABEL-START⟧` / `⟦PLGEN-LABEL-END⟧` showed up as literal visible text at the top of the doc — never styled out of view when built. They were only ever meant to be bookkeeping so re-applying can find and replace the block, not something a professor reads.

**First fix attempt (superseded same session)**: kept the text-search logic as-is, shrunk + white-out the two marker paragraphs (`setFontSize(1)`, white foreground) so they're invisible but still findable via `getText()`.

**Shelton's follow-up, adopted instead**: why insert marker text into the document at all? Correct call — the only reason text-search was used was that Apps Script executions are stateless between calls, so *something* persistent was needed to relocate the block next time. Switched to Apps Script's native `NamedRange` (`Document.addNamedRange()` / `getNamedRanges()`) instead — this tags the inserted paragraphs with retrievable metadata Docs stores about the range, not a character on the page. `removeExistingLabelBlock()` now looks up the tag directly rather than scanning body text for markers, and nothing is ever written into the document purely for bookkeeping. Genuinely cleaner than the white-text workaround, not just a visual patch over the same mechanism.

## Open items
- Re-test the full chain with the NamedRange rewrite in place — nothing should appear in the doc but the label content itself, and re-issue → re-apply should replace the block rather than duplicating (the replace path hasn't been exercised live yet, only the first-insert path — now doubly true since the removal mechanism changed).
- `registry#4` — S6/S7 signal → Confidence wiring (not built).
- `provenancelabel#32` — clasp setup (not built).
- Domain-install plan for the professor handoff (not executed).
- `drive.readonly` scope narrowing (not reviewed).
