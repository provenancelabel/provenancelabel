# Session: Personal-Pilot Install Path, Two Real Bugs Fixed, and the Scrap Decision

**Date:** 2026-08-21 (second session of the day — continues `2026-08-21-first-live-test-and-marker-fix.md`)
**Type:** Research / build / strategic reckoning

## Context
Picked up from the prior session's open items. Shelton pivoted away from the domain-wide/IT-contact install plan (`DOMAIN-INSTALL.md`, written but not yet handed off) toward getting the Add-on into a pilot professor's own personal Google account directly, with a real (free) membership so they experience the full cycle and give direct feedback.

## Install-mechanism research
Before building anything, researched how a personal/other-domain account can actually run this Add-on without domain admin or Google Marketplace review:
- The account-wide "Install" option under Apps Script's Test Deployments **requires the test user to be in the same Google Workspace domain as the script owner** — confirmed via Google's own docs. Rules out personal Gmail or a different institution's domain.
- Private Marketplace publishing avoids Google review but still targets install *by domain* — the professor's own admin would still need to install it, reintroducing the IT-contact dependency being avoided.
- Public Marketplace publishing works for anyone (personal Gmail included) but requires Google review — deliberately out of scope for now (see "Public beta" discussion below).
- **The path that actually works**: distribute as a **template Google Doc with the script bound to it**, shared via "make a copy." A copy is a wholly independent, new Apps Script project owned by whoever copied it — no domain match, no admin, no review. The one real friction point is unavoidable: first use triggers Google's "unverified app" warning (Advanced → Go to [app] (unsafe)), since this isn't a published add-on. Decided to name that warning explicitly in onboarding copy rather than try to engineer around it.

## Public beta: upside/downside discussion
Shelton asked directly. Laid out the tradeoff and recommended against it for now — the deciding factor wasn't cost/effort, it was that **student data privacy (SDPC/NDPA) research is still an open, unresolved item** (see [[project-plgen-open-items]]), and going public removes any control over who installs it, including K-12 users. Recommended sequencing: personal pilot first (cheap, reversible, one consenting adult), public Marketplace listing only after pilot feedback and the privacy research are both actually done — not before.

## Built: `googleinstall/` landing page
Standalone page at `googleinstall/index.html`, deliberately **not linked from nav/footer/anywhere else** in the site (confirmed via grep — zero references). Follows the existing page-per-directory + `shared.css` convention. Content: private-pilot notice, four numbered steps (copy → open Provenance from the menu → the unverified-app warning named explicitly → what the sidebar buttons do), closes with a direct ask for feedback.

## Built: Sidebar branding
Added PL branding to `Sidebar.html` — header lockup (logo + wordmark pulled from `provenancelabel.org/graphics/`), switched primary actions to the site's `--accent` burnt-orange, mono type on headers, small credit footer. Kept it light — didn't fight Google's native Docs chrome.

## clasp setup + template doc
- Installed `clasp` via `npx @google/clasp` (skipped global install — hit an `EACCES` permission error, npx avoided needing sudo).
- Shelton ran `clasp login` himself (browser OAuth, can't be done from this session) and enabled the Apps Script API toggle at `script.google.com/home/usersettings` (a separate one-time step from login, tripped up `clasp create` on the first attempt).
- `clasp create --type docs` created a real template Doc + bound script (doc id `1-HGu9q6-f0jugUen_9M10Xxl1E6qRVQd7_bgaFI_dJc`). Pushed the real `Code.gs`/`Sidebar.html`/`appsscript.json` over the generated placeholder.
- Wired `googleinstall/index.html`'s "Get Your Copy" button to Google's one-click copy-URL trick (`.../copy` suffix) pointing at that doc.
- `.clasp.json` committed into `apps-script/plgen-connector/` so future pushes work from this checkout.

### Real bug caught before it shipped: `createAddonMenu()` vs `createMenu()`
`Code.gs`'s `onOpen()` used `createAddonMenu()` — the formal Add-on-framework menu call, which (per the same Test-Deployment research above) isn't guaranteed to show up without deployment ceremony even for a script's own owner. That would have silently broken the entire "copy the doc, click the menu" pilot plan. Switched to plain `createMenu('Provenance')` (renamed from "PLGen" per Shelton's call — reads as less techie) — the classic bound-script menu, zero deployment dependency by design. **Confirmed live**: Shelton opened the template doc fresh, the menu appeared with no Test Deployment pairing, validating the whole distribution mechanism.

## Paste-detection: two real bugs found and fixed, one structural limit found and NOT fixable
Shelton reported a real Claude-paste not getting flagged by "Check This Document." Investigated by reading `Code.gs` alongside the actual `plgen-registry` source (`src/paste-detection.js`, `src/routes/score.js`) rather than guessing.

**Bug 1 — fixed**: `buildRevisionSummary()` fetched only `pageSize: 25` revisions with no pagination, and sized only the **first 15 in array order**. `Drive.Revisions.list` has no `orderBy` param and returns oldest-first (confirmed via Google's own docs) — so on a doc with real history, the code was structurally biased toward sizing *old* revisions and leaving *recent* ones (including whatever just got pasted) with `size_chars: null`, which `analyzeRevisions()` on the registry side **drops entirely**, not just treats as low-confidence. Fixed: `pageSize: 200` (matches the registry's own `MAX_REVISIONS` defensive cap) and size the **last** N revisions instead of the first N.

First retest still failed — turned out to be testing on an unrelated, much older doc (`docId` traced to the original 2026-07-13 M1 spike doc via its revision timestamps) that never received any of this session's pushes, not a fix failure. Retested on the actual template doc.

**Bug 2 — fixed**: added temporary `debug_size_status` diagnostics (`no_export_link` / `fetch:<code>`) to `Code.gs` to stop guessing. Retest on the correct doc showed all three revisions sized cleanly (`fetch:200`) — sizing itself works.

**Structural limit — not a bug, not fixable via code**: with real sized data, the math showed why the paste still wasn't flagged:

| Transition | Δ chars | Δ time | Rate |
|---|---|---|---|
| rev 1→2 | 1,613 | 78.3 min | ~20.6 chars/min |
| rev 2→3 | 2,044 | 39.4 min | ~51.9 chars/min |

Both far under the 300 chars/min threshold. Root cause: Google Docs only checkpointed 3 revisions across ~2 hours. The paste itself was almost certainly near-instant, but the rate calculation averages it across the *entire* multi-minute gap between checkpoints, diluting a fast paste's signature below threshold whenever normal typing shares the same window. No lever fixes this from our side — Drive's checkpoint cadence isn't controllable via the public API, and lowering the rate threshold to compensate reopens the exact false-positive failure mode already hit once before (the 543-chars/45-min incident that's the reason this is rate-based, not absolute-count-based, in the first place). This is the same limitation `paste-detection.js`'s own top comment already named as a risk, now empirically confirmed with real numbers rather than theoretical.

`debug_size_status` diagnostic field is still live in the payload — harmless, but flagged to strip before this goes near a real pilot tester.

## The reckoning: self-report's real limits under adversarial incentive
With the Writing Pattern Check shown unreliable, Shelton asked the harder question directly: what does self-report alone actually protect against, if a student under grade pressure will just misreport the split? Worked through it honestly rather than defending the existing plan:

- **Self-report has ~no power against a motivated liar.** A professor who genuinely needs certainty will bypass this entirely and use a commercial AI detector instead — which was the whole reason the Writing Pattern Check existed as a counterweight. With that counterweight shown unreliable, the professor-facing "help evaluate whether a student used AI honestly" framing isn't something this tool can actually deliver on.
- Named this as the real integrity risk Shelton was pointing at: **continuing to hand this to a professor under an academic-integrity framing, knowing the detection layer can't back it up, is itself the compromise** — not a hypothetical one.
- What self-report *does* have real value for, distinct from "catch cheaters": a low-friction path for someone who already wants to disclose honestly; a norm-shaping/culture tool rather than an enforcement one; a record that turns a *later-discovered* lie into separately provable falsification, on top of whatever else surfaces it. None of that is adversarial verification for a skeptical evaluator — that mismatch is the actual problem, not an execution bug.

## Decision: scrap this attempt, look for a different direction
Shelton's call: **shelve the professor/academic-integrity pilot for now.** New direction not yet defined, but the stated criterion for it: find users who need this tool **to do their job and protect their reputation** — i.e., buy-in-driven adoption from people motivated to disclose honestly for their own sake, not a tool aimed at verifying people who don't want to be verified. Who exactly that audience is (professional writers? journalists? some other reputation-accountable role?) is open — not decided this session, worth treating as a real open question rather than assumed.

## What still stands, technically, regardless of the pivot
The bug fixes and infra from this session are real and not being thrown out:
- `createMenu()` fix, revision-sizing fix, and the diagnostic instrumentation are genuine correctness improvements to the Add-on, independent of who it eventually ships to.
- clasp is now a working, repo-tracked toolchain (`apps-script/plgen-connector/.clasp.json`) for pushing to a real Google Doc + bound script — reusable whenever the next direction needs a live target to test against.
- `googleinstall/` (landing page) and the Sidebar branding are built and standalone/unlinked — dormant until there's an audience to point them at again, not deleted.

## Open items
- **New target audience for the Add-on/self-report approach — undefined, needs its own discovery pass** before building anything further in this direction. Top open item now.
- Professor pilot: paused, not resumed. `DOMAIN-INSTALL.md` handoff stays shelved.
- `debug_size_status` diagnostic field in `Code.gs` — strip once nobody needs it for further paste-detection debugging.
- Real, reliable AI-involvement detection in a Google Doc remains an unsolved, probably-hard problem (would likely need content-level diffing, its own scope/privacy decision) — explicitly not something to force into whatever ships next just to feel complete.
- `registry#4` (Confidence scoring wiring), tier decision, `provenancelabel#32` (clasp — now actually done, worth closing), student data privacy research: all still open from before, now lower urgency pending the new-direction decision.
