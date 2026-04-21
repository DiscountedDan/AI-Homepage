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

## 2026-04-21
- Multi-page architecture uses separate HTML files with full-page loads and standard `<a>` navigation — no SPA routing, no hash routing
- Nav bar and scratchpad widget code is intentionally duplicated between `index.html` and `news.html` — accepted tradeoff to avoid a build step or runtime injection; future edits must touch both files
- Weather widget is homepage-only and is not duplicated to the nav or any other page
- `.page-wrap` wrapper div carries the body content padding, allowing the nav to be a direct child of `body` and span full viewport width without negative margins
- Active page indicator in the nav is hardcoded per file (not JS-detected), consistent with the per-page duplication approach
- `#scratchpad-widget` changed from `position: absolute` to `position: relative` when moved into the nav; the floating panel's `position: absolute; top: calc(100% + 6px)` positioning behavior is unchanged
- Nav `z-index: 100` with `position: sticky` creates a stacking context, scoping the scratchpad panel's `z-index: 150` locally; for cross-context comparisons the panel participates at root level 100 — modals (z-100, later in DOM) render above it, weather panel (root z-150 via non-stacking header) renders above nav
- Secondary pages carry only the CSS they actually use: reset, `:root` tokens, `body`, nav, scratchpad, footer, and page-specific styles — homepage-only CSS (cards, modals, weather, filter bar) is not duplicated to other pages

## 2026-04-21 (v5b-2)
- `rss-parser@^3.13.0` chosen over hand-rolled XML parsing for the news feed — first npm dependency in the project; `package.json` introduced at repo root
- `Promise.allSettled` used in `api/news.js` (contrast with `Promise.all` in `api/weather.js`) — multi-source aggregation must be fault-tolerant so one failing feed doesn't break the whole response
- Google AI short-string filter: `contentSnippet` ≤ 30 chars for the `googleai` feed is treated as empty — avoids category labels (e.g. "Generative AI") rendering as article summaries
- Backend owns all summary sanitization (HTML strip, entity decode, whitespace collapse, truncation); frontend receives clean strings and renders or hides based on truthiness
- Grouped-by-source layout within Lab Announcements: OpenAI block always first, Google AI block second — guarantees both labs are represented regardless of publishing cadence mismatch
- `api/news.js` response contract: `items` key is always present (`[]` on error, never omitted) — frontend can safely access `.items.length` without null checks
