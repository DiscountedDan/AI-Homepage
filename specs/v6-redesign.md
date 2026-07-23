# V6 — Redesign Spec

## Summary
Restructures the site from multi-page (index.html + news.html + migrate.html)
into a single-page shell with four tabs — Home, News, Links, Recipes —
switched via JS with no page reload. Visual design comes from a Claude
Design export (light mode, fixed — no settings UI). Adds one new feature
(Recipes) and one new placeholder widget (To-Do). migrate.html is
unaffected.

---

## File Changes

- **`index.html`** — content fully replaced (filename stays the same, so
  the Vercel root route and any existing bookmarks keep working). New
  content is the four-tab shell (Home/News/Links/Recipes).
- **`news.html`** — deleted. Its fetch/render logic for News moves into
  the News section of the new `index.html`.
- **`migrate.html`** — untouched, no changes.
- **`api/news.js`, `api/weather.js`** — untouched, no changes.
- **`package.json`, `package-lock.json`** — untouched.
- No new files needed for Recipes — it's a new localStorage key
  (`ai_recipes`) read/written from within the same `index.html`.
- Claude Code should surface the `news.html` deletion as an explicit step
  in its plan for approval, not perform it silently.

---

## Architecture

- **Single unified HTML file** replaces `index.html` + `news.html`. Home,
  News, Links, and Recipes are sections in one file; JS shows/hides the
  active section. No routing library, no hash routing required (optional
  light `#news`/`#links`/`#recipes` support is a nice-to-have, not required).
- **No build step introduced.** This is still vanilla HTML/CSS/JS — the
  change is consolidating three files into one, not adding a framework.
- **Nav + scratchpad duplication goes away** — one copy of each instead of
  copies per file, since there's now only one file.
- This supersedes the 2026-04-21 decision ("multi-page architecture...no
  SPA routing"). Record the supersession in `DECISIONS.md` with today's date.

---

## Design Tokens (fixed — from Claude Design export, light mode)

No settings UI. These are baked into the CSS directly.

- **Fonts:** IBM Plex Sans (body), Space Grotesk 600/700 (headings),
  JetBrains Mono (section labels, mono accents, letter-spacing ~0.1em)
- **Base colors:**
  - Page background: `oklch(0.97 0.005 260)`
  - Card background: `oklch(0.99 0.003 260)` / card border: `oklch(0.88 0.01 260)`
  - Primary text: `oklch(0.18 0.01 260)` / muted text: `oklch(0.48 0.01 260)`

### Accent color mapping (do not mix these up — each element gets exactly one)

| Element | Color | Applied as |
|---|---|---|
| Weather widget | Green `oklch(0.48 0.15 130)` | top border, 2px |
| AI Links widget | Red-orange `oklch(0.55 0.18 25)` | top border, 2px |
| To-Do widget | Green `oklch(0.48 0.15 130)` | top border, 2px |
| Recipes widget | Gold `oklch(0.62 0.15 70)` | top border, 2px |
| Links filter pills (active state) | Green `oklch(0.48 0.15 130)` | pill background |
| News: OpenAI items | Red-orange `oklch(0.55 0.18 25)` | tag text + tinted bg |
| News: Google AI items | Green `oklch(0.48 0.15 130)` | tag text + tinted bg |
| News: TechCrunch items | Gold `oklch(0.62 0.15 70)` | tag text + tinted bg |
| Recipe source tags (all sources) | Neutral gray `oklch(0.55 0.01 260)` on `oklch(0.94 0.006 260)` | **not** accent-colored — same gray regardless of source |

Note the pattern: only three accent colors exist (green, red-orange, gold),
reused across widgets and News tags. Recipe tags are the one exception —
they stay neutral gray for every source, don't color-code them.

- **Corners:** outer container 16px, widget cards 8px, news/links/recipe
  cards 10px, filter pills 20px (fully rounded)
- **Spacing:** widget grid gap 22px, widget padding 26px, card grid gap
  18px, card padding 22px 24px
- **Elevation:** flat — no box-shadow on cards
- Original Claude Design export kept in the repo as a reference-only
  artifact (not deployed) in case anything not covered here needs a
  cross-check.

---

## Home Tab

Greeting header (time-of-day-based, e.g. "Good evening, Dan") + live
date/time. Widget grid below:

1. **Weather** — always-visible card, no collapse/toggle. Shows current
   temp/condition/hi-lo, 3-day forecast, and city override input, all
   inline, all the time, with no click required to reveal any of it.
   Reuses existing `api/weather.js` and `fetchWeather`/`renderWeather`
   logic — just renders into the grid slot instead of a floating panel.
2. **AI Links** — header shows completed/total count (existing logic),
   clicking through goes to the Links tab. Body shows a short preview list
   (3–4 most recently added resources) as title + type tag, same visual
   treatment as the Recipes widget. No icon grid (mockup's icon grid was
   Design's placeholder content, not real data).
3. **To-Do** — **static visual placeholder only.** Sample tasks, no
   add/check/delete, no persistence. Full functionality (including
   possible calendar/notes integration) explicitly deferred to a future
   build.
4. **Recipes** — preview list of up to 4 recipes (mix of Link/Note types),
   title + tag. Clicking through goes to the Recipes tab.
5. **Scratchpad** — keep the existing nav-embedded scratchpad (pill +
   floating rich-text panel) as the single implementation, present on
   every tab. **Assumption/flag:** the mockup also showed a second,
   separate collapsible "Scratchpad" card on Home — skipping that to
   avoid two implementations of the same feature. Flag if you want that
   second card kept.

---

## News Tab

Same two-section layout as today (Lab Announcements, Industry News),
restyled to the new tokens. No changes to `api/news.js`.

- **Fetch strategy: lazy.** Fetches on first click into the News tab, not
  on page load. Result cached in memory for the rest of that page session
  (revisiting the tab doesn't refetch; only a fresh page load or the
  10-minute edge cache expiring gets new data).

---

## Links Tab

This **is** the current `index.html` resource manager (Add Resource,
Edit, Delete, Notes, Review modals, All/Open/Completed filter, categories)
— restyled only, no functional changes. Filter bar becomes rounded pills
per the mockup.

---

## Recipes Tab (new)

- New localStorage key (`ai_recipes`), flat list, no categories.
- Each recipe has an `id`, a custom-typed `title`, and a `type`: `'link'`
  or `'note'`.
  - **Link type:** title, URL, source tag (manually typed, e.g. "NYT
    COOKING") — no description field, kept lean.
  - **Note type:** title, rich-text body — reuses the same
    contenteditable + `execCommand` formatting toolbar as the Scratchpad
    (bold, bullets, font size, alignment).
- **Assumption/flag:** Note-type items need *some* badge for visual
  consistency with Link-type tags. Defaulting to a neutral badge (e.g.
  "PERSONAL") for Notes — flag if you'd rather they show no tag at all.
- Add flow: single "Add Recipe" modal with a Link/Note toggle that swaps
  the visible fields.
- Edit/Delete: same gear-icon settings-menu pattern as Resources.

---

## Out of scope for V6 (explicitly deferred)

- To-Do full functionality (add/check/delete, persistence, any external
  integration)
- Settings panel / live theme toggles
- Recipe categories

---

## DECISIONS.md entries to add

- Single-file shell supersedes the 2026-04-21 multi-page decision
- News fetch is lazy-on-click, session-cached — not eager on page load
- Design tokens are fixed from the Claude Design export; no settings UI
  built in V6
- `news.html` deleted, `index.html` content fully replaced as part of V6
