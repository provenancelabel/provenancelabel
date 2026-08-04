# Provenance Label

**A nutrition label for AI-assisted content**

An open standard for transparent disclosure of AI collaboration in creative work.

## What is this?

The Provenance Label is a simple, standardized way to show how human and AI worked together on content. Like nutrition labels for food, it provides transparency without judgment.

## The Standard (v1.2)
```
PROVENANCE LABEL v1.2
Created: YYYY-MM-DD HH:MM UTC
Updated: YYYY-MM-DD HH:MM UTC (optional)
Edited: Yes/No

Human contribution: [0-100%]
AI contribution: [0-100%]
AI models used: [model names]

Process notes: [1-2 sentence description]

Adjustments: [if Edited=Yes, explain changes]
```

## How to Use

1. **Start your AI collaboration** by saying: "Let's use Provenance Label standards."
2. **Generate the label** when done: "Generate the Provenance Label"
3. **Add it to your work** (bottom of posts, README, artist statements, etc.)

Or use the [Label Generator](https://provenance-label.github.io/provenance-label/#standard) on the website.

## Why This Exists

- AI collaboration is here to stay
- Transparency builds trust
- Readers/users deserve to know
- Creators need a simple way to disclose

**Not anti-AI. Pro-honesty.**

## Examples

### Blog Post
```
PROVENANCE LABEL v1.2
Created: 2026-02-10 14:30 UTC
Edited: No

Human contribution: 30%
AI contribution: 70%
AI models used: Claude Sonnet 4.5

Process notes: Human provided outline and key arguments.
AI drafted full post. Human edited for voice and cut 40%.
```

### Code Documentation
```
PROVENANCE LABEL v1.2
Created: 2026-02-09 22:15 UTC
Edited: No

Human contribution: 85%
AI contribution: 15%
AI models used: GitHub Copilot

Process notes: Human wrote all logic. AI autocompleted
boilerplate. Human reviewed and accepted 60% of suggestions.
```

## Versioning

The standard's version lives in one place: [`VERSION`](VERSION). Every other
reference to it (site pages, `plgen.txt`, the Custom GPT prompt) is kept in
sync from that file — never edit a version string directly in those files.

To bump the version:
```
echo "1.3" > VERSION
python3 scripts/sync-version.py
```
Review the diff, add a row to the Changelog table in [`spec/index.html`](spec/index.html)
(that part is manual — a version bump should always say what changed), and commit.
CI (`.github/workflows/version-check.yml` and the deploy workflow) fails the
build if any file drifts from `VERSION`, so a bump can't merge or deploy half-applied.

## Contributing

This is an open standard. Contributions welcome!

- Suggest improvements via [Issues](https://github.com/provenance-label/provenance-label/issues)
- Submit changes via Pull Requests
- Share examples and use cases
- Help build tools and integrations

## License

- **Standard (text)**: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Code (website/generator)**: [MIT License](LICENSE)

## About

Created by [Shelton Davis](https://github.com/shelton) in February 2026.

Website: [provenancelabel.org](http://www.provenancelabel.org)
```

---

## 3. LICENSE (MIT for code)
```
MIT License

Copyright (c) 2026 Provenance Label / Shelton Davis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 4. STANDARD.txt (For distribution)
```
PROVENANCE LABEL STANDARD v1.2

Released: February 2026
License: Creative Commons Attribution 4.0 International (CC BY 4.0)

FORMAT:

PROVENANCE LABEL v1.2
Created: YYYY-MM-DD HH:MM UTC
Updated: YYYY-MM-DD HH:MM UTC (optional)
Edited: Yes/No

Human contribution: [0-100%]
AI contribution: [0-100%]
AI models used: [model names]

Process notes: [1-2 sentence description of collaboration]

Adjustments: [if Edited=Yes, explain what changed]

REQUIRED FIELDS:
- Created timestamp (UTC)
- Human contribution percentage
- AI contribution percentage
- Process notes
- Edited status

OPTIONAL FIELDS:
- Updated timestamp
- AI models used
- Adjustments (required if Edited=Yes)

RULES:
- AI calculates, human approves or adjusts
- Percentages should add to 100%
- Process notes in plain language
- Free to use, modify, distribute with attribution

MORE INFO:
https://provenancelabel.com
https://github.com/provenancelabel/provenancelabel
