# Session: Non-Member Flow Cleanup, Issue Triage, and Confidence Transparency
**Date:** 2026-08-13
**Type:** Build / strategy

## Context
Continuation of `2026-08-12-homepage-ship-member-gating-and-first-real-registration.md`, same working stretch. That log stopped before this session's real center of gravity: a full pass on the non-member experience, a second real registration, and a CPO-level call on what parts of the confidence-scoring system to make public.

## Second real registration + two registry issues found doing it
Shelton needed a JSON payload for a second Substack post ("What does it mean to reset?"), this time walked through as a member rather than handed a finished conversion — asked to do it via ChatGPT instead of Claude. Investigation surfaced the actual live GPT link (`chatgpt.com/g/plgen`) is a placeholder — flagged before sending him toward it. Delivered a hand-adapted JSON-output prompt (the site's own documented ChatGPT flow only produces the `@provenance` text block, not JSON) as the practical workaround, and the final payload once Shelton supplied the real URL (title inferred correctly from the URL slug pattern, matching the first registration).

Two real issues surfaced along the way, both filed against `registry`:
- **`registry#2`** — no edit endpoint exists for a registered label at all (confirmed by checking for `PATCH`/`PUT` routes — none exist). Matters because `work_url` often isn't final at registration time. Scoped carefully to preserve the split/process-notes immutability guarantee — recommended a narrow `work_url`/`work_title`-only allow-list, not a general edit endpoint.
- **`registry#3`** — the dashboard's registration preview shows Author/Split/Tools/Process but omits Title and URL, so there's no way to visually confirm those two fields before submitting a permanent, unest-editable record. Tied explicitly to `#2`.

## Issue triage across both repos
Reviewed all open issues (`provenancelabel` + `registry`) at Shelton's request, focused on the non-member/ChatGPT-to-Claude priority he set. Found and closed two stale/duplicate issues:
- **`provenancelabel#1`** (replace API key with magic-link auth) — already done; the codebase has had session-token auth since before this session, issue just never got closed.
- **`provenancelabel#7`** (edit label / add work URL) — duplicate of `registry#2`, filed in the wrong repo months earlier and never built. Closed in favor of the newer, better-scoped one.

## `/start` non-member flow: broken link fix + real unification
Walking the flow directly (not just reading it) turned up a concrete, undisclosed dead end: the "New + ChatGPT" one-off path linked to the same placeholder GPT, presented as fully live with no caveat — unlike `/install`'s version of the same link, which at least says "(URL TBD)."

Before patching just that, diffed the actual prompt text across tool branches: `midClaudePrompt`/`midChatGPTPrompt` and `doneClaudePrompt`/`doneChatGPTPrompt` were **byte-for-byte identical**. That evidence directly answered Shelton's question about collapsing tool-specific branching — the tool question was adding zero content value for those two stages, just duplicated maintenance surface (exactly how the ChatGPT link went stale while Claude's didn't).

Shipped both fixes together (`provenancelabel@4a1cdfa`):
- Collapsed mid/done from 3 tool-branches each down to 1 universal path each (9 total path combinations → 5)
- Kept the tool question only for "new" stage, where it's real (different setup links)
- Replaced the dead ChatGPT CTA with an honest, functional fallback (paste `plgen.txt` into a plain conversation)
- Verified with a headless-Chromium test confirming Q2 is skipped for mid/done, still shown for new, and the dead link is gone

Also closed the loop from the prior session's logo work: `provenancelabel#28`'s fix only reached `index.html`; the other 6 pages sharing the same nav were still text-only. Added the logo mark to all of them (`provenancelabel@7774c7b`).

## Non-member strategy: Word/Docs embedding and the API-as-infrastructure question
Shelton asked what's left to improve on the non-member side, plus two bigger strategic questions: how to actually embed in Word/Docs, and whether the API is a fundable/hireable story.

Findings, grounded in the actual code rather than assumption:
- `/embedded` already covers Word (via Copilot) and Google Docs (via Gemini) — but only as manual copy-paste-into-a-text-box guidance, not a native integration. Also caught the same registration-format bug there in a worse form: the page tells readers to "use the JSON format when registering" right next to a prompt that outputs the non-JSON block — self-contradictory, not just silent (`provenancelabel#31`, filed the session before, still open, now confirmed to span 3 prompt sites instead of the original 2).
- No native Word integration exists anywhere — not even a spike. The Google Docs Add-on (`apps-script/plgen-connector/`) is a real but unpublished, member-oriented prototype from the M1/M2 work.
- On the API/funding question: gave a grounded CPO-style take rather than pure enthusiasm — the API already exists as real, running endpoints, which is a genuine asset, but "an API exists" isn't itself a fundable story without a named integration partner. Recommended sequencing: fix the registration dead-end first (small, real), decide whether to finish+publish the Docs Add-on as the flagship integration second, write public API docs once there's a real integration to point at — not documentation-first for an unused API.

## Free vs. Membership homepage section — shipped, then removed
Built a new homepage section clearly separating "free forever" (the label format/standard itself) from member-only features (registration, permanent records, badges), framed as equal-but-different rather than a paywall ladder per Shelton's explicit direction. Caught and fixed a real contradiction while doing it — existing "What's next" copy a few lines above claimed "the label format, registry, and badges are done and free forever," which is false; registry and badges are member-only. Built as a reusable `.tier-compare` component in `shared.css` rather than inlined, reusing the already-corrected `/join` feature lists rather than inventing a fourth place for the same facts to drift.

Shelton reviewed it live, said it was accurate but he didn't like it, asked for removal. Removed the section and its CSS component entirely (not just hidden) so no dead code was left behind (`provenancelabel@4671221`). The "What's next" copy correction stayed — that was independently worth keeping regardless of the section's fate.

## Label Confidence: explained, then a CPO-level transparency decision
Shelton pasted a real `LABEL CONFIDENCE` panel and asked whether it's explained anywhere and how it's calculated. It wasn't — the only "documentation" was a code comment pointing at a GitHub issue (`#24`) no visitor would ever find. Read the actual spec issue and the shipped `confidence.js` side by side, and verified the explanation against Shelton's exact pasted numbers by hand (0.450 recomputed exactly from the visible signal values — confirms the mechanism understanding was correct, not guessed). Surfaced a real finding in the process: **4 of the 8 signals (S1 capped, S3/S6/S7 permanently neutral) can't move beyond partial credit today** — the instrumentation to measure them for real doesn't exist yet on any AI platform, so no label can currently score much above the mid-range regardless of how legitimate the underlying work is.

Shelton then asked whether to document the signals on `/spec` without revealing weights, for proprietary/IP reasons — explicitly citing wanting a defensible position to sell and not wanting to hand a blueprint to a platform like Substack. Flagged a real tension before building anything: a prior session (2026-07-13, logged in `project-plgen-blackbox-revision`) had set a *stricter* policy — black-box the signal taxonomy itself, not just the weights. Rather than silently picking a side, gave an explicit CPO-framed recommendation reasoned from two separated threats (user-gaming vs. platform-replication), with a concrete legal point: the general signal categories likely aren't independently protectable as trade secret regardless (not novel), while the actual calibration (weights, thresholds) is — and platform-level replication risk isn't meaningfully changed by naming signal categories either way, since a well-resourced competitor derives their own calibration from their own data regardless of what's published. Recommended publishing signal names/symbols, keeping weights and thresholds fully black-box. Shelton agreed.

Built and shipped both sides of it:
- **`provenancelabel@2e414b5`** — new `/spec#confidence` section: all 8 signal names and plain-language descriptions, ✓/△/✗ meanings, an explicit note that no weights/thresholds are published and why.
- **`registry@2a60670`** — added a "What do these mean? →" link on every label page's confidence panel, pointing to the new section.

Verified both live in production after deploy — section renders correctly, link resolves, styling consistent with the rest of the confidence card.

## Open items
- `provenancelabel#31` — registration format dead-end (`@provenance` block vs. JSON), now confirmed to affect `/embedded` too, not just `/start`. Still not fixed — the highest-leverage remaining non-member issue.
- `registry#2`, `#3` — no edit path for registered labels; incomplete registration preview. Not built.
- `provenancelabel#30` — Free/Member pricing card visual imbalance (from the 2026-08-07 session). Still open.
- Word integration — no spike exists; a from-scratch platform decision, not an extension of the Docs work.
- Google Docs Add-on — real but unpublished; the natural next step if pursuing the "API as fundable infrastructure" direction, since it's the first concrete answer to "who's building on this."
- `express-rate-limit`/`trust proxy` misconfiguration on the registry Droplet — still open, carried since 2026-08-07.
- Font-fidelity gap in `nutrition-label-png.js`'s `serif` rendering on the production server — still open, noticed not fixed.
- Sales one-sheet copy — still not drafted.
- Whether "What does it mean to reset?" was actually submitted through the dashboard isn't confirmed in-session — the JSON was finalized and handed off, and Shelton's very next message described the registration preview's behavior, which suggests he went through with it, but no PL-ID was reported back.
