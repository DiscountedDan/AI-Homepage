# CLAUDE.md — AI Learning Homepage

## Project Overview
A personal, locally-hosted homepage that centralizes AI learning resources into a single, visually polished link launcher. No backend. No deployment. Open as an HTML file in any browser.

---

## Tech Stack
- **HTML / CSS / JavaScript** — single `index.html` file, all CSS and JS embedded
- **localStorage** — all state and persistence; no backend, no framework, no build step

---

## Visual Design
- **Dark mode** — dark grey base background
- **Color palette** — cool blues and teals as accents; grey as neutral/secondary
- **Unified scheme** — all category cards share the same palette (no per-category colors)
- **Scalable layout** — new sections drop in cleanly without redesigning the page

---

## Current Architecture (v3a)

Single `index.html` — no dependencies, no build step. All resource cards rendered dynamically from localStorage on every load. No hardcoded cards in HTML.

### localStorage Keys
- `ai_resources` — array of all resource objects
- `ai_categories` — array of category name strings (user-extensible)
- `ai_resource_types` — array of resource type label strings (user-extensible)
- `ai_completion_data` — object of completion/review records keyed by resource ID

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

---

## Future Features (v3b+)
- Export completed resources
- Sort or search within Completed section
- Recent AI news feed (auto-fetching or manually curated)
- Search/filter across all resources
- Notes scratchpad
- AI tool comparison table
- Personal header customization (name, etc.)
- Weather widget
- Deploy to web