# Session: M2 Heuristic, Gemini/MCP Reality Check, and Strategy Reset
**Date:** 2026-07-14
**Type:** Build / research / strategy

## Context
Continuation of the M1 Docs Add-on spike from the day before (`sessions/2026-07-13-gemini-gem-google-ecosystem.md`, M1 completed and verified end-to-end). This session picked up M2: the real paste-detection heuristic, plus a strategic detour into what's actually detectable, and a course-correction on scope.

## M2 part 1 — real paste-detection heuristic
Scoped narrowly (algorithm only, no DB/registration changes — deferred because labels are meant to be immutable/append-only, so real integration needs scoring to happen *at* registration time, a separate future pass). Built `plgen-registry/src/paste-detection.js`: `analyzeRevisions()` computes `paste_ratio`, `paste_events`, `session_gaps`, and a `status` (`insufficient_data` / `low_confidence` / `measured`) from a Docs Add-on's revision-history payload. Wired into `POST /api/labels/score`, replacing the M1 dummy echo. Deployed and confirmed live via curl and the Apps Script sidebar.

**Real false positive caught live**: Shelton typed several paragraphs by hand into a fresh test doc; the heuristic flagged it as a paste (`paste_ratio: 1`). Root cause: the original algorithm used an absolute char-count threshold (40 chars/revision-step) with no time awareness — Google Docs' periodic (not per-keystroke) revision snapshots meant 543 characters typed over 45 minutes looked identical to an instant paste. Fixed same-day: switched to a **rate-based threshold** (chars/minute since the prior revision, 300 chars/min provisional cutoff) — re-verified against the original false-positive case (now reads `paste_ratio: 0`) and against known-good paste/typing test cases (unchanged). Committed and deployed.

## Apps Script deployment troubleshooting (real cost, now resolved)
A long thread on "why does the Add-on only work in the original doc": involved a `Sidebar` filename case-sensitivity bug, a duplicate `enabledAdvancedServices` entry in the manifest, a bound-vs-standalone script issue, and ultimately the real root cause — **Apps Script test deployments are tied to one specific document, not installed account-wide** (confirmed via Google's own docs). Each new doc needs its own explicit test-deployment pairing (Deploy → Test deployments → Create new test → select doc → Save test) until a real domain-wide or public install happens. Full detail in project memory (`reference-plgen-appsscript-deploy-type`).

## Resolved: no Gemini-specific detection is possible
Answers an open question from the original 2026-04-24 concept session ("what Gemini events does Apps Script expose?"). Confirmed via research: **none.** Gemini's suggestions in Docs stay pending until the user approves them; once approved they're indistinguishable from any other edit in the revision history — no API, no `lastModifyingUser` distinction, nothing. This closes off the original framing that Gemini-in-Docs was the strongest v1 target *because* it was uniquely trackable. Reframed: the Add-on's real value is a tool-agnostic "did a large chunk of text appear quickly" signal (works the same for Gemini, ChatGPT-paste, or a pasted essay), which is actually a better fit for PLGen's stated self-report-plus-corroboration philosophy than a Gemini-specific tracker would have been.

## MCP considered and set aside for now
Briefly discussed whether an MCP (Model Context Protocol) server could give cross-tool AI observability. Conclusion: MCP is opt-in and requires the AI client to actively call a tool — it's a more structured version of the existing prompt-based self-report flow (`ai-prompt`), not passive surveillance across tools. Same fundamental limitation as Gemini: only works if the tool supports MCP, the connector is installed, and the AI is instructed to use it. Not pursued further this session; no code written.

## Strategy reset
Shelton named a real pattern in himself: iterating on the Add-on/detection accuracy indefinitely ("half-life'ing the design") instead of shipping. Explicit reframe: the core product — the registry, label format, badges, share flow, and existing self-report registration (`/new`, `ai-prompt`) — is **already live and usable today**, independent of the Docs Add-on ever reaching production. The Add-on/MCP work is background R&D toward a better corroboration signal, not a blocker to getting real users on what already works. Logged as a standing feedback note in project memory (`feedback-plgen-ship-dont-perfect`) to push back on future scope-creep tangents before real users are in the loop.

## Open items
- Get real users registering labels with what already works — no technical blocker, just needs to happen.
- Real domain-wide Add-on install (GCP project + Marketplace SDK, private publish) — deferred by choice, not blocked; Shelton has admin access to a domain (e.g. empathylab.io) when ready.
- Student data privacy research (SDPC/NDPA) — still outstanding from the prior session.
- Formalize the black-box scoring revision into whatever spec/doc still states the old "fully open formula" principle.
