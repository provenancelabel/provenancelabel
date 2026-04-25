# Session: Deploy, Issues & Housekeeping
**Date:** 2026-04-25
**Type:** Deploy / housekeeping / product discussion

## What we did

### PL badge confirmed live
- Resolved DigitalOcean Droplet deploy — registry server requires manual pull + restart (no auto-deploy on push)
- Root cause of deploy failure: local changes on Droplet conflicted with git pull; resolved with `git stash` before pull
- Badge now live at `registry.provenancelabel.org/PL-XXXXXX` under "Share" section

### Droplet deploy process documented
Full process locked in (also saved to Claude memory):
1. Commit locally, Shelton pushes to `github.com/provenancelabel/registry` (private repo — Claude cannot push)
2. On Droplet: `cd /var/www/plgen-registry && git stash && git pull origin main && pm2 restart plgen-registry`

### GitHub issues created
- **Issue #25** — Enrich PL badge copy payload (logomark + URL): options include text+URL string, embed HTML, or rich clipboard with HTML fallback
- **Issue #26** — Google Docs sidebar v1 with Gemini-first approach (updated with Gemini angle and in-chat prompting strategy)

### Sessions folder established
- Created `sessions/` folder in repo to track work going forward
- Committed 2026-04-23 (PL badge component) and 2026-04-24 (Google Docs sidebar concept) notes

## Notes
- Registry is hosted on a DigitalOcean Droplet, fork mode, pm2 process name `plgen-registry`, app at `/var/www/plgen-registry`
- `provenancelabel/registry` is a private GitHub repo — all pushes must be done by Shelton
