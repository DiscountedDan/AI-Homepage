# CLAUDE.md — AI Learning Homepage

## Project Overview
A personal homepage that centralizes AI learning resources into a single, visually polished link launcher. Live at `ai-homepage-theta.vercel.app` — auto-deploys on every push to `main`. Can also be opened as a standalone HTML file in any browser.

---

## Tech Stack
- **HTML / CSS / JavaScript** — multi-page, no build step. All CSS and JS embedded per file
- **localStorage** — all state and persistence; no framework, no build step
- **Vercel Serverless Functions** — `/api` folder; each `.js` file becomes a route; API keys stored as Vercel environment variables, never in code

---

## Backend Architecture

- Pattern: `Browser → /api route (Vercel) → external API → response back`
- API keys stored as Vercel environment variables — never in code or HTML; always read from `process.env`
- All serverless functions use CommonJS (`module.exports`) format
- Use `Promise.all` for parallel external API calls — never fetch sequentially when calls are independent
- Error responses always return `{ error: "..." }` JSON with an appropriate HTTP status code (400, 401, 500, 502)
- Current routes:
  - `api/hello.js` — dummy health check → `/api/hello`
  - `api/weather.js` — OpenWeatherMap current conditions + 3-day forecast → `/api/weather`

---

## Visual Design
- **Dark mode** — dark grey base background
- **Color palette** — cool blues and teals as accents; grey as neutral/secondary
- **Unified scheme** — all category cards share the same palette (no per-category colors)
- **Scalable layout** — new sections drop in cleanly without redesigning the page

---

## Current Architecture (v5b)

Multi-page. No dependencies, no build step. Each page is self-contained. Resource cards rendered dynamically from localStorage on every load. No hardcoded cards in HTML.

### Page Structure
- `index.html` — home page; resource card logic, modals, weather widget, progress bar
- `news.html` — news feed page (shell only in v5b-1; feed content ships in v5b-2)
- `migrate.html` — localStorage export/import utility; accessed via direct URL only

Nav bar and scratchpad widget are duplicated across pages (intentional — no build step). Weather widget is homepage-only. Body content is wrapped in `.page-wrap`; nav sits outside it as a direct `<body>` child.

### localStorage Keys
- `ai_resources` — array of all resource objects
- `ai_categories` — array of category name strings (user-extensible)
- `ai_resource_types` — array of resource type label strings (user-extensible)
- `ai_completion_data` — object of completion/review records keyed by resource ID
- `ai_scratchpad` — HTML string content of the global scratchpad widget
- `ai_card_notes` — object of per-card notes keyed by resource ID
- `ai_weather_city` — string, user's manually set city name for the weather widget. Empty/absent = use geolocation. Persists across sessions.

### Migration Utility
- `migrate.html` — standalone export/import tool for migrating localStorage data from the local file to the live Vercel deployment. No dependency on `index.html`. Permanently deployed at `/migrate.html`.

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

---

## Data Preservation Rule
Never rename or restructure the localStorage keys or object shapes defined above. Existing user data depends on them. If a new version requires schema changes, migration logic must be written — do not just change the keys.

---

## Features

**Add Resource modal** — triggered by header button. Fields: Title, URL, Description, Resource Type, Category. Both dropdowns support inline "Add New..." to create types/categories on the fly. New entries persist to `ai_categories` / `ai_resource_types` immediately. Form resets after submission.

**Completed section + filter** — checking a card triggers a review modal (Date Completed, Summary, Resource Type, 1–5 stars). Dismissing or skipping still marks the card complete with empty review fields. Completed cards move to a "Completed Resources" section at the bottom. Unchecking returns a card to its original category; review data is preserved. Filter bar (All / Open / Completed) controls visibility.

**Progress bar** — tracks completed/total dynamically in the header; updates when cards are added or completed.

**Card management** — a gear icon on every card opens a settings menu. Open cards have two actions: Edit Card (title, URL, description, type, category — with inline "Add New..." support on dropdowns) and Delete (removes card and all associated review data). Completed cards have a third action: Edit Review (update date, summary, type, and star rating after submission).

**Global scratchpad** — always-visible widget in the top-left of the header. Collapsed by default; expands to a floating resizable panel. Supports rich text via a formatting toolbar (font size, bold, bullets, alignment). Auto-saves to localStorage on every keystroke.

**Per-card notes** — notepad icon on every card (hollow when empty, solid yellow when a note exists). Opens a modal with a free-text textarea. Notes persist independently of card edits and are removed when a card is deleted.

---

## Future Features (v5+)
- V5b-2: AI news feed (v5b-1 nav shell complete)
- Export completed resources
- Sort or search within Completed section
- Search/filter across all resources
- AI tool comparison table