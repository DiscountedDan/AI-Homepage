# v5a — Data Migration Spec

## Goal
Enable a one-time migration of all localStorage data from the local `index.html` file to the live Vercel deployment at `ai-homepage-theta.vercel.app`. Preserves all user data: cards, completion reviews, notes, scratchpad, categories, types, and weather city.

---

## Approach
A standalone `migrate.html` file with two modes — Export (run locally) and Import (run on Vercel). No changes to `index.html`. No serverless functions needed. Pure client-side JavaScript.

---

## Files Touched
- `migrate.html` — new file, lives in repo root alongside `index.html`
- `specs/v5a-migration.md` — this spec

---

## localStorage Keys to Migrate
All 6 `ai_*` keys, exported and imported as a single JSON object:
- `ai_resources`
- `ai_categories`
- `ai_resource_types`
- `ai_completion_data`
- `ai_scratchpad`
- `ai_card_notes`
- `ai_weather_city` (if present)

---

## Export Flow (run locally via `file://`)

1. Page loads, detects it's in export mode (no special logic needed — user just knows to open it locally)
2. Single button: **"Export My Data"**
3. On click: reads all 6 `ai_*` keys from localStorage, serializes to JSON, triggers download of `ai-hub-backup.json`
4. Shows confirmation: "Export complete. Open this page on your Vercel site to import."

---

## Import Flow (run on Vercel at `ai-homepage-theta.vercel.app/migrate.html`)

1. File picker: select `ai-hub-backup.json`
2. On file selected: parse JSON, check if any `ai_*` keys already exist in Vercel's localStorage
3. **If existing data found:** show confirmation prompt — "This will overwrite all existing data on this site. Are you sure?" with Confirm / Cancel buttons
4. **If no existing data:** proceed directly
5. On confirm: write all keys from JSON into localStorage
6. Show success message: "Migration complete. Your data is now live on Vercel."

---

## Error States
- Invalid or corrupted JSON file → "Could not read this file. Make sure you're using the file downloaded from the export step."
- Missing expected keys in JSON → "This file doesn't look like a valid backup. No data was imported."

---

## Design
- Matches existing dark-mode palette from `index.html` (copy CSS variables)
- Minimal UI — no nav, no header, just a centered card with the relevant controls for each step
- No "How to use" instructions embedded in the page — user will be guided through the process in Claude.ai chat when ready to run the migration

---

## Behavior After Migration
- `migrate.html` stays deployed permanently as a low-risk recovery utility
- No auto-redirect after success — user navigates to the main site manually
- No changes to `index.html` — local file remains fully functional as an offline fallback

---

## Out of Scope
- Partial merge / conflict resolution
- Auto-detecting which mode (export vs import) based on origin
- Progress indicators
- Any UI beyond the minimal controls described above
