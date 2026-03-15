# Private Football Scouting Dashboard (Next.js)

A starter Next.js App Router project for a private football scouting dashboard.

## Features

- Next.js App Router (`app/`)
- Main dashboard page at `/`
- Backend route at `/api/scout`
- Environment variable configuration for Football-data.org
- Mock data as the default source
- Integration-ready service layer for Football-data.org
- Persistent prediction history (local JSON file)
- Metrics endpoints for prediction evaluation

## Environment variables

Copy `.env.example` to `.env.local` and adjust values:

- `FOOTBALL_DATA_BASE_URL` — base URL for Football-data.org API
- `FOOTBALL_DATA_API_KEY` — your API key
- `USE_MOCK_SCOUT_DATA` — set to `true` (default) for mock responses
- `SCOUT_TEAM_ID` — team id to request once live integration is enabled

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API routes

- `GET /api/scout` — enriched upcoming matches
- `GET /api/scout/metrics` — aggregate prediction accuracy metrics
- `GET /api/scout/history` — stored prediction history
- `POST /api/scout/refresh` — server-side refresh helper
  - `?mode=upcoming` refresh upcoming predictions only
  - `?mode=reconcile` reconcile finished matches only
  - no mode (or `mode=all`) runs both

## Server-side refresh scripts (cron-friendly)

These scripts call the same underlying server logic used by the API routes and are safe to run repeatedly.

### 1) Refresh upcoming predictions

Generates/updates upcoming match predictions and persists new snapshots without duplicating existing `match_id` records.

```bash
npm run scout:refresh
```

### 2) Reconcile finished matches

Reconciles completed fixtures and updates stored prediction records with final score, actual result, and evaluation fields.

```bash
npm run scout:reconcile
```

## Example cron usage (HP server)

```bash
# every 30 minutes: refresh upcoming predictions
*/30 * * * * cd /path/to/vibecods && npm run scout:refresh >> /var/log/scout-refresh.log 2>&1

# every 60 minutes: reconcile finished matches
0 * * * * cd /path/to/vibecods && npm run scout:reconcile >> /var/log/scout-reconcile.log 2>&1
```
