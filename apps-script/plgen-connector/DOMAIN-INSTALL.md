# Installing PLGen Writing Check domain-wide

This gets the Add-on onto a professor's own account so it works on *any*
Google Doc they open — not just one document manually paired via a Test
Deployment (which is where things stand today).

**Important**: everything below has to be done by someone whose Google
account belongs to the professor's own Workspace organization — their IT
contact, or the professor themselves if they have admin rights. A GCP
project created under any other account (including the developer's) can
never be set to "Internal" for this domain; "Internal" only exists for,
and only grants access within, the organization that owns the project.

## What the developer hands over
The three files in this directory:
- `Code.gs`
- `Sidebar.html`
- `appsscript.json`

Nothing else is needed — no shared credentials, no access to another
account.

## What the professor's IT/admin does, on their own domain

1. **Create a new Apps Script project.** Go to
   [script.google.com](https://script.google.com), New Project. Paste in
   `Code.gs` and `Sidebar.html`. For `appsscript.json`: click the gear icon
   (Project Settings) → check "Show `appsscript.json` manifest file in
   editor" → it'll appear in the file list → paste its contents in too.

2. **Link a real Google Cloud project.** Still in Project Settings, under
   "Google Cloud Platform (GCP) Project," click "Change project." If there
   isn't already a GCP project to use, create one first at
   [console.cloud.google.com](https://console.cloud.google.com) (any name;
   note its **Project Number**, not the Project ID, from the dashboard) —
   then paste that number into the Apps Script dialog.

3. **Set the OAuth consent screen to Internal.** In that GCP project, go to
   APIs & Services → OAuth consent screen → User Type → **Internal**. If
   Internal isn't offered as an option, the account isn't part of a
   Workspace organization with Cloud Identity — that's the signal something
   is set up under the wrong account.

4. **Cut a real Deployment** (not a Test Deployment — those only pair with
   one document at a time, which is the exact limitation this is meant to
   remove). In the Apps Script editor: Deploy → New deployment → type
   "Add-on." This produces a Deployment ID.

5. **Install it via the Admin console.** Go to
   [admin.google.com](https://admin.google.com) → Apps → Google Workspace
   Marketplace apps → add a private/custom app using the Deployment ID from
   step 4. Scope the install to just the professor's own account or OU
   rather than the whole domain — this is a one-person pilot, no reason to
   push it wider yet.

6. **Verify.** Open any Google Doc under that account — "Check Writing
   Pattern" should now appear under Extensions, with no per-document setup
   needed.

Google's admin console UI shifts around occasionally, so exact menu
wording above may drift — the sequence (private app install by Deployment
ID, scoped to a user/OU) is the part that should hold.

## Why this avoids Google's app-review process
Internal apps are exempt from OAuth verification and CASA assessment
entirely — that exemption is *why* Internal, not a Marketplace listing, was
chosen for this pilot. See `project-plgen-addon-architecture` (memory) for
the fuller M1–M3 rollout reasoning.
