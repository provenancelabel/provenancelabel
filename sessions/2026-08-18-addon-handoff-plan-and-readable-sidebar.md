# Session: Professor Handoff Plan and a Human-Readable Sidebar

**Date:** 2026-08-18
**Type:** Strategy / build

## Context
Picked back up on the Docs Add-on (`apps-script/plgen-connector/`), last touched 2026-07-14. Shelton wants to hand it to a professor so PLGen "lives in their editor" rather than being a copy-paste prompt to whatever AI they're using — which the Add-on was already architecturally built for, but two real gaps stood between that and an actual handoff.

## Distribution plan (discussed, not yet executed)
Confirmed the professor has Google Workspace admin access at their institution, which unlocks the lightest real path: domain-internal install, no Google OAuth review needed (matches the M2 exception already noted in project memory). Concrete steps identified:

1. Link a real GCP project to the Apps Script project (Project Settings → GCP Project) — currently on Apps Script's auto-generated default project, which can't be used for a real deployment.
2. Set that GCP project's OAuth consent screen to **Internal** — restricts to their domain and is what removes the verification requirement entirely.
3. Cut a real versioned **Deployment** (not a Test deployment) to get a Deployment ID — this is also what removes the per-document test pairing hit during M1/M2 dev (`reference-plgen-appsscript-deploy-type`); a real deployment installs to a user's account, not one doc.
4. Their Workspace admin installs it via Admin console → Apps → Google Workspace Marketplace apps → install by Deployment ID, scoped to just the professor's account/OU rather than domain-wide.

None of this was executed this session — it's the plan, pending the professor's IT contact.

## Sidebar output rewrite (real gap, fixed)
Shelton flagged the current sidebar output as "unhelpful" — pasted a real run showing the raw M1-era JSON dump (payload + registry response) verbatim. Confirmed the code was never meant to show this to anyone but a developer: the button was literally labeled "Test PLGen Connection" and the code comments called it a diagnostic tool.

Read the actual heuristic (`plgen-registry/src/paste-detection.js`) rather than guessing at field meaning, since its own comments are explicit that `paste_ratio` etc. are provisional/uncalibrated and "not ground truth" — that caveat had to survive into whatever replaced the JSON dump, or the UI would misrepresent the signal as more authoritative than it is.

- **`Code.gs`**: `testPlgenConnection()` now returns a structured object (`ok`, `docId`, `revisionCount`, `httpStatus`, `pasteSignal`, `rawPayload`, `rawResponse`) instead of a pre-formatted diagnostic string, so the sidebar can render it properly rather than just echoing text.
- **`Sidebar.html`**: rewritten to show a plain-language summary — revision count, writing-session breaks, whether any fast/paste-like insertions were found and roughly what share of growth they account for — with a status badge (Measured / Early read — low confidence / Not enough history yet / Error) and a persistent caveat line ("rough, provisional signal... not calibrated... meant to support your own AI-use disclosure, not replace it"). Raw payload/response moved into a collapsed "Technical details" `<details>` block so the debugging info Shelton still wants is there without being the primary view.
- Also fixed a stale top-of-file comment in `Code.gs` that still described the file as "M1 connectivity spike... no paste-detection logic yet" — no longer true since M2's signal is now wired through to the UI.

## Naming cleanup (this session, per explicit request)
Renamed dev/test-era labels now that a professor could plausibly see them:
- Add-on menu item: "Test PLGen Connection" → **"Check Writing Pattern"**
- Sidebar window title: "PLGen Connection Test" → **"PLGen Writing Pattern Check"**
- Sidebar button: "Test PLGen Connection" → **"Check This Document"**
- `appsscript.json` manifest display name: `"PLGen Connector (dev)"` → **"PLGen Writing Check"**

Committed and pushed.

## Open items
- Execute the domain-install plan above once the professor's IT contact is confirmed — GCP project link, Internal OAuth consent, real deployment, admin-console install.
- Review the `drive.readonly` OAuth scope for narrowing before that install — flagged as worth a look since the admin console will show requested scopes plainly to whoever approves the push, but not changed this session.
- Verify the new sidebar renders correctly against a live test deployment (not yet re-run since the rewrite).
- Real domain-wide/pilot install, student data privacy research (SDPC/NDPA), and formalizing the black-box scoring revision remain outstanding from prior sessions.
