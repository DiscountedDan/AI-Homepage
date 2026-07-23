# CLAUDE.md — AI Learning Homepage

## Project Overview
A personal homepage that centralizes AI learning resources into a single, visually polished link launcher. Live at `ai-homepage-theta.vercel.app` — auto-deploys on every push to `main`. Can also be opened as a standalone HTML file in any browser.

---

## Tech Stack
- **HTML / CSS / JavaScript** — single-file app (four JS-switched tabs), no build step. All CSS and JS embedded in `index.html`
- **localStorage** — all state and persistence; no framework, no build step
- **Vercel Serverless Functions** — `/api` folder; each `.js` file becomes a route; API keys stored as Vercel environment variables, never in code
- **npm / rss-parser** — `package.json` + `package-lock.json` at repo root; `rss-parser@^3.13.0` is the project's first (and currently only) npm dependency. Vercel auto-installs on deploy. No build step added.

---

## Backend Architecture

- Pattern: `Browser → /api route (Vercel) → external API → response back`
- API keys stored as Vercel environment variables — never in code or HTML; always read from `process.env`
- All serverless functions use CommonJS (`module.exports`) format
- Use `Promise.all` for parallel calls to a single external API. Use `Promise.allSettled` for multi-source aggregation — one failing source must not kill the whole response (see `api/news.js`)
- Error responses always return `{ error: "..." }` JSON with an appropriate HTTP status code (400, 401, 500, 502)
- Current routes:
  - `api/weather.js` — OpenWeatherMap current conditions + 3-day forecast → `/api/weather`. Validates `lat`/`lon`/`city` input (400 on invalid); responses cached at the edge (`s-maxage=600, stale-while-revalidate=60`) on success.
  - `api/news.js` — fetches 3 public RSS feeds (OpenAI, Google Research, TechCrunch AI), parses with `rss-parser` (5s timeout), sanitizes summaries, drops items with non-http(s) links, returns grouped JSON → `/api/news`. No API key required.

---

## Visual Design
- **Light mode** (V6) — light grey-blue page background; content sits in a centered `.app` card container. Design tokens are fixed light-mode values from the Claude Design export, baked into CSS custom properties; no settings UI. (v1–v5 were dark mode.)
- **Color palette** — three accents only: green `oklch(0.48 0.15 130)` (primary/interactive), red-orange `oklch(0.55 0.18 25)`, gold `oklch(0.62 0.15 70)`; neutral greys for text and tags
- **Unified scheme** — no per-category colors; Links type-tags and recipe source tags are neutral gray
- **Scalable layout** — new sections/tabs drop in cleanly without redesigning the page

---

## Current Architecture (v6)

Single-file app. No dependencies, no build step. `index.html` is one file with four tabs — Home / News / Links / Recipes — switched via JS (`showTab()`, no page reload). Light `#news`/`#links`/`#recipes` hash support. Resource/recipe cards rendered dynamically from localStorage. No hardcoded cards in HTML. Light-mode design tokens baked into CSS custom properties (from the Claude Design export); no settings UI.

### Page Structure
- `index.html` — the whole app: four tab sections + all modals. Nav (with tabs + scratchpad pill) and widgets live here once, not duplicated.
  - **Home** — greeting + live date/time; widget grid: Weather (always-visible card), AI Links preview (completed/total + 3–4 most-recent resources → Links tab), To-Do (static placeholder), Recipes preview (up to 4 → Recipes tab)
  - **News** — two sections (Lab Announcements 2-col card grid: OpenAI + Google AI 2 items each; Industry News list-card: TechCrunch 15 items). Lazy fetch on first tab open, session-cached; skeletons then `/api/news`
  - **Links** — the resource manager (Add/Edit/Delete/Notes/Review modals, All/Open/Completed filter, categories). Rounded green filter pills, neutral-gray type tags
  - **Recipes** — flat list (new feature); Add/Edit Recipe modal with Link/Note toggle, gear edit/delete
- `migrate.html` — localStorage export/import utility; accessed via direct URL only. Not yet aware of `ai_recipes`
- `specs/claude-design-export.html` — reference-only Claude Design export (not deployed/linked)

The single container (`.app`) is a centered max-width card. Only three accent colors exist (green / red-orange / gold); green is the primary interactive color. Fonts (IBM Plex Sans / Space Grotesk / JetBrains Mono) via Google Fonts `<link>` with system fallback.

### localStorage Keys
- `ai_resources` — array of all resource objects
- `ai_categories` — array of category name strings (user-extensible)
- `ai_resource_types` — array of resource type label strings (user-extensible)
- `ai_completion_data` — object of completion/review records keyed by resource ID
- `ai_scratchpad` — HTML string content of the global scratchpad widget
- `ai_card_notes` — object of per-card notes keyed by resource ID
- `ai_weather_city` — string, user's manually set city name for the weather widget. Empty/absent = use geolocation. Persists across sessions.
- `ai_recipes` — array of recipe objects (V6). Flat list, no categories. Additive key; seeded with demo recipes on first load.

### Migration Utility
- `migrate.html` — standalone export/import tool for migrating localStorage data from the local file to the live Vercel deployment. No dependency on `index.html`. Permanently deployed at `/migrate.html`. Import validates the shape of every known key before writing anything (all-or-nothing — a bad key aborts the whole import with an error naming it) and sanitizes `ai_scratchpad` HTML (strips `script`/`iframe`/etc., event-handler attributes, and non-http(s)/`#` `href`/`src`/`srcset` values) before it's written to localStorage.

### Resource Object Shape
```json
{ "id": 0, "title": "", "url": "", "description": "", "type": "", "category": "" }
```
Seeded resources use numeric IDs 0–11. User-added resources use `Date.now()` as ID.

### Completion Record Shape
```json
{ "completed": true, "dateCompleted": "2026-04-07", "summary": "", "type": "", "rating": 3 }
```
`rating` is 1–5, or 0 if skipped. All fields except `completed` are empty string/0 if user skipped the review.

### Recipe Object Shape
```json
{ "id": 0, "title": "", "type": "link", "url": "", "source": "" }
{ "id": 0, "title": "", "type": "note", "body": "<sanitized html>" }
```
`type` is `'link'` (has `url` + typed `source` tag) or `'note'` (has rich-text `body`, sanitized on save/render). Seeded recipes use IDs 1–4; user-added use `Date.now()`.

---

## Data Preservation Rule
Never rename or restructure the localStorage keys or object shapes defined above. Existing user data depends on them. If a new version requires schema changes, migration logic must be written — do not just change the keys.

---

## Features

**Add Resource modal** — triggered by header button. Fields: Title, URL, Description, Resource Type, Category. Both dropdowns support inline "Add New..." to create types/categories on the fly. New entries persist to `ai_categories` / `ai_resource_types` immediately. Form resets after submission.

**Completed section + filter** — checking a card triggers a review modal (Date Completed, Summary, Resource Type, 1–5 stars). Dismissing or skipping still marks the card complete with empty review fields. Completed cards move to a "Completed Resources" section at the bottom. Unchecking returns a card to its original category; review data is preserved. Filter bar (All / Open / Completed) controls visibility.

**Reviewed count** — the Links tab shows a live "X of Y reviewed" count (green mono line under the header); updates when cards are added or completed. Replaced the v5 header progress bar.

**Card management** — a gear icon on every card opens a settings menu. Open cards have two actions: Edit Card (title, URL, description, type, category — with inline "Add New..." support on dropdowns) and Delete (removes card and all associated review data). Completed cards have a third action: Edit Review (update date, summary, type, and star rating after submission).

**Global scratchpad** — always-visible pill in the nav (next to the brand mark), present on every tab. Collapsed by default; expands to a floating resizable panel. Supports rich text via a formatting toolbar (font size, bold, bullets, alignment). Auto-saves to localStorage on every keystroke.

**Per-card notes** — notepad icon on every card (hollow when empty, solid yellow when a note exists). Opens a modal with a free-text textarea. Notes persist independently of card edits and are removed when a card is deleted.

**AI news feed** — live two-section feed on the News tab. Lab Announcements shows the 2 most recent items from OpenAI and Google AI as a 2-col card grid (OpenAI first). Industry News shows 15 most recent TechCrunch AI items as a bordered list-card. Source tags are colour-tinted per source (OpenAI red-orange, Google AI green, TechCrunch gold). Fetch is **lazy** (first time the News tab is opened) and **session-cached**; skeletons render first, replaced when `/api/news` resolves. Per-source, per-section, and total-failure error states handled. Summaries sanitized and truncated to 150 chars server-side. Cached at Vercel edge for 10 minutes.

**Recipes** (V6) — flat list on the Recipes tab (new `ai_recipes` key). Add Recipe modal with a Link/Note toggle: Link items have title + URL + typed source tag; Note items have title + rich-text body (same `execCommand` toolbar as the scratchpad, sanitized on save). Gear-icon Edit/Delete matching the Resources pattern. Note items show a neutral "Personal" badge; source tags are neutral gray for all sources. Home shows a preview of up to 4.