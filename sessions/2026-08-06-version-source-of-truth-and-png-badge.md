# Session: Version Source of Truth, Join Page Badge Fix, and PNG Badge Export
**Date:** 2026-08-06
**Type:** Housekeeping / build

## Context
Standalone session, not a continuation of the M1/M2 Add-on track (see `2026-07-14-m2-heuristic-and-strategy-reset.md`). Started from a sales one-sheet tech-stack question, which surfaced two real product issues: version numbers had drifted across the site, and the join page's example badge didn't link to an actual label. Both got fixed; the second led into a larger feature (PNG badge export) in the private registry repo.

## Tech stack inventory (for sales one-sheet)
Walked the repo to identify the full stack for a one-pager: static site on GitHub Pages, Node/Express registry API on a DigitalOcean Droplet (pm2), Google Workspace Add-on (Apps Script, Docs/Drive APIs), Custom GPT integration, and prompt-based (tool-agnostic, no-API) Gemini support. Flagged what shouldn't go on a sales sheet: scoring thresholds (black-boxed per `project-plgen-blackbox-revision`), droplet/SSH/pm2 specifics, and private repo names. One-pager copy itself not yet drafted — see Open items.

## Version source of truth
Confirmed version numbers had drifted independently across ~9 files (site pages, `plgen.txt`, `custom-gpt/system-prompt-v3.md`) with no build step to keep them in sync — `README.md` and `system-prompt-v3.md` were still on v1.0 while the live site was on v1.2. Found that version *history* already existed: `spec/index.html`'s Changelog table (added back on 2026-06-01) has correct v1.0/v1.1/v1.2 entries.

Built the fix (`provenancelabel` repo, commit `50ed95c`):
- `VERSION` file at repo root — single canonical value (`1.2`)
- `scripts/sync-version.py` — syncs every live version reference from `VERSION`, `--check` mode for CI. Deliberately scoped to avoid rewriting history: skips the spec page's Changelog table, the archived `custom-gpt/system-prompt-v2.md`, and PLGen's separate tool-version scheme (v3.x) — verified via a full-repo grep of every `v[0-9].[0-9]` occurrence before writing the patterns, not just the obviously-live ones.
- CI enforcement: `deploy.yml` now runs the check before deploying (blocks a bad deploy); new `version-check.yml` runs on PRs and non-main pushes
- Fixed the actual drift in `README.md` and `system-prompt-v3.md`
- Documented the bump process in `README.md`

## Join page badge → real PL
`join/index.html`'s example badge linked to `registry.provenancelabel.org` with no PL path — clicking it didn't land on an actual label, poor UX for a page meant to sell the registry. Fixed (commit `a06c1f6`): now links to and displays `PL-000001`, a real registered label. Checked for the same issue elsewhere; the only other bare-root registry link (`/spec`'s "Registry →" button) is intentional, left alone.

## PNG badge export (private `registry` repo)
Fixing the join-page link surfaced the next real gap: the registry's label viewer page only offered "copy link" and "copy HTML embed code" — no raster image, so members had no way to paste a badge into a doc. Built in `~/github/plgen-registry` (commit `9459f6a`):
- `src/badge-png.js` — renders the badge (dot + `PL-XXXXXX`) to a PNG via `@napi-rs/canvas` (prebuilt binaries, no native build toolchain needed), 3x scale, matching the existing dark embed-badge design pixel-for-pixel in proportion
- `GET /:plId/badge.png` route in `viewer.js`, same access gating as the page itself (404 for free-tier/nonexistent labels)
- "Download PNG" link (plain, universal) and "Copy Image" button (clipboard-as-image via `ClipboardItem`, feature-detected so it's hidden in browsers that don't support it) added to the viewer page

Tested locally end-to-end (local server, curl, rendered PNG inspected visually) before touching production. Deployed to the live Droplet: `git pull` (also picked up one other already-pending commit, a `paste-detection.js` change unrelated to this work), `npm install` (new dependency resolved cleanly), `pm2 restart`. Verified live against a real production label (`PL-000001`, confirmed `registered` tier) — both the PNG endpoint and the new UI buttons work on `registry.provenancelabel.org`.

Required switching the active `gh` account to `provenancelabel` before pushing to the private repo — same account-switching step noted in `reference-plgen-droplet-access`, reconfirmed still necessary.

## Noticed, not fixed
Production error log (`plgen-registry`) is showing repeated `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` warnings from `express-rate-limit` — `trust proxy` isn't configured, so the rate limiter can't trust the `X-Forwarded-For` header from whatever sits in front of the app. Pre-existing, unrelated to this session's changes. Not fixed — flagged for a separate pass.

## Open items
- Sales one-sheet copy itself — stack inventory and guardrails were identified, but the actual one-pager (being built with another agent) isn't done.
- `express-rate-limit` / `trust proxy` misconfiguration on the registry Droplet (see above).
- Everything carried over from the prior session (`2026-07-14-m2-heuristic-and-strategy-reset.md`) is still open: real users registering labels, domain-wide Add-on install, student data privacy research (SDPC/NDPA), and formalizing the black-box scoring revision in the spec.
