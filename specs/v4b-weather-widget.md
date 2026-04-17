# v4b — Weather Widget Spec

## Goal
Add a glanceable weather widget to the AI Learning Hub homepage, using OpenWeatherMap as the data source and Vercel serverless functions as the backend pattern. Serves dual purpose: useful feature + learning exercise for the env-var workflow (required for v5).

---

## Architecture

**Flow:**
`Browser (geolocation or city input) → /api/weather.js (Vercel) → OpenWeatherMap (current + forecast endpoints) → combined JSON → Browser renders`

**Backend:** `api/weather.js` — CommonJS serverless function. Accepts `lat`/`lon` or `city` query params. Makes two parallel calls (`Promise.all`) to OpenWeatherMap:
- `https://api.openweathermap.org/data/2.5/weather` — current conditions
- `https://api.openweathermap.org/data/2.5/forecast` — 5-day / 3-hour intervals, filtered server-side to 3 daily summaries

**Authentication:** Single API key (`OPENWEATHERMAP_API_KEY`) stored as a Vercel environment variable, used on both endpoints. Never in code, never committed. Use `units=imperial` query param.

---

## Widget Placement & Behavior

**Location:** Top-right of header, mirroring scratchpad position (top-left).

**Compact view (always visible):**
- Current temperature (°F)
- Condition icon (emoji, mapped from OWM condition code)

**Expanded view (on click):**
- Current: temp, condition text, high/low
- 3-day forecast: day label + icon + high/low per day

---

## Location Logic

**On page load:**
1. Check localStorage `ai_weather_city` — if set (manual override), use it and skip geolocation
2. Otherwise, prompt browser geolocation
3. On geolocation success → pass lat/lon to `/api/weather`
4. On geolocation failure (denied / timeout / error) → show error state + manual city input

**Manual city override:**
- City input accessible via click/tap on widget (same UI shown in error state and as an override affordance when weather loads successfully)
- Submitting a city saves to localStorage `ai_weather_city` — persists across sessions
- Clearing the manual city reverts to geolocation on next load

---

## Data Refresh
Once per page load. No auto-refresh, no manual refresh button.

---

## Loading State
Skeleton placeholder: `—° ⏳` for compact view; three placeholder rows for expanded forecast. Preserves layout during fetch.

---

## Error State (unified)
Triggered by: geolocation failure OR OpenWeatherMap API failure.
- Display: "Weather unavailable"
- Manual city input field below message
- Same component used in both failure modes

---

## Condition Icon Mapping
Lookup table in `index.html` mapping OWM condition codes (`01d`, `01n`, `02d`, etc.) to emoji. Day/night variants where applicable.

Core mappings:
- `01d / 01n` → ☀️ / 🌙
- `02d / 02n` → 🌤️ / ☁️
- `03d / 03n`, `04d / 04n` → ☁️
- `09d / 09n`, `10d / 10n` → 🌧️
- `11d / 11n` → ⛈️
- `13d / 13n` → ❄️
- `50d / 50n` → 🌫️

---

## New localStorage Key
- `ai_weather_city` — string, user's manually set city name. Empty/absent = use geolocation. Persists across sessions.

This key follows the Data Preservation Rule in `CLAUDE.md` — do not rename or restructure once live.

---

## Files Touched
- `api/weather.js` — new serverless function
- `index.html` — widget markup + styles + fetch logic + emoji mapping + localStorage handling
- `CLAUDE.md` — add `ai_weather_city` to localStorage key list, note new `/api/weather` route
- `specs/v4b-weather-widget.md` — this spec

---

## Visual Styling
Follows existing dark-mode palette: dark grey base, cool blue/teal accents, grey neutrals. Widget blends with header — no new color introductions.

---

## Manual Setup (before running Claude Code)
1. Sign up for OpenWeatherMap free tier (no credit card). Get API key from dashboard after email confirmation. **Note:** new keys can take up to a couple of hours to activate.
2. Add the key to Vercel: Project Settings → Environment Variables → `OPENWEATHERMAP_API_KEY` = your key. Apply to Production, Preview, and Development environments.

---

## Out of Scope for v4b
- Auto-refresh
- Hourly forecast
- Weather alerts / severe weather warnings
- Multi-city support
- Unit toggle (Fahrenheit only)
- SVG icon library (emoji only)
