# Session: PLGen — Gemini Gem / Google Ecosystem
**Date:** 2026-07-13
**Type:** Strategy / IP & trust architecture / product decision

## Starting question
Shelton is building a Gemini Gem for Provenance Label (PLGen) and wanted to know what ownership PL retains once introduced into the Gemini/Google ecosystem. Original plan: have students paste/use a Gem directly (Chromebook-native) for tracking and label generation.

## Ownership & IP findings (Google/Gemini terms)
- **Prompt/instruction content in a Gem:** Shelton keeps IP ownership. Google gets a standard non-exclusive license (host, reproduce, distribute, create derivative works) to operate the service — not an ownership transfer.
- **Generated output** (labels, coaching text): Google disclaims ownership — "as between you and Google," output belongs to the user — but Google reserves the right to generate similar output for others (no exclusivity).
- **Training/privacy exposure is tiered by account type, not by format** (Gem vs. pasted prompt):
  - Free/personal Google accounts → content used for training + human review by default; opt-out via Activity settings or Temporary Chat.
  - Workspace for Education accounts (Gemini enabled as Core Service, DPA signed) → ring-fenced to the domain, not used for training, not human-reviewed, FERPA-compliant "school official" status.
  - Chromebooks can be either — need to confirm which account type students actually use.
- **Gem sharing** (launched Sept 2025) is governed by the domain's Drive sharing settings; admins have a dedicated Gems sharing toggle. Confirms per-teacher/per-subject Gems are technically viable within one school's domain.
- **System prompts are not secure.** Anything in a Gem's instructions — or pasted directly by a student — should be treated as effectively public: extractable via prompt injection, or exposed to anyone with edit access, regardless of Google's sharing settings.

## IP/proprietary strategy — what's the black box
Reviewed the current compiled prompt (`plgen-v1-compiled.md`, plgen-core v3.3 + plgen-coach v1.0) and split it:
- **Keep open:** label format/schema, badge/disclosure block, session commands, core philosophy ("disclosure, not judgment"), tone commitments.
- **Generalize, don't itemize:** existence of an honesty/input-provenance check — not its exact trigger condition.
- **True black box:** Signal A–E taxonomy and exact triggers, STATE 1/2/3 numeric thresholds (baseline −10, 30% floor), the 85 baseline default, and eventually the full S1–S8 weight table for PLGen-C.
- Flagged as a **partial revision** of the previously-logged principle ("the formula should be open for trust") — needs to be formally updated in project memory, not left standing alongside the new black-box instinct.

## The core trust problem
- If the calculation runs inside a Gemini Gem, **Google's model is the calculation** — non-deterministic, subject to silent model updates. Can't honestly claim "not altered by a third party" under that architecture.
- Real fix: a deterministic formula, computed by code Shelton controls, server-side (extends the existing PLGen-C S1–S8 design), fed by observable signals rather than LLM narrative judgment.
- Trust mechanisms recommended: immutable/append-only label records (no edit endpoint after creation), versioned + changelogged formula, a public verify page by `pl_id`, SHA-256 hashing of transcript + formula version at generation time (already validated feasible via Chrome MCP `crypto.subtle.digest`).

## Dirt-simple UX requirement
Shelton's constraint: students should at most (1) paste the prompt, (2) start writing, with an optional membership ID for registration.
- Reframed: literal copy-paste is actually the *least* protective option — it discloses 100% of the logic to every student on first use. A shared class Gem (open link → write, no paste step) is simpler for the student **and** better for protecting the "how," since students never open the instructions editor.
- Membership/teacher ID can be baked invisibly into a per-teacher/per-subject Gem rather than typed by each student.

## Pivotal finding: Gems cannot call an external API
This closes off Gems as the scoring vehicle entirely — a Gem structurally cannot satisfy the "must not be altered by a third party" requirement, regardless of prompt wording, because it can't reach Shelton's server.

Two paths surfaced:
- **A)** Keep the Gem for drafting only (OPEN/OBSERVE); student exports the transcript and submits it elsewhere for scoring.
- **B) (recommended)** Build a Google Workspace Editor Add-on (Apps Script) for Docs. Can call the registry API directly via `UrlFetchApp`, and gives access to Docs revision history as a signal source. *Correction logged:* revision history is snapshot-based, not full keystroke telemetry (Google can merge revisions) — but the large-paste-in-one-revision pattern is real and detectable, and matches the existing Signal A logic.

## What building the Add-on requires
- Apps Script project + paired GCP project; HTML service sidebar UI; server-side functions calling the Docs/Drive API (revisions) and `UrlFetchApp` to reach the registry.
- Reading document/revision content is a "sensitive" OAuth scope requiring Google app verification for public release; broader/restricted scopes require an annual CASA Tier 3 security assessment (real cost, penetration testing, ~3 week badge turnaround) — but there's an **exception for internal/domain-wide installs within a single organization**, which requires no Google review at all.
- Maps cleanly onto the existing roadmap: **M1** = local spike, no verification needed. **M2** = internal install to one pilot school domain, still no Google review. **M3** = public Marketplace listing — this is where OAuth verification (and possibly CASA) actually kicks in.
- Flagged separately: K-12 districts typically also require their own student data privacy agreement (e.g., an SDPC-style National Data Privacy Agreement) independent of Google's requirements. **Not yet researched — Shelton wants this covered soon.**

## Decision reached
Move forward with **M1 — a connectivity-only spike**:
- No real scoring/signal-detection logic yet. Just prove the Add-on can read a document's revision history, format it, and successfully round-trip to the registry API.
- Registry-side endpoint contract is undetermined — Claude Code should investigate the actual `plgen-registry` codebase first and propose whether to target an existing endpoint or stub a new one, before writing anything.
- Code delivered as plain Apps Script project files (`Code.gs`, `appsscript.json`, sidebar HTML) for Shelton to load manually or via MCP — no clasp CLI setup.

## Next steps
- Student Data Privacy research (SDPC/NDPA-style agreements, FERPA specifics beyond what's covered here) — explicitly deferred, to be tackled soon.
- Eventually: formalize the revision of the "open spec" principle in project memory now that black-boxing signals/thresholds is the stated direction.

## M1 build & deploy — completed same day

Built and shipped the connectivity spike:
- `plgen-registry`: new stub `POST /api/labels/score` (no DB writes, fixed dummy response), mounted in `server.js`.
- `provenancelabel/apps-script/plgen-connector/`: `appsscript.json`, `Code.gs`, `Sidebar.html` — Editor Add-on that reads Drive revision history (`Drive.Revisions.list` v3 + `exportLinks['text/plain']` for a real size proxy, since native Docs don't populate `Revision.size`), and round-trips a summary to the registry via `UrlFetchApp`.

**Deploy hit a real, unrelated divergence**: pushing the registry change surfaced 3 remote commits this checkout never had (auth overhaul — API key → magic-link sessions, old `x-plgen-key`/`authMember` kept for backwards compat; a dashboard register panel; a new PL share badge on the label viewer page). The share-badge commit and an earlier local commit (PLGen-C confidence card) both rewrote the same `viewer.js` template function, causing a real merge conflict — resolved by hand-splicing both features in rather than picking one side. Also hit a `gh` multi-account issue (active account lacked repo access; fixed via `gh auth switch` to the `provenancelabel` account) and a stray untracked `src/confidence.js` on the Droplet blocking `git pull` (turned out to be an identical stale copy, safely removed).

**End-to-end verification, confirmed by Shelton:**
- Doc revision read: real revision list returned, `size_chars` populated and distinct per revision (0 → 23 chars across 2 revisions on a test doc).
- Registry round trip: `HTTP 200 {"received":true,"revision_count":N,"ts":...}` after deploy.
- Live label page: both the confidence card and the new share badge render correctly post-merge.

**M1 is done.** Open for M2: real paste-detection heuristic (using the size-delta pattern now proven reachable), pilot-school domain install, and the still-outstanding student data privacy research above.
