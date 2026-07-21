# v5c — Security & Code Quality Audit Fixes

## Goal
Close out the findings from the v5c code/security audit. No new features. Ten small, independent fixes across the serverless functions, `news.html`, `index.html`, and `migrate.html`, plus one dependency verification step. Behavior of every existing feature must be identical after this version except where a fix explicitly changes it (noted per item).

## Scope Decision
In scope: audit findings A, B, C, 1, 2, 3, 4, 6, 7, 8, 9.
Out of scope: finding 5 (CSP / security headers) — deferred as a discussion item because a meaningful CSP conflicts with the inline-script architecture. Also out of scope: rate limiting on `/api/weather` (no simple free implementation on Vercel), and replacing deprecated `document.execCommand` in the scratchpad (pre-existing, unrelated to security).

---

## Fix 1 — RSS fetch timeout (api/news.js) — HIGH
**Problem:** `new Parser()` defaults to a 60s timeout, but Vercel kills the function at ~10s. One hanging feed times out the entire function and all three sections fail — defeating the `Promise.allSettled` design.
**Fix:** `const parser = new Parser({ timeout: 5000 });`
**Behavior change:** a feed that takes >5s now reports `status: "error"` for that source instead of hanging the function. This is the intended fault-tolerance behavior.

## Fix 2 — Link protocol validation (api/news.js) — HIGH
**Problem:** `item.link` from third-party RSS is returned unvalidated and assigned to `a.href` on the frontend. A compromised feed could inject a `javascript:` URL that executes on click.
**Fix (backend, in `processItems`):**
- After sorting and before slicing to `limit`, filter out any item whose `link` fails validation. Filtering before the slice keeps the section counts full when possible.
- Validation rule: `link` must parse via `new URL(link)` without throwing AND `url.protocol` must be exactly `'http:'` or `'https:'`. Anything else (including empty/missing link) → item is dropped.
**Frontend:** no change required — every item the frontend receives now has a validated link.

## Fix 3 — Entity decode order (api/news.js) — LOW
**Problem:** `&amp;` is decoded first in `sanitizeSummary`, so `&amp;lt;` double-decodes to a literal `<`.
**Fix:** reorder the replacement chain so `&amp;` → `&` runs **last**:
`&lt;` → `<`, `&gt;` → `>`, `&quot;` → `"`, `&#39;` → `'`, then `&amp;` → `&`.
No other change to the sanitization pipeline (HTML strip, whitespace collapse, Google AI short-string filter, 150-char truncation all unchanged).

## Fix 4 — Weather endpoint caching + input validation (api/weather.js) — LOW-MED
**Problem A:** no `Cache-Control` header — every page load makes two upstream OpenWeatherMap calls.
**Fix A:** on successful (200) responses only, set:
`Cache-Control: s-maxage=600, stale-while-revalidate=60` (matches the news endpoint pattern; Vercel caches per unique query string, so different cities cache independently). Error responses remain uncached.
**Problem B:** no input validation before proxying to the upstream API.
**Fix B:** return `400 { error: 'Invalid parameters' }` when:
- `lat`/`lon` path: either fails `Number.isFinite(parseFloat(x))`, or lat outside [-90, 90], or lon outside [-180, 180]
- `city` path: empty after `.trim()`, or length > 100 characters
**Known limitation (accepted):** caching does not stop deliberate quota abuse — an attacker can vary params to bypass cache. Accepted residual risk for a free-tier key; validation is a speed bump, not a wall.

## Fix 5 — Scratchpad sanitization on import (migrate.html) — MEDIUM
**Problem:** `ai_scratchpad` is stored as raw HTML and injected via `innerHTML` on every page load. The import flow writes it unsanitized, so a malicious backup file is a stored-XSS vector (`<img onerror=...>`, `javascript:` hrefs — `innerHTML` doesn't run `<script>` tags but does honor event-handler attributes).
**Fix:** sanitize the `ai_scratchpad` value during import, before writing to localStorage:
- Parse with `DOMParser` (`text/html`)
- Remove disallowed elements entirely: `script`, `iframe`, `object`, `embed`, `link`, `style`, `meta`, `form`
- On all remaining elements: remove every attribute whose name starts with `on` (case-insensitive), and remove `href`/`src`/`srcset` attributes whose value (trimmed, case-insensitive) does not start with `http:`, `https:`, or `#`
- Write back the sanitized `body.innerHTML`
**Behavior change:** a legitimate scratchpad backup is unaffected (the formatting toolbar only produces `font`, `b`, `ul`/`li`, `div`, alignment styles). Only hostile content is altered.

## Fix 6 — Import shape validation (migrate.html) — LOW
**Problem:** import checks key presence but not value shapes; a malformed backup imports "successfully" then crashes `index.html` at render.
**Fix:** validate each key present in the import file before writing anything:
- `ai_resources` → `Array.isArray`, every element is an object with string `title`, `url`, `description`, `type`, `category` and an `id` that is string or number
- `ai_categories`, `ai_resource_types` → arrays of strings
- `ai_completion_data`, `ai_card_notes` → plain objects (non-null, non-array)
- `ai_scratchpad`, `ai_weather_city` → strings
- On any failure: abort the entire import (all-or-nothing — no partial writes) and show an error message naming the failing key, styled like the existing import error state.
**Data preservation:** validation logic only — no key renames, no schema changes, existing stored data untouched.

## Fix 7 — esc() parity (news.html) — LOW-MED
**Problem:** the `esc()` copy in `news.html` is missing the `'` → `&#39;` replacement that `index.html` has. Duplication drift.
**Fix:** make `news.html`'s `esc()` byte-identical to `index.html`'s (five replacements: `&`, `<`, `>`, `"`, `'`).

## Fix 8 — Escape weather panel interpolations (index.html) — LOW
**Problem:** `current.temp`, `current.high`, `current.low`, `f.high`, `f.low` are interpolated into `innerHTML` unescaped in `renderWeather`. Data comes from our own function (near-zero risk) but the pattern should be consistent.
**Fix:** wrap all five in `esc()`, matching the treatment of `condition` and `f.day`. No visual change.

## Fix 9 — Delete api/hello.js — CLEANUP
Dead code; health check served its purpose. Delete the file and remove the `/api/hello` line from the CLAUDE.md routes list.

## Fix 10 — Dependency audit — VERIFICATION (pre-build)
Run `npm audit` locally in Terminal before the build starts. Expected result: clean (`rss-parser@^3.13.0` bumped `xml2js` past CVE-2023-0842). If any high/critical finding appears: stop, report it, and decide before proceeding. Record the result in the session log.

---

## Files Touched
- `api/news.js` — Fixes 1, 2, 3
- `api/weather.js` — Fix 4
- `migrate.html` — Fixes 5, 6
- `news.html` — Fix 7
- `index.html` — Fix 8
- `api/hello.js` — deleted (Fix 9)
- `CLAUDE.md` — remove `/api/hello` route; note weather caching and news link validation in backend section
- `DECISIONS.md` — append dated entry: timeout choice (5s vs Vercel's 10s ceiling), link-validation-in-backend decision, all-or-nothing import validation, CSP deferral rationale

## Data Preservation Rule
No localStorage keys renamed, restructured, or migrated. Import validation and sanitization operate on incoming backup data only; existing stored data is never rewritten by this version.

## Pre-Build Verification (Planning Phase)
1. Run `npm audit` (Fix 10) and report result before any code is written
2. Confirm rss-parser `^3.13.0` supports the `timeout` constructor option (it does per docs; verify against installed version)
3. Read the current `migrate.html` import implementation and confirm Fixes 5–6 integrate with its existing error-display pattern — exact insertion points are a planning-phase task, not assumed by this spec

## Acceptance Criteria
1. A deliberately slow/unreachable feed URL (test by temporarily pointing one FEED at an invalid host) results in that source showing its error state while the other two sections render normally — function completes well under 10s
2. An RSS item with a `javascript:` link never reaches the frontend response JSON
3. `&amp;lt;` in a raw summary renders as `&lt;` (literal "&lt;" text), not `<`
4. `/api/weather` responses include `Cache-Control: s-maxage=600, stale-while-revalidate=60` on 200s; `lat=999` returns 400; a 150-char city returns 400
5. Importing a backup whose `ai_scratchpad` contains `<img src=x onerror="alert(1)">` results in a stored value with the `onerror` attribute removed; no alert fires on any page load
6. Importing a backup where `ai_resources` is `"not an array"` aborts with an error naming the key; no localStorage keys are modified
7. `esc()` in `news.html` and `index.html` are identical
8. Weather widget renders identically to v5b-2 for normal data
9. `/api/hello` returns Vercel's 404 after deploy
10. `npm audit` result documented in session log
11. All v5b-2 acceptance criteria still pass: news feed, weather widget, scratchpad, cards, and migrate export all function identically

## Out of Scope
- CSP / security headers (`vercel.json`) — deferred, discussion item for a future session
- Rate limiting on any endpoint
- Replacing `document.execCommand` in the scratchpad
- Any new features, styling changes, or refactors beyond the fixes listed
