# v3b Spec — AI Learning Hub

## Overview
Two new features + one header tweak. All localStorage, no external dependencies, single `index.html` file. Do not restructure or rename existing localStorage keys.

---

## Feature 1: Header Text Update

**Change:** Update the page title from `AI Learning Hub` to `Dan's AI Learning Hub`.

- Only the text changes — keep all existing styles, fonts, and layout intact.

---

## Feature 2: Global Scratchpad Widget

### Placement
- Top-left of the header area, in the empty space to the left of the centered title/progress block.
- Always visible on the page (not hidden behind a button).

### Behavior
- **Collapsed state:** Shows a small notepad icon + label (e.g., "Scratchpad") or a minimal preview (first line of text, truncated).
- **Expanded state:** Clicking the widget opens a textarea for freeform note-taking.
- Clicking outside or a close/collapse button collapses it back.

### Persistence
- Store scratchpad content in localStorage under key: `ai_scratchpad`
- Auto-save on every keystroke (no save button needed).

### Style
- Matches the existing dark mode palette (dark grey background, blue/teal accents).
- Subtle border or card treatment consistent with existing card components.
- Should not visually compete with or overlap the header title.

---

## Feature 3: Per-Card Notes

### Trigger
- Add a notepad icon to every resource card, positioned **to the left of the existing gear icon**.

### Icon States
- **Hollow / outline style** — when the card has no note saved.
- **Solid yellow** — when the card has an active note (any non-empty string).

### Behavior
- Clicking the icon opens a modal (consistent with existing modal patterns in the app).
- Modal contains:
  - A `<textarea>` for the note.
  - A **Save** button — saves and closes.
  - A **Cancel** button — closes without saving.
  - A **Delete Note** button — clears the note and closes (only visible if a note exists).

### Persistence
- Store per-card notes in localStorage under key: `ai_card_notes`
- Shape: `{ [resourceId]: "note text" }`
- Resource IDs match the existing `ai_resources` array (numeric for seeded, `Date.now()` for user-added).
- Notes must survive card edits — key off `id`, not title or index.

### Style
- Notepad icon should be the same size as the completion checkbox — larger than the gear icon.
- Yellow fill color should be a warm yellow (e.g., `#FACC15` or similar) — not neon, not orange.
- Modal style should match existing modals in the app.
- Modal textarea background must use the dark theme (dark grey, consistent with the rest of the app). Note text color must be white.

---

## Data Preservation Rules
- Do NOT rename or restructure any existing localStorage keys (`ai_resources`, `ai_categories`, `ai_resource_types`, `ai_completion_data`).
- New keys (`ai_scratchpad`, `ai_card_notes`) are additive only.
- No migration logic needed for v3b — these are net-new keys.

---

## Out of Scope for v3b
- AI news feed (v4)
- Export completed resources
- Sort/search within Completed section
- Any backend or external API calls
