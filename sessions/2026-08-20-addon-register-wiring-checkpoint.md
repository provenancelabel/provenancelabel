# Session: Checkpoint — Add-on Registration Wiring, Not Yet Tested Live

**Date:** 2026-08-20
**Type:** Checkpoint (no new work this entry — see below)

## Context
Continuation marker for `2026-08-18-addon-handoff-plan-and-readable-sidebar.md`, opened at Shelton's request so this has a clean point to resume from. No new code changed in this entry — it captures where that session left off before picking back up.

## Where things stand
`apps-script/plgen-connector/` (pushed, `main@2bf3df2`):
- **Check This Document** — writing-pattern signal check, functional, hits `/api/labels/score`.
- **Issue Label** — functional, calls the real `POST /api/labels/register`, free tier only (no `x-plgen-key`; this Add-on issues on behalf of whoever's running it, not the developer's own account).
- **Apply Label to Document** — functional, inserts the issued label at the top of the doc via `DocumentApp`, wrapped in `⟦PLGEN-LABEL-START/END⟧` sentinel paragraphs. Re-issuing + re-applying replaces the block rather than stacking, so the doc's native revision history shows the latest PL in its latest revision.
- Naming cleaned up for a professor audience (menu item, sidebar title, manifest display name).

## Not yet done
- **Not verified against a live test deployment.** Everything above has been written and pushed, but never actually run against a real Google Doc — that's the first thing to do before anything else.
- `registry#4` — S6/S7 paste/session signal isn't fed into the registered label's Confidence score yet. Today's registration is plain self-report, same as the site's `/new` form.
- `provenancelabel#32` — clasp setup, deferred until deploy frequency increases.
- Domain-wide install plan (GCP project link, Internal OAuth consent, real Deployment, admin-console install by Deployment ID) — scoped, not executed, pending the professor's IT contact.
- `drive.readonly` OAuth scope narrowing — flagged, not reviewed.
- Student data privacy research (SDPC/NDPA) and formalizing the black-box scoring revision remain outstanding from prior sessions.

## Next up
1. Paste the current `Code.gs` / `Sidebar.html` / `appsscript.json` into the Apps Script editor and run the full flow (Check → Issue → Apply) against a real test doc — first real end-to-end verification of this whole chain.
2. Depending on what that surfaces, either fix issues found or move on to the domain-install plan for the professor handoff.
