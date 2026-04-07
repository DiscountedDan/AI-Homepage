For v2 requirements, read specs/v2-spec.md before starting.

# CLAUDE.md — AI Learning Homepage

## Project Overview
A personal, locally-hosted homepage that centralizes AI learning resources into a single, visually polished link launcher. No backend. No deployment. Open as an HTML file in any browser.

---

## Goals
- Centralize ~10 links currently scattered across Google Drive notes
- Organize links into categorized cards for fast access
- Build a clean, extensible base for future feature additions

---

## Tech Stack
- **HTML / CSS / JavaScript** — single file preferred for simplicity
- **Local storage** — only for persisting checkbox completion state
- **No backend, no framework, no build step**

---

## Content & Structure

### Link Categories (v1)
Organize links into the following category cards:
1. **GitHub Repos & Skills** — repos and tools to learn/use
2. **Anthropic Courses** — official learning resources
3. **Reddit Posts & Guides** — community tutorials and threads

> Category names/count can be adjusted once actual links are added.

### Each Link Card Should Display:
- Resource title (clickable link, opens in new tab)
- Short description (1–2 sentences about what the resource is)
- Resource type label/tag (e.g., "Course", "Repo", "Guide")
- **Completion checkbox** — user can check off completed resources; state persists via localStorage so it survives page refresh

---

## Visual Design

### Theme
- **Dark mode** — dark grey base background
- **Color palette** — cool blues and teals as primary accent colors; grey as neutral/secondary
- **Unified color scheme** — all category cards share the same blue/teal/grey palette (not distinct colors per category)

### Design Goals
- Aesthetically polished, not just functional
- Clean card layout with good spacing
- Designed to scale — new sections should drop in cleanly without redesigning the page

---

## Future Features (Do NOT build in v1)
- **Recent AI News section** — auto-fetching or manually curated news feed at the top of the page
- Additional categories as link library grows
- Possible search/filter across all links

---

## Build Instructions for Claude Code
1. Build as a **single `index.html` file** with embedded CSS and JS
2. Hardcode the 10 links — placeholders are fine; Dan will swap in real URLs
3. Use placeholder content for titles, descriptions, and tags so the structure is clear
4. Implement localStorage for checkbox state — key by link title or index
5. Make the design mobile-aware (basic responsive layout)
6. Leave clear comments in the code marking where to add new links or categories

---

## What Success Looks Like
Open `index.html` in a browser and see:
- A dark, visually sharp homepage
- 3–4 category sections with ~3 link cards each
- Each card has title, description, tag, and a completable checkbox
- Checked boxes persist after page refresh
- The page looks good enough to actually use daily
