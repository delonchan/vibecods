# Private Football Scouting Dashboard (Next.js)

A starter Next.js App Router project for a private football scouting dashboard.

## Features

- Next.js App Router (`app/`)
- Main dashboard page at `/`
- Backend route at `/api/scout`
- Environment variable configuration for Football-data.org
- Mock data as the default source
- Integration-ready service layer for Football-data.org

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
