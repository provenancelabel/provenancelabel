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

## Replace path verified — with one real gotcha along the way
Second live test: issued `PL-000023`, applied it — but `PL-000022` was still there too, just with 23 pasted above it. Not a bug in the new code: `PL-000022` had been applied under the *old* text-marker mechanism, before the `NamedRange` rewrite, so it was never tagged — `removeExistingLabelBlock()` correctly found nothing to remove. `PL-000023` was the first block ever created *with* a real tag.

Deleted the orphaned `PL-000022` block by hand (one-time cleanup from the mechanism switch, not something the code needs to handle), issued a third label, applied again — **`PL-000024` correctly replaced `PL-000023` inline**, single block remained. That's the actual proof point for the replace-not-duplicate design, and it holds.

**Full chain now verified live, end to end**: Check → Issue → Apply → re-Issue → re-Apply-replaces. This closes out the verification goal this whole session was chasing.

## Real product course-correction: self-report alone isn't compelling to a professor
With the chain working and "get this in the professor's hands" back on the table, asked whether that also starts surfacing Confidence scores. Checked `viewer.js` directly rather than assume: `computeConfidence()` is never even called for free-tier labels — the viewer route 403s before reaching it — and the Add-on issues free tier only, by design. So under the current shape, the professor's labels can't show a Confidence score regardless of `registry#4`'s status; that's a separate, bigger decision (real member account/key) than just installing the Add-on.

Shelton reframed the actual problem instead of picking a tier: a professor's real worry is students misreporting the split, and self-report can't solve that — someone who wants to lie just types different numbers. The one thing in this whole system that isn't asserted is the writing-pattern signal ("Check This Document"), because it's observed from the doc's own edit history. His call: stop routing everything through the self-report form, and start surfacing what's already being computed in the background instead — specifically, put the check's output **into the applied label itself**.

**Built, no registry changes**: this is Add-on-side content composition only — deliberately decoupled from `registry#4` and the tier question, so it didn't need either decision resolved first.

- **`Sidebar.html`**: "Check This Document" now stashes its result in `lastCheckResult`. New `buildAppliedContent(issuedLabel, checkResult)` composes the full text to insert — the self-reported label, then a "— Writing Pattern Check —" section reusing the existing `describeSignal()` copy (with its "not calibrated, not a verdict" caveat carried over), or a note that no check was run this session. This is composed once, client-side.
- **`Code.gs`**: `applyLabelToDocument()` simplified to take the pre-composed text directly rather than the `issuedLabel` object — it no longer needs to know either result's shape, just inserts and NamedRange-tags whatever text it's given.
- **Explicitly not sent to the registry** — `/register` still only ever receives the plain self-report; nothing about the signal reaches the `pl_id` record itself. Real Confidence integration stays scoped to `registry#4`, untouched today.

## Verified live: combined content renders correctly
`PL-000025` applied with a check run first — self-reported block followed by the Writing Pattern Check section, exactly as composed, correct signal data (5 revisions, 3 session breaks, no paste-like insertions). Full loop (Check → Issue → Apply, combined content, replace-on-reissue, no visible mechanism artifacts) is now proven end to end.

## Domain-install: real correction to the 2026-08-18 plan
Picked up the domain-install work. Caught a real gap in the original plan before Shelton acted on it: "Internal" OAuth consent-screen audience only exists for, and only grants access within, the Google Workspace organization that owns the GCP project. A GCP project created under Shelton's own account (or `empathylab.io`) can never be set Internal for the professor's domain — they're different orgs. The original plan's "developer does the GCP steps, their admin installs by Deployment ID" phrasing glossed over this; the GCP/OAuth setup itself has to happen on an account inside the professor's org, not just the final install step.

Wrote `apps-script/plgen-connector/DOMAIN-INSTALL.md` — a standalone doc Shelton can hand directly to the professor's IT contact, splitting the work correctly: developer hands over the three source files only; everything GCP/OAuth/Admin-console happens on their side. Not executed this session (no IT contact engaged yet) — this is the corrected plan, ready to hand off.

## Open items
- `registry#4` — S6/S7 signal → Confidence *scoring* wiring (registry-side; today's work only puts the signal in the applied document text, not the registered record).
- Tier decision (free vs. real member account for the professor) — reopened by the Confidence-scope question, not resolved; deferred again while this content change was more immediately actionable.
- `provenancelabel#32` — clasp setup (not built).
- Hand `DOMAIN-INSTALL.md` to the professor's IT contact and walk through it — not yet executed, waiting on that contact.
- `drive.readonly` scope narrowing — worth revisiting now that an admin will actually see the requested scopes during install (not reviewed).
