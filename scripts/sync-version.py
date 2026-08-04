#!/usr/bin/env python3
"""
Sync the Provenance Label standard version across every live file that
declares it, using VERSION (repo root) as the single source of truth.

Usage:
    python3 scripts/sync-version.py          # rewrite files to match VERSION
    python3 scripts/sync-version.py --check  # exit 1 if any file is out of sync (no writes)

What this deliberately does NOT touch, and why:
  - spec/index.html's Changelog table (<td>v1.0</td> etc.) — that's a
    historical record, not a live declaration. Never rewrite history.
  - custom-gpt/system-prompt-v2.md — an archived prompt version frozen at
    whatever the standard version was when it was written.
  - Any reference to the PLGen *tool/prompt* version (e.g. "System Prompt
    v3.3", "Changes from v3.1") — that's a separate versioning scheme from
    the PL *standard* version this script manages. Patterns below are
    anchored to PL-standard-specific phrasing so they can't collide with it.
  - Prose that merely mentions version numbers as an example (e.g. index.html's
    FAQ: "version it (v1.1, v2.0)") — excluded by pattern specificity, not by
    special-casing the file.

Live files this script manages:
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / "VERSION"

TARGET_FILES = [
    "README.md",
    "index.html",
    "spec/index.html",
    "install/index.html",
    "join/index.html",
    "start/index.html",
    "embedded/index.html",
    "plgen.txt",
    "custom-gpt/system-prompt-v3.md",
]

# Each pattern captures the version number in group 2 so replacement can
# swap it in place without disturbing surrounding text/formatting.
# Patterns are anchored to specific PL-standard-declaration contexts only.
PATTERNS = [
    re.compile(r'(PROVENANCE LABEL(?: STANDARD)? v)(\d+\.\d+)'),
    re.compile(r'(Provenance Label v)(\d+\.\d+)(?!\d)'),
    re.compile(r'(PL v)(\d+\.\d+)(?= \|)'),
    re.compile(r'(Open Standard · v)(\d+\.\d+)(?= ·)'),
    re.compile(r'(provenancelabel\.org v)(\d+\.\d+)(?= standard)'),
    re.compile(r'(<span>Spec v)(\d+\.\d+)(?=</span>)'),
    re.compile(r'(<span>v)(\d+\.\d+)(?=</span>)'),
    re.compile(r'(<span class="label-val">v)(\d+\.\d+)(?=</span>)'),
    re.compile(r'(## The Standard \(v)(\d+\.\d+)(?=\))'),
]


def sync(check_only: bool) -> int:
    version = VERSION_FILE.read_text().strip()
    drift = False

    for rel_path in TARGET_FILES:
        path = ROOT / rel_path
        original = path.read_text()
        updated = original
        for pattern in PATTERNS:
            updated = pattern.sub(lambda m: m.group(1) + version, updated)

        if updated != original:
            drift = True
            if check_only:
                print(f"DRIFT  {rel_path} does not match VERSION ({version})")
            else:
                path.write_text(updated)
                print(f"synced {rel_path} -> v{version}")

    if not drift:
        print(f"All files already match VERSION ({version}). Nothing to do.")
        return 0

    if check_only and drift:
        print(
            f"\nOne or more files disagree with VERSION ({version}).\n"
            f"Run `python3 scripts/sync-version.py` locally and commit the result."
        )
        return 1

    print(
        f"\nDone. If v{version} is a new release, remember to add a row to the "
        f"Changelog table in spec/index.html — that part is manual by design."
    )
    return 0


if __name__ == "__main__":
    check_only = "--check" in sys.argv
    sys.exit(sync(check_only))
