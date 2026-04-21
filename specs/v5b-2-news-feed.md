# v5b-2 — AI News Feed Spec

## Goal
Populate the `news.html` page shell (built in v5b-1) with a live AI news feed aggregated from three RSS sources. Build a serverless function to fetch, parse, merge, sanitize, and cache the feeds. Render a two-section news page with lab announcements on top and industry news below. Introduces the project's first npm dependency (`rss-parser`) and establishes the multi-source aggregation pattern for future content types (e.g., v6 financial news).

---

## Architecture

**Flow:**
`Browser (news.html) → fetch('/api/news') → Serverless function (api/news.js) → Promise.allSettled of 3 RSS fetches → rss-parser parses each XML → merge, sort, sanitize → combined JSON → Browser renders two sections`

**Backend:** `api/news.js` — CommonJS serverless function. Fetches 3 RSS feeds in parallel using `Promise.allSettled` (so one failing feed doesn't kill the whole response). Parses each feed with `rss-parser`. Returns JSON with per-section results and per-feed success/failure status.

**Caching:** Vercel CDN response caching via HTTP header:
`res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60')`

This means: serve cached response for 600 seconds (10 min). After expiry, serve stale response for up to 60 additional seconds while fetching fresh in the background. Effectively zero latency for users during cache misses within the SWR window. Zero caching logic required — handled by Vercel's edge network.

**Rendering responsibility:** Backend returns data keyed by source (e.g., `openai`, `googleai` as separate keys under `labAnnouncements`). Backend does NOT pre-order items across sources. Frontend is responsible for rendering order within a section (OpenAI block first, then Google AI block in Lab Announcements).

**No API keys, no environment variables, no external paid services.** All three RSS feeds are publicly accessible. Zero operational cost.

---

## Feed Sources

Three feeds, each with a defined role. All URLs must be verified in the planning phase before code is written (fetch each URL, confirm valid RSS, confirm recent items).

| Feed | Role | URL | Status |
|------|------|-----|--------|
| OpenAI News | Primary lab source | `https://openai.com/news/rss.xml` | Verified working (returns valid RSS 2.0) |
| Google Research | Primary lab source (covers DeepMind + broader Google AI) | `https://research.google/blog/rss` | To verify in planning phase |
| TechCrunch AI | Industry coverage | `https://techcrunch.com/category/artificial-intelligence/feed/` | To verify in planning phase |

If a URL fails verification in planning, stop and propose a replacement before proceeding. Do not hand-roll scrapers or pull from community-maintained feeds — the project rejected that fragility for Anthropic and DeepMind; same principle applies here.

---

## Page Layout

**Section 1: Lab Announcements**
- Section header: "LAB ANNOUNCEMENTS" styled like existing homepage category dividers (uppercase, letter-spaced, `--text-secondary`, horizontal divider line extending to the right)
- Content: 2 most recent items from OpenAI + 2 most recent items from Google Research = 4 items total
- **Grouping & order:** items grouped by source, not interleaved. Frontend renders OpenAI's 2 items first (newest first within OpenAI), followed by Google AI's 2 items (newest first within Google AI). The backend returns these as separate keys; rendering order is a frontend concern.
- This guarantees both labs are always represented regardless of publishing cadence mismatch

**Section 2: Industry News**
- Section header: "INDUSTRY NEWS" styled to match Section 1
- Content: 15 most recent TechCrunch AI items
- **Sort:** chronological, newest first

**Section ordering:** Lab Announcements above Industry News. Fixed order.

---

## News Item Rendering

**Layout:** Vertical list, single column. Each item is a full-width row with clear vertical separation.

**Fields per item:**
1. **Source badge** — short label indicating origin. Visual style matches the existing `.tag` class from homepage cards (small uppercase pill).
   - "OpenAI" for OpenAI News
   - "Google AI" for Google Research
   - "TechCrunch" for TechCrunch AI
2. **Title** — the RSS item title. Primary visual weight (larger font, primary text color).
3. **Date** — hybrid format (see Date Formatting section). Muted text color.
4. **Summary** — 1–2 line snippet. Sanitized per rules below. Secondary text color. If the feed provides no summary, this line is hidden for that item (not replaced with a placeholder).

**Summary sanitization & truncation (exact rules):**
- Strip all HTML tags via regex: `/<[^>]*>/g` replaced with empty string
- Decode basic entities: `&amp;` → `&`, `&lt;` → `<`, `&gt;` → `>`, `&quot;` → `"`, `&#39;` → `'`
- Trim leading/trailing whitespace
- Collapse multiple consecutive whitespace chars to single space
- If result length > 150 chars: truncate to 149 chars and append `…` (one character ellipsis), for a total final length of exactly 150 chars
- If result length ≤ 150 chars: leave as-is, no ellipsis
- If result is empty after processing: omit the summary field for that item (frontend hides the summary line)

**Click behavior:** The entire item row is a clickable link wrapped in `<a>` with:
- `href` = article URL from RSS `<link>` field
- `target="_blank"` — opens in new tab
- `rel="noopener"` — security best practice for external links

Hover state: subtle background lift matching the existing homepage card hover pattern (use `--bg-card-hover`).

---

## Date Formatting

Hybrid format — relative for recent items, absolute for older items:

| Age | Format | Example |
|-----|--------|---------|
| < 1 minute | "just now" | — |
| < 60 minutes | "X min ago" | "23 min ago" |
| < 24 hours | "X hours ago" | "7 hours ago" |
| Same year, > 24 hours | "Mon DD" | "Apr 18" |
| Different year | "Mon DD, YYYY" | "Apr 18, 2025" |

Date calculation based on the current date relative to the RSS `<pubDate>` field. Timezone-agnostic (uses UTC) — acceptable edge case for a personal news aggregator.

---

## Serverless Function (`api/news.js`)

**Format:** CommonJS (`module.exports`) — matches existing `api/weather.js` pattern.

**Dependencies:** `rss-parser` package, pinned to `^3.13.0`. First npm dependency in the project. Must add `package.json` and list it under `dependencies`. Vercel automatically installs dependencies on deploy.

**`parser.parseURL(url)` behavior:** `rss-parser`'s `parseURL` method handles both the HTTP fetch AND the XML parsing in a single call. No separate `fetch()` step needed. Returns a parsed feed object with an `items` array.

**High-level structure:**

```js
const Parser = require('rss-parser');
const parser = new Parser();

const FEEDS = [
  { id: 'openai',      label: 'OpenAI',     url: 'https://openai.com/news/rss.xml' },
  { id: 'googleai',    label: 'Google AI',  url: 'https://research.google/blog/rss' },
  { id: 'techcrunch',  label: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
];

module.exports = async (req, res) => {
  // Promise.allSettled of 3 parser.parseURL calls
  // Build response object per spec below
  // Set Cache-Control header
  // Return JSON
};
```

**Response shape (always the same keys, regardless of success/failure):**

```json
{
  "labAnnouncements": {
    "openai": {
      "status": "ok",
      "items": [ { "title": "...", "link": "...", "summary": "...", "pubDate": "ISO string" }, ... ]
    },
    "googleai": {
      "status": "ok",
      "items": [ ... ]
    }
  },
  "industryNews": {
    "techcrunch": {
      "status": "ok",
      "items": [ ... ]
    }
  }
}
```

**On per-feed failure:** `status` becomes `"error"` and `items` is an empty array (`[]`). The `items` key is always present, never omitted. This simplifies frontend logic — checking `items.length === 0` works regardless of status, and accessing `.items` is always safe.

---

**Item processing:**
- Lab feeds (OpenAI, Google AI): take top 2 items after sort by `pubDate` descending
- TechCrunch: take top 15 items after sort by `pubDate` descending
- For each item, extract `title`, `link`, `pubDate`
- Derive `summary` from `contentSnippet` (rss-parser's pre-stripped field) if available; fall back to `content` stripped of HTML; apply summary sanitization rules from News Item Rendering section

**Error handling:**
- Wrap each feed fetch in its own try/catch via `Promise.allSettled`
- Log errors server-side (`console.error` with feed id) for debugging via Vercel logs
- Per-feed failure: that source reports error state in response, other sources render normally
- Total failure (all 3 feeds fail): response still returns 200 with all sources in error state; frontend handles this as "News unavailable"

**HTTP response:**
- Status: always 200 on function success (per-feed failures are reported in the JSON, not via HTTP status)
- Headers: `Content-Type: application/json`, `Cache-Control: s-maxage=600, stale-while-revalidate=60`
- Status 500 only on unexpected serverless function errors (e.g., uncaught exception outside the Promise.allSettled block)

---

## Frontend Logic (`news.html`)

**Page load sequence:**
1. Render page skeleton immediately: nav bar, section headers ("LAB ANNOUNCEMENTS", "INDUSTRY NEWS"), skeleton rows
2. Fire `fetch('/api/news')` on `DOMContentLoaded`
3. When response resolves, replace skeleton rows with real items per section (OpenAI block first, then Google AI block within Lab Announcements; chronological within Industry News)
4. On per-source error, replace that source's skeletons with an error message for that section (see Per-section error state below)
5. On total failure (network error, non-200 response, or all sources in error state), show unified "News unavailable" state

**Skeleton rows:**
- Section 1 (Lab Announcements): render 4 skeleton rows total (matching final item count)
- Section 2 (Industry News): render 15 skeleton rows
- Each skeleton is a gray placeholder with approximate shape of a real item (source badge shape + title line + date line + summary line)
- CSS-only, no animation library — subtle pulse animation via CSS `@keyframes` acceptable but not required

**Per-section error state:**
- Section header still renders normally
- In place of items: muted text message — "Could not load Lab Announcements" or "Could not load Industry News"
- If only one source within Lab Announcements fails (e.g., OpenAI works but Google AI errors), render the successful source's items normally and show a small inline error where the failing source's items would have been (e.g., "Could not load Google AI items"). The full section header stays the same.
- No retry button (refresh the page to retry)

**Total failure state:**
- If the fetch itself fails (network error, non-200), OR every source returns `status: "error"`: replace entire feed area (both sections) with a single message matching the weather widget's error pattern
- Message: "News unavailable"
- Styling: centered, muted text, similar visual weight to the weather widget's error state in `index.html` (reference the existing `.weather-error-text` or equivalent for consistency)

**No filter bar, no search, no pagination.** Scope-controlled for v5b-2.

---

## Files Touched

- `api/news.js` — new CommonJS serverless function. Fetches 3 RSS feeds via `rss-parser`, merges/sanitizes/caches, returns JSON per spec above.
- `package.json` — new file at repo root. Declares `rss-parser@^3.13.0` as the only dependency. No `engines` field (let Vercel use its default runtime — matches existing setup where the weather widget works without a `package.json`).
- `news.html` — extend the v5b-1 placeholder shell. Remove "News feed coming soon" placeholder. Add section structure, skeleton rows, fetch logic, render logic, error handling, date formatting utility. Styling embedded in the existing `<style>` block (follow `index.html` conventions).
- `CLAUDE.md` — update. Add `api/news.js` to routes list. Add `package.json` / `rss-parser` to stack section. Document the multi-source aggregation pattern. Note that this is the project's first npm dependency.
- `DECISIONS.md` — append dated entry documenting (1) the shift away from zero-dependency as a principle, (2) the choice of `rss-parser` over hand-parsing XML, (3) the grouped-by-source layout within Lab Announcements, (4) the `Promise.allSettled` pattern for multi-source aggregation (contrast with `Promise.all` used in `api/weather.js`).

---

## Data Preservation Rule
No new localStorage keys. No changes to existing keys or schemas. News feed is fully server-derived and re-fetched per page load (within the cache window) — no client-side persistence needed.

---

## Visual Styling
Follows existing dark-mode palette. News item backgrounds use `--bg-card`, borders use `--border`, hover state darkens to `--bg-card-hover` matching the homepage card pattern. Source badges reuse the `.tag` class styling from homepage cards for visual consistency. Section dividers match the existing homepage category header pattern.

---

## Performance Expectations
- **Cached response:** ~50–100ms from function invocation to JSON return
- **Uncached response (cache miss):** dominated by slowest of 3 RSS fetches — typically 300–800ms
- **Page load:** skeleton renders immediately; real content appears within the function response time
- **Cache hit rate:** high. With a 10-minute cache and multiple daily visits, most requests hit cache
- **Zero external cost:** RSS feeds are free, Vercel serverless is free at this scale

---

## Known Tradeoffs
- **10-minute cache latency:** if a source publishes mid-cache-window, items appear up to ~10 minutes late. Acceptable for a personal news aggregator.
- **Lab Announcements can show stale items:** if OpenAI or Google AI hasn't published recently, their "top 2" may be 1–3 weeks old. This is honest — section headers signal "latest announcements," not "new in the last day."
- **`rss-parser` adds first npm dependency.** Project is no longer zero-dependency. Accepted because hand-rolled XML parsing is fragile across real-world RSS variations. Documented in `DECISIONS.md`.
- **No retry UI on errors:** user must refresh page manually. Keeps scope tight.
- **TechCrunch summaries may include promotional/ad boilerplate.** The HTML-stripping + truncation pipeline handles most of this but isn't perfect. Acceptable — if it becomes a problem, add source-specific cleanup in a future version.
- **Timezone edge case on date formatting:** "24 hours" boundary uses UTC; users viewing late at night may see items flip from "23 hours ago" to "Apr 18" at UTC midnight rather than local midnight. Not worth fixing for v5b-2.

---

## Out of Scope for v5b-2
- Search or filter within the news feed
- Pagination or "load more" behavior
- Dedup across feeds (unlikely to be needed with these 3 sources; revisit if observed)
- Per-source filter toggles
- Saved / bookmarked articles
- AI-powered summarization or reranking (deferred to a potential future version — hybrid Option C from the interview)
- Thumbnails / images
- Retry button on errors
- Auto-refresh or real-time updates (Server-Sent Events, WebSockets, polling)
- Any redesign of the homepage or the v5b-1 nav bar
- Any changes to weather widget, scratchpad, or other existing features

---

## Manual Setup
None required. No new environment variables, no new API keys, no third-party service sign-ups. Vercel automatically installs `rss-parser` from `package.json` on deploy.

---

## Pre-Build Verification (Planning Phase)
Before writing any code, the planning phase must:
1. Fetch each of the 3 RSS URLs and confirm valid RSS response with recent items
2. If any URL fails verification, stop and propose an alternative from the same category (primary lab source for a lab feed; broad AI news publication for an industry feed)
3. Inspect `contentSnippet` and `content` fields across all 3 feeds to confirm summary extraction strategy is viable
4. Confirm `rss-parser@^3.13.0` resolves to a current stable version; no need to research alternative versions

---

## Acceptance Criteria
1. `news.html` renders two distinct sections: "LAB ANNOUNCEMENTS" (top) and "INDUSTRY NEWS" (bottom), each with homepage-style divider headers
2. Lab Announcements section displays 4 items: 2 OpenAI items (grouped, newest first), then 2 Google AI items (grouped, newest first)
3. Industry News section displays 15 TechCrunch items, newest-first chronological
4. Each item displays: source badge + title + date + summary (summary line hidden if absent or empty)
5. Summaries are exactly ≤ 150 characters; items > 150 chars are truncated to 149 chars + `…`
6. Clicking anywhere on an item opens the article URL in a new tab with `rel="noopener"`
7. Dates display in hybrid format (relative under 24h, absolute for older)
8. Page load shows skeleton rows immediately; real content replaces skeletons when fetch resolves
9. Per-section error displays "Could not load [section name]" in place of items; other sections render normally
10. Per-source error within Lab Announcements (e.g., only Google AI fails) renders the working source's items plus an inline error for the failing source
11. Total failure displays "News unavailable" in place of the feed area, matching weather widget's error pattern
12. `api/news.js` sets `Cache-Control: s-maxage=600, stale-while-revalidate=60` header on successful responses
13. `api/news.js` uses `Promise.allSettled` — a single feed failure does not break the whole response
14. `api/news.js` strips HTML tags, decodes basic entities, and truncates summaries per the exact rules in News Item Rendering
15. Backend always returns `items: []` (never omitted) on source failure; frontend can safely access `.items.length` without null checks
16. `package.json` declares `rss-parser@^3.13.0`; Vercel deploy succeeds with automatic install
17. No new localStorage keys introduced; all existing keys untouched
18. Weather widget (homepage) and scratchpad widget (both pages) continue to function identically to v5b-1
