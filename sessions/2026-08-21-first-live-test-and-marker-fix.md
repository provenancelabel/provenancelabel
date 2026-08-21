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

**Fix**: kept the exact insert/find-by-text/remove logic as-is (it just proved itself live) — only added styling to the two marker paragraphs specifically (`setFontSize(1)`, white foreground) so they're invisible to a reader but still findable via `getText()` for the replace-on-reissue logic. Deliberately did not switch to a structurally different approach (e.g. Apps Script `NamedRange`) for this — lower risk to fix the one thing that broke than to swap in an untested mechanism right after the first thing that worked.

**Known trade-off, not fixed**: white-on-white text can show up as a visible artifact on a non-white page background, in some PDF exports, or to screen readers. Acceptable for a first pilot pass; worth revisiting if it becomes a real complaint.

## Open items
- Re-test the full chain with the marker fix in place — confirm markers are actually invisible now, and specifically confirm re-issue → re-apply *replaces* the block rather than duplicating (the replace path hasn't been exercised live yet, only the first-insert path).
- `registry#4` — S6/S7 signal → Confidence wiring (not built).
- `provenancelabel#32` — clasp setup (not built).
- Domain-install plan for the professor handoff (not executed).
- `drive.readonly` scope narrowing (not reviewed).
