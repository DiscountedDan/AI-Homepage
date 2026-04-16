# Architecture Decision Record
A log of major architectural and design decisions made over the life of this project.

---

## 2026-04-10
- Edit Review uses a separate modal (not the existing review modal) to keep the "mark complete" flow and "edit review" flow independent
- Editing a completed card's category updates stored data only — card stays in Completed section and does not revert to open
- Settings dropdown closes on outside click via a single global document listener rather than per-card listeners
- All modal JS follows the same static HTML + `.hidden` class pattern established in v2
- Scratchpad widget uses `position: absolute` inside a `position: relative` header — keeps existing centered layout fully intact
- Scratchpad expanded state is a floating panel (z-index 150), not a full-screen modal overlay
- Scratchpad stores rich text as innerHTML in `ai_scratchpad`; uses `contenteditable` + `document.execCommand` for formatting (no external libraries)
- Font sizing uses `document.execCommand('fontSize')` with 7 steps mapped to rem values via CSS — chosen over h1/h2/h3 heading levels for continuous feel
- Per-card notes stored in `ai_card_notes` keyed by resource `id` to survive card edits; cleaned up on card delete

## 2026-04-16
- CommonJS (`module.exports`) chosen over ESM for Vercel serverless functions — safer default for Node runtime
- `/api` folder established as the Vercel serverless function convention; each file becomes a route
