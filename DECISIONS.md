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

## 2026-04-17
- CommonJS (`module.exports`) is the established pattern for all Vercel serverless functions in this project
- API keys are read exclusively from `process.env` — never hardcoded in any file, never committed
- Native `fetch` used in serverless functions (Node 18+ / Vercel runtime) — no external HTTP packages
- Weather forecast filtered server-side: 3 daily summaries returned, today excluded, high/low computed from all 3-hour intervals per day
- `ai_weather_city` localStorage key stores manual city override as a plain string; absent = use geolocation
