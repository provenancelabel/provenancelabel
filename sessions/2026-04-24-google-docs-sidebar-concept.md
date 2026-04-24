# Session: Google Docs Sidebar Concept
**Date:** 2026-04-24
**Type:** Strategy / Product discussion
**GitHub Issue:** #26

## Context
Discussion about expanding PL beyond point-in-time registration into a continuous provenance tracking tool embedded in the writer's actual workflow.

## Key insight
Serious writers — students, journalists, researchers — are not writing in ChatGPT or Claude. They write in word processors and use AI as a side tool. PL needs to meet them there.

## Market framing
- **Google Docs** = students, startups → faster to build for, fewer corporate hurdles
- **Microsoft Word** = corporate, scientific → future phase
- **Google Gemini** = natively embedded in Docs → the most invisible and undisclosed AI use case, making it the strongest v1 target

## The Gemini angle
Gemini is deeply integrated into Docs (Help me write, inline suggestions, side panel). Google's incentive is to keep writers in-ecosystem. A PL sidebar tracking Gemini usage is:
- More technically accessible than intercepting off-screen paste
- A stronger pitch — inline AI assistance is the hardest type of use to disclose
- Frameable as a transparency/trust tool, not a watchdog — academic institutions and publishers mandating disclosure give Google a reason to allow or partner on it

## v1 Concept
1. Sidebar launches when a Google Doc is opened
2. Writer declares session intent (Gemini, off-screen AI, or both)
3. Gemini activity tracked inline (subject to what Apps Script exposes)
4. Paste events prompt a lightweight "was this AI?" log for off-screen use
5. For writers in ChatGPT/Claude directly — provide a pre-session prompt to track provenance in-chat (extends existing ai-prompt infrastructure)
6. On finish: pre-fills PL registration form, one-click register, inserts badge in doc footer

## Critical open question
What Gemini events does Apps Script actually expose to add-ons? This needs to be answered before any build starts — it determines how much is automatable vs. self-reported.

## Tech approach
Google Workspace Add-on (Apps Script / JavaScript). Calls existing `registry.provenancelabel.org` API.

## Next steps
- Research Apps Script access to Gemini panel events
- Prototype sidebar UI concept
- Consider whether Google partnership angle is worth pursuing early
