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

## clasp filed for later (`provenancelabel#32`)
Shelton confirmed the manual copy-paste-into-the-editor deploy workflow is working, but wants `clasp` set up once deploy frequency increases (e.g. once the pilot is live and turnaround needs to be fast). Filed, explicitly deferred, not built this session.

## "Issue the label in the sidebar" — real gap found before building anything
Shelton's next ask: the professor should be able to get a real PL label in the sidebar and apply it to their document, with the doc's last revision showing the latest PL. Before writing code, checked what `POST /api/labels/register` (`plgen-registry/src/routes/labels.js`) actually requires — a real self-reported `human_pct`/`ai_pct` split plus author, nothing the paste-detection signal can supply on its own.

That check surfaced a bigger, real finding: `computeConfidence()` (`plgen-registry/src/confidence.js`) hardcodes S6 (Paste Event Ratio) and S7 (Session Gap Detection) — two of the eight publicly-documented signals behind the real Confidence score — as permanent `{ value: 0.50, status: 'partial' }` placeholders, with a comment saying they're waiting on "session instrumentation not yet available." The Add-on's `analyzeRevisions()` already computes exactly that instrumentation (`paste_ratio`, `paste_events`, `session_gaps`), but it's only ever reached the disconnected `/score` stub — never registration, never `confidence.js`. Shelton's framing ("bring this closer to what the PL is actually doing, not so far off") landed on this: issuing a real `PL-XXXXXX` from the one integration surface capable of resolving S6/S7 for real, while still leaving those two signals as generic "unverified" placeholders, would be a real credibility gap, not a nitpick.

Confirmed the DB side of this: `computeConfidence()` is called at *view* time (`viewer.js:62`) off the stored `labels` row — there's no column for paste/session data at all, so wiring this in is a schema change, not just an endpoint change.

## Form vs. function split (Shelton's explicit call)
Rather than build the backend wiring now, Shelton drew an explicit line: UI/display work now, database/scoring work later. Scope for this pass:

- **Sidebar UI upgraded** (`Sidebar.html`) with a new "Issue PL Label" section below the existing writing-pattern check: self-report form (author, human/ai split with client-side sum-to-100 validation, AI tools, process notes) and a **"Preview Label"** button that renders the real label format client-side — mirrors `buildLabelText()`'s actual layout (not an invented one) so what's shown matches what a real label will look like, with a placeholder `PL-XXXXXX (preview — not yet registered)` ID and a `Confidence: TBD — calculated at registration` line calling out the still-unwired S6/S7 signals inline.
- **"Apply Label to Document" button added, deliberately non-functional** — `disabled`, with a `title` tooltip and a caption explaining registration/insertion aren't wired up yet. No `google.script.run` call attached; this is a placeholder for the real flow, not a stub that silently no-ops.
- Nothing in this pass touches the registry, the DB, or `/register`. Zero network calls added.

Two backend items filed to track the deferred function-side work, rather than leaving it as inline TBD comments only:
- **`registry#4`** — wire the Add-on's paste/session signal into S6/S7 Confidence scoring (schema migration, `/register` accepting a `revisions` payload and computing server-side, `confidence.js` reading real values with the existing hardcoded partial as fallback for non-Add-on registrations). Also notes `buildLabelText()` still hardcodes a stale `v1.0` header — worth fixing in the same pass.
- **`provenancelabel#33`** — wire the sidebar's "Preview Label" / "Apply to Document" buttons to a real `/register` call and `DocumentApp` insertion once the above lands, including the still-open free-vs-member tier decision for pilot professors and the "replace on re-issue" design (new immutable `pl_id` each time, doc's native revision history shows the latest without custom timestamp tracking).

Committed and pushed.

## Open items
- Execute the domain-install plan above once the professor's IT contact is confirmed — GCP project link, Internal OAuth consent, real deployment, admin-console install.
- Review the `drive.readonly` OAuth scope for narrowing before that install — flagged as worth a look since the admin console will show requested scopes plainly to whoever approves the push, but not changed this session.
- `registry#4` — S6/S7 Confidence signal wiring (not built).
- `provenancelabel#33` — real registration + document-insertion wiring for the new sidebar UI (not built).
- `provenancelabel#32` — clasp setup, deferred until deploy frequency increases (not built).
- Real domain-wide/pilot install, student data privacy research (SDPC/NDPA), and formalizing the black-box scoring revision remain outstanding from prior sessions.
