# PLGen Custom GPT — Build Notes

**Maintained by:** Shelton Davis / Empathy Lab
**Last updated:** 2026-04-02
**Live GPT:** [link TBD — add after deployment]
**Standard:** provenancelabel.org

---

## What This Is

The PLGen Custom GPT is a ChatGPT-native deployment of the Provenance Label Generator. It runs inside ChatGPT as a Custom GPT and guides users through a three-phase session — open, observe, generate — producing a Provenance Label at the end of any AI-assisted work session.

It is one of several deployment surfaces for the PLGen standard. Others include:
- `plgen.txt` — the open, platform-agnostic prompt (paste anywhere)
- Claude Project instructions — Claude-specific deployment
- provenancelabel.org/register — the web registration form

---

## Why ChatGPT Custom GPT

ChatGPT holds ~55–65% of US AI assistant market share. Building here reaches the largest possible audience first.

More importantly: ChatGPT Custom GPTs with **Actions** (OpenAPI spec + auth) can make outbound API calls from within a conversation. This means `plgen register` can eventually fire `POST /api/labels/register` directly — no web form, no copy/paste, fully in-flow. This is not yet possible in Claude without MCP, making the Custom GPT the fastest path to true end-to-end in-conversation registration.

---

## Session Model

PLGen works in three phases:

| Phase | Trigger | What happens |
|-------|---------|--------------|
| OPEN | `plgen init` | Session opens. Tool, date, author auto-populated. No questions. |
| OBSERVE | (silent) | GPT tracks human vs. AI contributions throughout the work. |
| CLOSE | `plgen generate` | Label generated from observed session. Minimal confirmation only. |

After close, `plgen register` bridges the label to the official registry.

---

## Commands

| Command | Description |
|---------|-------------|
| `plgen init` | Open a session |
| `plgen generate` | Close session and output the label |
| `plgen register` | Register the label at provenancelabel.org |
| `plgen status` | Show current session tracking state |
| `plgen validate` | Check a manually written label for completeness |
| `plgen formats` | Show Short Badge, Long Block, and JSON output options |
| `plgen help` | List commands and explain the standard |
| `plgen cancel` | Close session without generating |

---

## Registration Flow (Current State)

In-conversation API calls are not yet configured (Actions not wired). The current `plgen register` flow is:

1. GPT asks: member or guest?
2. GPT outputs the label as JSON
3. User visits `provenancelabel.org/register`, signs in or submits as guest, pastes JSON
4. Registry records the label and returns a permanent URL

This is intentionally minimal — one copy/paste, one web visit. Not frictionless, but functional.

---

## Registration Flow (Planned — Actions)

When ChatGPT Actions are configured with the PLGen OpenAPI spec:

1. `plgen register` fires `POST /api/labels/register` directly from the conversation
2. Auth via session code (see Issue #2 — `/init` page) or OAuth
3. Registry returns permanent label URL, displayed inline
4. No web form visit required

This requires:
- Issue #1: Magic link auth + session tokens on the backend
- Issue #2: `/init` page for session code generation
- Issue #3: OpenAPI spec + Actions configuration in the Custom GPT

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | ~2026-02 | Initial Claude Project instructions — API key auth, attempted POST to registry |
| v2 | 2026-03 | Full Custom GPT rewrite — three-phase session model, clean commands, no API key |
| v3 | 2026-04-02 | Added `plgen register` command, registration nudge at end of `plgen generate`, member vs. guest path |

---

## Files

| File | Description |
|------|-------------|
| `system-prompt-v3.md` | Current live instructions — paste into ChatGPT > Create a GPT > Instructions |
| `system-prompt-v2.md` | Previous version — archived for reference |
| `README.md` | This file |

---

## Related Issues

| Issue | Title |
|-------|-------|
| #1 | Auth: replace API key with magic link + session tokens |
| #2 | New page: /init — email-triggered PLGen session code |
| #3 | ChatGPT Custom GPT with Actions — in-conversation ~plgen register~ |
| #4 | MCP server — Claude in-conversation registration (long-term) |

---

## Notes

- The GPT is a "wildfire deployment" — freely shareable, open standard, no account required to use
- Registration is optional. Labels are valid without it. The registry adds permanence and attribution.
- The `plgen register` command is designed to be forwards-compatible — the same command will work identically once Actions are wired; only the backend behavior changes
