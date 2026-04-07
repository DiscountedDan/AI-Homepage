# AI Homepage — v2 Spec
**Date:** April 7, 2026
**Status:** Ready to build
**Scope:** Two features only — do not build anything outside this spec

---

## Core Constraints (Inherited from v1 — Do Not Break)

- Single `index.html` file — keep all code embedded, no external files
- No backend, no framework, no build step
- localStorage only for all state and persistence
- Dark grey base, blue/teal accent color scheme — maintain visual consistency
- Single device (MacBook) — no cross-device sync required
- Progress bar in header must continue to work correctly

---

## Architecture Change — Migrate to localStorage

### What changes
All 12 hardcoded v1 links must be migrated out of static HTML into localStorage. The page must load all resource cards dynamically from localStorage only — no hardcoded cards in the HTML.

### Seed Data (First Load)
On first load, if localStorage contains no resources, seed it with the following 12 links exactly as specified. This ensures a seamless transition with no data loss.

**Category: GitHub Repos & Skills**
1. Title: Prompt Master | URL: https://github.com/nidhinjs/prompt-master | Description: Claude skill that writes accurate prompts for any AI tool | Type: GitHub
2. Title: System Prompts | URL: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools | Description: System prompts from top AI companies; useful for instruction ideas | Type: GitHub
3. Title: Anthropic GitHub | URL: https://github.com/anthropics | Description: Official Anthropic repos including agents, skills, and guides | Type: GitHub
4. Title: Factchecker Skill | URL: https://github.com/Shubhamsaboo/awesome-llm-apps/blob/main/awesome_agent_skills/fact-checker/SKILL.md | Description: Fact-checker skill for Claude | Type: GitHub

**Category: Anthropic Learning**
5. Title: Claude API Docs | URL: https://platform.claude.com/docs/en/home | Description: Learn APIs and advanced coding/automation | Type: Docs
6. Title: Claude Agents Guide | URL: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview | Description: How to build and use Claude agents | Type: Docs
7. Title: Anthropic Courses | URL: https://anthropic.skilljar.com/ | Description: Official Anthropic courses for structured learning | Type: Course
8. Title: Superpowers Plugin | URL: https://claude.com/plugins/superpowers | Description: Claude Code skills for advanced development workflows | Type: Docs
9. Title: Claude Code Quickstart | URL: https://code.claude.com/docs/en/quickstart | Description: Basics of Claude Code from Anthropic | Type: Docs

**Category: Community & Media**
10. Title: Reddit: Prompt Master | URL: https://www.reddit.com/r/ClaudeAI/comments/1rxyarx/i_built_a_claude_skill_that_writes_accurate/ | Description: Community post about the Prompt Master skill | Type: Reddit
11. Title: Reddit: Claude Skills | URL: https://www.reddit.com/r/ClaudeCowork/comments/1s3ljzh/6_skills_i_actually_use_every_day/ | Description: 6 Claude skills used daily; paths to add skills | Type: Reddit
12. Title: YouTube: GitHub Beginners | URL: https://www.youtube.com/watch?v=r8jQ9hVA2qs&list=PL0lo9MOBetEFcp4SCWinBdpml9B2U25-f | Description: 10-video playlist for learning GitHub basics | Type: Video

### localStorage Keys
Use consistent keys for all stored data:
- `ai_resources` — array of all resource card objects
- `ai_categories` — array of category names (seeded with the 3 default categories)
- `ai_resource_types` — array of resource type names (seeded with defaults)
- `ai_completion_data` — object storing review data keyed by resource ID

---

## Feature 1 — Live Link Adding Form

### What it does
A form accessible directly in the browser (no code editing required) that lets the user add a new resource card to the dashboard. All data persists via localStorage.

### Form Fields (required)
- **Title** — text input
- **URL** — text input (opens in new tab when card is clicked)
- **Description** — text input (1-2 sentences)
- **Resource Type** — dropdown showing existing types PLUS an "Add New Type..." option
- **Category** — dropdown showing existing categories PLUS an "Add New Category..." option

### Default Resource Types (seeded on first load)
GitHub, Video, Docs, Reddit, Course, Other

### Category & Resource Type Creation
- If user selects "Add New Category..." or "Add New Type..." a text input appears inline to name the new entry
- New category/type is saved to localStorage and appears immediately in all relevant dropdowns
- New categories appear as sections on the dashboard matching existing section styling exactly

### Behavior
- Accessible via a clearly visible "Add Resource" button in the header or top of page
- On submit, new card appears immediately in the correct category without page reload
- New cards are visually indistinguishable from seeded v1 cards
- All user-added links persist after page refresh via localStorage
- Form resets after successful submission

### Explicitly excluded
- No file upload
- No bulk import
- No editing or deleting existing cards (v3+)

---

## Feature 2 — Completed Resources Section + Filter

### What it does
When a user checks off a resource card, it moves out of its category into a dedicated "Completed" section. The user is prompted to fill out a structured review form for that resource.

### Filter Bar
- Sits at the top of the page below the header
- Three toggle options: **All** | **Open** | **Completed**
- Default view: **All**
- "Open" — shows only uncompleted cards in their original categories
- "Completed" — shows only the Completed section
- "All" — shows everything

### Completed Section
- Lives at the bottom of the page below all category sections
- Header: "Completed Resources"
- Cards display all structured review data
- Visually distinct from open cards (muted styling or checkmark indicator) but same base card design

### Structured Review Form
- Triggered automatically when a user checks off a card
- Appears as a modal — do not navigate away from the page
- Fields:
  - **Date Completed** — date picker (defaults to today)
  - **Summary** — textarea (1-3 sentences: what did you learn?)
  - **Resource Type** — pre-filled from card, editable
  - **Personal Rating** — 1-5 stars (clickable)
- On submit, card moves to Completed section displaying all review fields
- If user dismisses without submitting, card moves to Completed with review fields empty

### Behavior
- Unchecking a completed card moves it back to its original category (review data preserved in localStorage)
- Progress bar updates correctly when cards move between states
- All completion state and review data persists via localStorage

### Explicitly excluded
- No editing of review after submission (v3+)
- No export of completed resources (v3+)
- No sorting or searching within Completed section (v3+)

---

## Explicitly Excluded from v2 (Do Not Build)

- AI news feed
- Notes scratchpad
- AI tool comparison table
- Personal header with name
- Weather widget
- Deploy to web
- Search or advanced filtering
- Editing or deleting existing cards

---

## Definition of Done

v2 is complete when:
1. All 12 v1 links load dynamically from localStorage (seeded on first load)
2. User can add a new resource card live in the browser and it persists after refresh
3. User can create a new category on the fly from the add form
4. User can create a new resource type on the fly from the add form
5. Checking off a card triggers the review modal and moves the card to Completed
6. Filter bar correctly toggles between All / Open / Completed views
7. All v1 functionality (progress bar, checkboxes) still works correctly
8. Visual consistency maintained — v2 additions match v1 styling exactly
