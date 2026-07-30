# V6a Spec — Functional To-Do Widget

## Overview
The Home tab's To-Do widget currently ships as a static visual placeholder (4 hardcoded rows, no persistence, no interactivity — see V6 `DECISIONS.md` entry). This version makes it fully functional: add, check/uncheck, delete, and clear-completed, backed by a new localStorage key. The widget remains a compact Home-tab-only card — no dedicated To-Do tab.

## Data Shape

New localStorage key: `ai_todos`

Flat array, same pattern as `ai_recipes`:

```json
{ "id": 0, "text": "", "completed": false }
```

- `id` — `Date.now()` for user-added tasks (no seeded data, so no reserved low-ID range needed)
- `text` — free-form string, no character limit, required non-empty on submit
- `completed` — boolean

No other fields (no due dates, no priority, no categories — out of scope, see below).

## Seed Data
None. Widget starts empty on first load. Do **not** port the current placeholder tasks over as seed data.

## Widget Layout & Header
- Header label changes from the current static `"To-Do · 1 of 4 done"` to a **live open-count**: `"To-Do · X open"` (e.g., "To-Do · 3 open"), recalculated on every render from tasks where `completed: false`.
- A small **"+" button** lives in the widget header area (near the label, consistent with how other widget headers place their chip/count elements).
- Widget card itself keeps its current fixed dimensions — do not let it grow with task count.

## Interactions

### Add Task
- Clicking "+" reveals an inline text input (input is not always-visible — hidden by default, appears on click).
- Enter (or a submit affordance) adds the task to the **top** of the open-tasks group.
- Empty/whitespace-only submissions are rejected (no-op, input stays open for correction).
- No character limit — allow wrapping/truncation in display via existing CSS text handling, but do not cap the stored string.
- After successful add, input clears and can be used again or dismissed.

### Check / Uncheck
- Clicking the checkbox toggles `completed`.
- Checking a task: text gets strikethrough styling (reuse the existing `.todo-text.done` style already defined in CSS), and the task moves from the open group to the bottom (completed) group.
- Unchecking reverses this — task returns to the open group.
- This is **non-destructive** — no undo needed, since toggling is fully reversible by re-clicking the checkbox.

### Delete
- Every task (open or completed) has a small delete icon.
- Clicking it removes the task **immediately and permanently** — no confirmation modal, no undo. (Contrast with the resource/recipe delete flows, which use a confirmation modal — this is intentionally lighter-weight given the low cost of re-adding a to-do.)

### Clear Completed
- A "Clear completed" button/link is visible whenever at least one completed task exists (hide it when there are zero completed tasks, to avoid dead UI).
- Clicking it removes **all** completed tasks in one action, immediately, no confirmation.

## Ordering
- **Open tasks** — newest-added at top (i.e., new tasks prepend, not append). No manual drag-reorder.
- **Completed tasks** — sink below all open tasks, rendered as their own group underneath. Order within the completed group is not specified as important — simplest implementation (e.g., preserve existing relative order) is fine.

## Overflow / Scrolling
- The task list area inside the card scrolls internally once content exceeds the card's fixed height — the card itself does not grow. Use the same fixed-height + `overflow-y: auto` pattern as other scrollable areas in the app (e.g., the scratchpad panel's `.rich-content`).

## Empty State
- When there are zero tasks (first load, or after deleting everything), show a plain message: **"No Tasks Yet"**, with the "+" add button still visible/accessible so the user can add their first task without any extra step.

## Editing
- Explicitly **out of scope**. No in-place editing of task text after creation. If a user makes a mistake, the expected flow is delete-and-re-add.

## Explicitly Out of Scope (this version)
- Dedicated To-Do tab/page
- Due dates, priorities, categories, or tags on tasks
- Drag-to-reorder
- In-place text editing
- Undo on delete or clear-completed
- "Show completed" toggle / archive view beyond the sink-to-bottom behavior
- Any seed/demo tasks

## Files Likely Touched
- `index.html` — To-Do widget markup (replace static rows with dynamic render), new CSS for the "+" reveal input, delete icon, and completed-group divider if needed (many styles like `.todo-row`, `.todo-box`, `.todo-text.done` already exist and should be reused, not duplicated)
- `CLAUDE.md` — add `ai_todos` to the localStorage keys list and task object shape; update the To-Do feature description (remove "static visual placeholder" language)
- `DECISIONS.md` — new dated entry noting the widget went from placeholder to functional, and the key decisions above (no undo on delete, no editing, sink-to-bottom ordering, no seed data)

## Data Preservation Note
This is a net-new key (`ai_todos`) — no existing localStorage keys or shapes are touched. `migrate.html` will **not** be updated to support `ai_todos` — confirmed out of scope; the migration utility is no longer an active concern going forward.
