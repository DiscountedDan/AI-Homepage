# AI Homepage — v3a Spec
**Date:** April 10, 2026
**Status:** Ready to build
**Scope:** Two features only — do not build anything outside this spec

---

## Core Constraints (Inherited — Do Not Break)

- Single `index.html` file — keep all code embedded, no external files
- No backend, no framework, no build step
- localStorage only for all state and persistence
- Dark grey base, blue/teal accent color scheme — maintain visual consistency
- Progress bar in header must continue to work correctly
- All existing localStorage keys and object shapes must be preserved (see CLAUDE.md)
- No schema changes without migration logic

---

## Feature 1 — Edit & Delete Resource Cards

### What it does
A settings icon on every resource card lets the user edit card fields or permanently delete the card, directly in the browser without touching code.

### Settings Icon Placement
- A gear/settings icon (⚙) sits on every card, adjacent to the existing completion checkbox
- Icon is always visible (not hover-only) for discoverability
- Matches the existing card color scheme — muted by default, teal on hover

### Settings Icon — Context-Aware Options
The options shown depend on the card's completion state:

**Open (uncompleted) cards:**
- Edit Card
- Delete

**Completed cards:**
- Edit Card
- Edit Review
- Delete

### Edit Card — Modal Behavior
- Clicking "Edit Card" opens a modal pre-filled with the card's current data
- Fields match the Add Resource form exactly: Title, URL, Description, Resource Type, Category
- Resource Type and Category dropdowns show all existing options (same as Add Resource form)
- "Add New..." inline option available for both dropdowns (consistent with Add Resource behavior)
- Save button updates the card in `ai_resources` localStorage and re-renders immediately
- Cancel button closes modal with no changes
- Modal pattern is visually consistent with the existing Add Resource and review modals

### Delete — Confirmation Behavior
- Clicking "Delete" opens a confirmation modal (or confirmation step within the settings modal)
- Confirmation message: "Are you sure you want to delete [card title]? This cannot be undone."
- Two buttons: Confirm Delete (destructive, red accent) and Cancel
- On confirm: card is removed from `ai_resources` and any associated entry in `ai_completion_data` is also removed
- Page re-renders immediately; progress bar updates correctly

### Behavior Notes
- Editing a card's category moves it to the correct category section immediately on save
- Editing a completed card's fields does not affect its completion/review data
- All edits persist after page refresh via localStorage

---

## Feature 2 — Edit Review After Submission

### What it does
Allows the user to update a previously submitted review for a completed resource card.

### Entry Point
- Triggered via the settings icon on completed cards → "Edit Review" option
- Only visible on cards in the Completed state (consistent with context-aware settings menu above)

### Edit Review — Modal Behavior
- Opens the same review modal used during initial completion, pre-filled with existing review data
- Fields: Date Completed, Summary, Resource Type, Personal Rating (1–5 stars)
- All fields are editable
- Save button overwrites the existing record in `ai_completion_data` keyed by resource ID
- Cancel button closes modal with no changes
- If original review was skipped (empty fields), modal opens with defaults: today's date, blank summary, card's resource type, 0 stars

### Behavior Notes
- Updated review data renders immediately on the completed card without page reload
- All changes persist after page refresh via localStorage
- Does not affect the card's completion status or original completion date unless user explicitly changes it

---

## localStorage Impact

No new keys required. All changes use existing keys:
- `ai_resources` — updated by edit/delete card actions
- `ai_completion_data` — updated by edit review action

No schema changes. No migration logic required.

---

## Explicitly Excluded from v3a (Do Not Build)

- Global scratchpad (v3b)
- Per-card notes (v3b)
- AI news feed (v4)
- Search or advanced filtering
- Export of completed resources
- Sort or search within Completed section
- Any new localStorage keys or schema changes

---

## Definition of Done

v3a is complete when:
1. Every resource card displays a settings gear icon adjacent to the checkbox
2. Settings icon shows context-aware options: open cards get Edit Card + Delete; completed cards get Edit Card + Edit Review + Delete
3. Edit Card modal opens pre-filled and saves changes immediately to localStorage and UI
4. Delete triggers a confirmation step and removes the card (and its completion data) from localStorage and UI
5. Edit Review modal opens pre-filled with existing review data and saves updates immediately
6. Progress bar updates correctly after any delete action
7. All changes persist after page refresh
8. Visual consistency maintained — all new modals and icons match v1/v2 styling exactly
