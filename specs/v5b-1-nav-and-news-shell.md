# v5b-1 — Navigation + News Page Shell Spec

## Goal
Introduce multi-page architecture to the AI Learning Hub. Add a persistent top navigation bar, move the scratchpad widget into the nav as a cross-page utility (since note-taking is genuinely useful while reading news), keep the weather widget on the homepage only (since weather is a "glance once per session" utility that doesn't need cross-page access), and create a new `news.html` page shell (placeholder content only — the feed itself ships in v5b-2). Establishes the routing and layout foundation for v5b-2 (AI news feed) and future content pages (e.g., financial news in v6).

---

## Architecture

**Routing pattern:** Separate HTML files. `index.html` (home) and `news.html` (news). Standard anchor-tag navigation (`<a href="news.html">`), full page loads, same-tab navigation. No SPA-style routing, no hash routing.

**Why separate files:** Matches the project's zero-build, no-framework architecture. Each page is self-contained. Vercel serves them natively. Bookmarkable, shareable URLs work out of the box. Shared state already persists via localStorage (the existing keys handle cross-page continuity).

**Shared code handling:** Nav bar markup and scratchpad widget are duplicated between `index.html` and `news.html`. The weather widget is NOT duplicated — it lives only on the homepage. The duplication tradeoff is accepted because the nav + scratchpad are stable components, and extracting to shared files would require either a build step or runtime injection, both of which violate the project's zero-dependency principle. Revisit in a future version if duplication becomes painful.

---

## Top Navigation Bar

**Placement:** Above the existing header. Sticky (stays at top on scroll).

**Layout (left → right):**
- **Left:** Scratchpad widget (collapsed button, expands to floating panel on click)
- **Right:** Page links — `Home | News`

**Why this asymmetric layout:** With only one widget (scratchpad) and only two page links, a balanced three-part layout isn't needed. Scratchpad sits on the left matching its current position on the homepage (preserving muscle memory). Page links sit on the right — a common nav pattern where utilities anchor one side and navigation anchors the other.

**Styling:**
- Background: `--bg-card` (subtle elevation from page background)
- Border: 1px solid `--border` on the bottom edge only
- Height: ~48px
- Horizontal padding: matches existing page content padding
- Sticky position via `position: sticky; top: 0;`

**Z-index coordination:**
- Nav bar: `z-index: 100` (above page content)
- Scratchpad floating panel: `z-index: 150` (existing value — stays above nav when opened)
- Weather floating panel: `z-index: 150` (existing value — stays above nav when opened; weather is on homepage only but still needs to render above nav when open)
- Card settings dropdowns: `z-index: 50` (existing — below nav, which is fine since dropdowns appear relative to cards, not widgets)

**Active state (current page indicator):**
- Underline (2px, `--accent-primary`) under the active page link
- Inactive links: `--text-secondary`
- Hover state on inactive: `--text-primary`
- Active link text color: `--text-primary`

**Mobile behavior:**
- Proportional shrink: smaller padding, slightly smaller fonts
- No restructuring, no hamburger, no hiding elements
- Scratchpad (left) and page links (right) both remain visible
- Mobile styling extends the existing `@media (max-width: 600px)` block

---

## Homepage Header (After Refactor)

**Removed from homepage header:**
- Scratchpad widget (moved to nav bar)

**Unchanged in homepage header:**
- `<h1>` title with accent span: "Dan's AI Learning Hub"
- Tagline paragraph
- Progress bar
- Add Resource button
- **Weather widget** — stays in its current top-right absolute position

Header width, centering, and vertical spacing unchanged. The homepage header becomes slightly cleaner once the scratchpad widget is removed from it; weather remains exactly where it was.

---

## News Page (`news.html`)

**Full page structure** — not a partial, not injected content. Standalone HTML file that includes:

- Same `<head>` block as `index.html` (title: "Dan's AI Learning Hub — News"; same meta tags, same embedded CSS)
- Same top nav bar (with "News" as the active link), including the scratchpad widget on the left
- Page body containing only the placeholder content (see below)
- Same footer as `index.html`
- Scratchpad widget HTML + JS (duplicated from `index.html`)
- **No weather widget** — weather is homepage-only

**Placeholder content for v5b-1:**
- Centered `<h1>` heading: "AI News"
- One-sentence paragraph below: "News feed coming soon."
- No skeleton rows, no placeholder cards, no filter bar, no section headers
- Styling matches the existing typographic scale and color palette

**What `news.html` does NOT include in v5b-1:**
- No `/api/news` fetch logic (that ships in v5b-2)
- No section structure, news cards, or feed rendering
- No weather widget, no `/api/weather` call
- No new `<script>` blocks beyond what's needed for nav + scratchpad

---

## Files Touched

- `index.html` — restructure header: remove scratchpad widget from `<header>`, add new nav bar above `<header>`. Nav bar contains scratchpad (left) and page links (right). Weather widget remains in its current position in the homepage header. All existing homepage features (resource cards, filters, modals, add resource, etc.) unchanged.
- `news.html` — new file. Standalone HTML with the same `<head>`, nav bar (with scratchpad), and footer as `index.html`. Body contains only the placeholder heading + sentence. No weather widget.
- `CLAUDE.md` — update to document the multi-page architecture. Add `news.html` to the files list. Note that nav bar and scratchpad code is duplicated between pages (intentional tradeoff); weather is homepage-only. No new localStorage keys.

---

## Data Preservation Rule
No changes to localStorage keys or schemas. All existing keys (`ai_resources`, `ai_categories`, `ai_resource_types`, `ai_completion_data`, `ai_scratchpad`, `ai_card_notes`, `ai_weather_city`) persist unchanged. Scratchpad content carries naturally across both pages since both pages read/write the same `ai_scratchpad` key. `ai_weather_city` continues to work on the homepage only.

---

## Visual Styling
Follows existing dark-mode palette. Nav bar uses `--bg-card` background and `--border` for the bottom edge — no new color tokens introduced. Underline active state uses `--accent-primary`, consistent with the existing filter bar's accent color.

---

## Known Tradeoffs
- **Duplicated nav + scratchpad code** between `index.html` and `news.html`. Accepted for v5b-1. Less duplication than a "all widgets in nav" approach would require, since weather stays homepage-only.
- **Brief white flash on navigation** between pages due to full page loads (not SPA). Typically imperceptible on Vercel; not worth engineering around.
- **Weather unavailable on news page** — deliberate choice. Weather is a "glance once per session" utility. Users landing on the site will see it on the homepage (or navigate there briefly if needed). Not worth the duplication cost for a rare use case.
- **`migrate.html` stays hidden** — no nav entry. Accessed via direct URL only. It's a one-time utility, not a destination.

---

## Out of Scope for v5b-1
- News feed content (ships in v5b-2)
- RSS parsing, serverless function for news (`api/news.js`) — all v5b-2
- Any third page or additional nav entries (e.g., future financial news page)
- Weather widget on the news page
- Shared component extraction (no build step, no runtime partial injection)
- Any changes to the Add Resource modal, Edit Review modal, card note modal, or any other existing homepage feature

---

## Manual Setup
None required. No new environment variables, no new API keys, no third-party services. Build is self-contained within the existing repo and deploys to Vercel on push to `main`.

---

## Acceptance Criteria
1. Top nav bar renders on both `index.html` and `news.html`, sticky at top of viewport
2. Scratchpad (left) and page links (right: Home | News) visible in nav on both pages
3. Weather widget visible only on homepage, in its current top-right position
4. Active page underlined in nav; clicking the other page link navigates to that page in the same tab
5. Scratchpad content persists across both pages (reads/writes `ai_scratchpad` from both)
6. Weather widget unchanged in functionality — still reads/writes `ai_weather_city`, still calls `/api/weather`, still displays on homepage only
7. Homepage loses its scratchpad widget from the `<header>` but keeps weather; all other homepage features unchanged
8. `news.html` displays only "AI News" heading + "News feed coming soon" paragraph (plus nav and scratchpad)
9. Mobile viewport (≤600px): nav elements remain visible and functional on both pages
10. Opened scratchpad panel renders above the nav bar (not clipped behind it) on both pages
11. Opened weather panel on homepage renders above the nav bar (not clipped)
12. All existing localStorage keys and user data untouched
