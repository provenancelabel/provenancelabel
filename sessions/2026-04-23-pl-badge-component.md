# Session: PL Badge Component
**Date:** 2026-04-23
**Repos touched:** `provenancelabel` (static site), `provenancelabel-registry` (backend)

## What we built
A reusable, copyable PL badge component for members to share their registered provenance label link.

## Changes

### provenancelabel — `shared.css`
- Added `.pl-mark` — superscript "PL" sigil, bold, `#c8481a` accent, `0.7em` / `vertical-align: super`
- Added `.pl-badge` — inline-flex chip with `var(--gray-light)` background, `0.5px` border, `border-radius: 3px`, accent hover, green copied state
- Added `.pl-badge--small` and `.pl-badge--large` size modifiers

### provenancelabel — `register/index.html`
- Added "Share Badge" section to the registration success panel
- Added `copyPlLink(el, url)` function — copies URL, shows "Copied!" for 1.6s, resets from URL

### provenancelabel-registry — `src/routes/viewer.js`
- Injected `.pl-mark` / `.pl-badge` CSS into the inline style block
- Added "Share" section above "Embed this badge" on the label viewer page (`/PL-XXXXXX`)
- Added `copyPlLink` to the inline script

## Deploy
Registry is hosted on a DigitalOcean Droplet. Deploy process:
1. Commit locally, push to `github.com/provenancelabel/registry` (Shelton pushes — private repo)
2. On Droplet: `cd /var/www/plgen-registry && git stash && git pull origin main && pm2 restart plgen-registry`

## Design decisions
- `.pl-mark` is a superscript mark (like a trademark symbol), not just styled text
- Badge uses `var(--gray-light)` bg at rest, flips to `var(--white)` on hover
- `#2a7a4b` success green is hardcoded — matches existing `.copy-btn.copied` pattern; flagged for CSS variable extraction in a follow-up
- `copyPlLink` derives the display number from the URL on reset (no separate state needed)
