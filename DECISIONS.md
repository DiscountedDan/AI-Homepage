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
> **Superseded by 2026-07-23 (v6).** The multi-page architecture below was replaced by the single-file four-tab shell. Entries kept for historical record; the positioning/stacking notes (`#scratchpad-widget`, floating panel) still describe current behavior.

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

## 2026-07-21 (v5c — audit fixes)
- RSS parser timeout set to 5s (not Vercel's ~10s ceiling) — leaves headroom for parsing/response time after the network call returns, so the function itself never gets killed mid-response
- RSS link validation done server-side in `api/news.js`, not the frontend — keeps the API response contract itself trustworthy (every link in the JSON is guaranteed safe) rather than relying on every consumer to re-validate
- `migrate.html` import validation is all-or-nothing: any single invalid key aborts before any `localStorage.setItem` call runs — prevents a half-imported, internally inconsistent state that's harder to diagnose than a clean failure
- CSP / security headers deferred as a separate discussion item — a meaningful `Content-Security-Policy` conflicts with the current inline-script, no-build-step architecture and needs a dedicated design pass, not a quick fix
- `npm install` run for the first time locally to generate `package-lock.json` (previously only `package.json` existed; Vercel had been installing fresh at deploy time) — lockfile now committed for reproducible installs and `npm audit` support; `node_modules/` added to `.gitignore`

## 2026-07-23 (v6 — single-file redesign)
- **Single-file four-tab shell supersedes the 2026-04-21 multi-page decision.** `index.html` is now one file with Home / News / Links / Recipes sections; JS shows/hides the active section (no page reload, no routing library). Light `#news`/`#links`/`#recipes` hash support is included (bookmark/reload friendly) via `showTab()` + `hashchange`. The nav-bar/scratchpad duplication that the 2026-04-21 entry accepted is gone — there is only one file now, so future nav/scratchpad edits touch one place
- `news.html` deleted; its fetch/render logic moved into the News section of `index.html`. `index.html` content fully replaced (filename kept, so the Vercel root route and existing bookmarks keep working). `migrate.html`, `api/news.js`, `api/weather.js`, `package.json` untouched
- **News fetch is lazy-on-first-click and session-cached**, not eager on page load (contrast with v5b-2's `DOMContentLoaded` fetch). First entry into the News tab renders skeletons then fetches `/api/news`; a `newsLoaded` flag prevents refetch for the rest of the page session (only a fresh page load or the 10-min edge cache expiring gets new data)
- **Design tokens are fixed from the Claude Design export (light mode); no settings UI in V6.** Values baked directly into CSS custom properties. Only three accents exist — green `oklch(0.48 0.15 130)`, red-orange `oklch(0.55 0.18 25)`, gold `oklch(0.62 0.15 70)` — reused across widgets and News source tags. **Green is the primary interactive color** (buttons, active filter pill, checkbox fill, nav active-underline, reviewed line), matching the export
- **Links resource-type tags kept neutral gray** (same treatment as recipe tags), deliberately NOT adopting the export's per-type colour-coding, because that introduced a fourth accent (blue) which violates the spec's "only three accents" rule. Spec wins over the export where they conflict
- Fonts (IBM Plex Sans / Space Grotesk / JetBrains Mono) loaded via a Google Fonts `<link>` with a full system-font fallback stack — degrades gracefully when the file is opened offline as a standalone local file. Deferred CSP work (v5c) will need to allowlist `fonts.googleapis.com` / `fonts.gstatic.com`
- **Recipes is a new feature** on a new additive localStorage key `ai_recipes` (flat list, no categories). Each recipe is `{ id, title, type }` where `type` is `'link'` (`+ url, source`) or `'note'` (`+ body`, rich-text HTML reusing the scratchpad's `execCommand` toolbar, sanitized on save/render). Note-type items show a neutral "Personal" badge. Seeded with 4 demo recipes (3 link + 1 note) so the feature is populated on first load. `migrate.html` was left untouched per spec, so it does not yet export/import `ai_recipes`
- **To-Do widget is a static visual placeholder only** (sample tasks, no add/check/delete, no persistence) — full functionality explicitly deferred to a future build
- Weather moved from a floating collapsed pill + panel to an **always-visible Home widget card**; `fetchWeather` / `renderWeather` / `WEATHER_ICONS` / `ai_weather_city` logic reused, only the render target changed (renders inline into the card, no toggle)
- The original Claude Design export is kept at `specs/claude-design-export.html` as a reference-only artifact (not linked from the app)
