# Threat Actor Globe

A realtime global cyber threat activity monitor that ingests live news data from [GDELT 2.0](https://www.gdeltproject.org/) and visualizes cyber-attack incidents on an interactive map with deck.gl. Incidents are attributed to known threat actors via a curated alias table covering ~120 APT groups, ransomware operators, hacktivist collectives, and influence operations.

## Features

- **Live GDELT ingestion** — fetches and parses the GKG 15-minute file stream, filtering for cyber-related themes (`CYBER_ATTACK`, `TAX_FNCACT_HACKER`, `CRIME_CYBERCRIME`, etc.)
- **Threat actor attribution** — matches article text (organizations, persons, title, URL) against a curated table of ~120 known threat actors and their aliases (e.g. APT28 / Fancy Bear / Forest Blizzard / Strontium)
- **Interactive deck.gl globe** — hexbin heat layer + incident scatter points colored by sentiment tone
- **Country filter** — multi-select targeted countries with searchable list; filters incidents, stats, timeline, actors, and themes simultaneously
- **Actor filter** — dropdown of attributed threat actors with live incident counts
- **Dynamic theme filter** — dropdown populated from actual themes in the dataset with counts
- **Incident list** — searchable event list in the sidebar with tone badges, timestamps, actor, theme, and country
- **Incident detail drawer** — click any incident (globe or list) to see full details and article link; the globe flies to and highlights the incident location
- **Stats bar** — total incidents, attributed actors, targeted countries, average tone, time window
- **Timeline chart** — daily incident volume with tone-colored bars
- **SSE live updates** — server pushes new incidents to the browser every 30 seconds
- **Auto-ingest scheduler** — server fetches new GDELT files every 15 minutes

## Architecture

```
GDELT 2.0 (15-min GKG files)
        │
        ▼
┌──────────────────┐     ┌──────────────┐
│  server/gdelt.ts │────▶│  server/db   │  SQLite (node:sqlite)
│  ZIP extraction   │     │  (WAL mode)  │  data/incidents.db
│  GKG CSV parser   │     └──────┬───────┘
│  Theme filtering  │            │
│  Actor matching   │            ▼
└──────────────────┘     ┌──────────────┐
                         │ server/index │  Fastify
                         │  /api/*      │  :8787
                         │  SSE stream  │
                         └──────┬───────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  src/ (React +     │  Vite :5173
                     │  deck.gl +        │
                     │  MapLibre GL)     │
                     └───────────────────┘
```

## Tech Stack

- **Frontend**: Vite, React 18, deck.gl v9 (HexagonLayer, ScatterplotLayer), MapLibre GL
- **Backend**: Fastify, `node:sqlite` (Node.js built-in — no native deps)
- **Data**: GDELT 2.0 GKG files, curated threat actor alias table
- **Language**: TypeScript throughout

## Getting Started

### Prerequisites

- Node.js 22+ (uses built-in `node:sqlite`)

### Install

```bash
npm install
```

### Backfill historical data

```bash
npm run ingest -- --hours=24
```

Fetches and parses GDELT GKG files for the last 24 hours (~1.2s per 15-min file). Data is stored in `data/incidents.db`.

### Run the dev server

```bash
npm run dev
```

Starts both:
- Vite dev server on `http://localhost:5173`
- Fastify API server on `http://localhost:8787` (with auto-ingest every 15 min)

### Production

```bash
npm run build
npm start
```

The start script:
- Builds the frontend automatically on first run (if `dist/` doesn't exist)
- Starts the server in the background with PID file tracking (`.server.pid`)
- Logs to `server.log`
- Exposes the server on a configurable host and port (defaults to `0.0.0.0:8787`)

```bash
# Default
npm start

# Custom port
PORT=3000 npm start

# Localhost only
HOST=127.0.0.1 PORT=8080 npm start

# Stop the server
npm run stop
```

The stop script performs a graceful `SIGTERM` shutdown with a 10-second timeout, falling back to `SIGKILL` if needed.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/incidents` | GeoJSON FeatureCollection of incidents (supports `?country=`, `?since=`, `?until=`, `?theme=`, `?actor=`, `?limit=`) |
| `GET /api/countries` | List of targeted countries with incident counts |
| `GET /api/actors` | List of attributed threat actors with incident counts (respects filters) |
| `GET /api/themes` | List of distinct themes with incident counts (respects filters) |
| `GET /api/stats` | Aggregate stats (total, actors, countries, avg tone, time range) |
| `GET /api/timeline` | Daily incident volume and average tone |
| `GET /api/stream` | SSE stream — pushes new incidents every 30s |
| `GET /api/ingest?hours=N` | Trigger a manual ingest for the last N hours |

## Data Flow

1. **Ingest** (`server/ingest.ts`): Fetches the GDELT masterfilelist, downloads new GKG ZIP files, extracts them, parses the TSV CSV, filters for cyber themes, extracts locations and actor names, and inserts into SQLite.
2. **Attribution** (`server/threatActors.ts`): Matches article text against a curated alias table using word-boundary regex. Generic-word aliases (e.g. "Predator", "Cuba", "Play") require cyber context keywords to match, avoiding false positives.
3. **API** (`server/index.ts`): Serves filtered GeoJSON, stats, and SSE updates. All endpoints share a common `buildWhere` clause so country/theme/actor/time filters apply consistently.
4. **Frontend** (`src/App.tsx`): Fetches filtered data, renders deck.gl layers on a MapLibre dark basemap, and provides interactive filtering.

## Project Structure

```
server/
  db.ts              SQLite layer (node:sqlite, WAL, indexed)
  gdelt.ts           GDELT fetcher, ZIP extractor, GKG parser
  ingest.ts          15-min scheduler, throttled ingestion
  threatActors.ts    Curated ~120 threat actor alias table
  index.ts           Fastify API server
shared/
  types.ts           Shared TypeScript types
src/
  App.tsx            Main app — state, filtering, layer composition
  api/client.ts      Fetch + SSE client
  components/
    GlobeView.tsx       MapLibre + deck.gl overlay
    CountryFilter.tsx   Multi-select country list
    IncidentList.tsx    Searchable event list
    IncidentDrawer.tsx  Click-through incident details
    StatsBar.tsx        Aggregate statistics
    TimelinePanel.tsx   Daily volume chart
scripts/
  start.sh           Start production server (background, PID-tracked)
  stop.sh            Stop running server (graceful shutdown)
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | `8787` | Server port |
| `HOST` | `0.0.0.0` | Bind address (`0.0.0.0` = all interfaces, `127.0.0.1` = localhost only) |
| `AUTO_INGEST` | `1` | Enable auto-ingest scheduler (`0` to disable) |
| `DB_PATH` | `data/incidents.db` | SQLite database path |
| `LOG_FILE` | `server.log` | Server log output file |
| `INGEST_SINCE_HOURS` | `6` | Default lookback for `npm run ingest` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server in background (builds frontend if needed) |
| `npm run stop` | Stop the running server (graceful SIGTERM → SIGKILL fallback) |
| `npm run dev` | Start Vite + Fastify in dev mode with hot reload |
| `npm run build` | Build frontend for production (`dist/`) |
| `npm run ingest` | Run GDELT ingester (use `-- --hours=N` for lookback) |
| `npm run typecheck` | Type-check frontend and server TypeScript |

## Data Sources

- **GDELT 2.0** — Global Knowledge Graph, 15-minute GKG files from `data.gdeltproject.org/gdeltv2/`
- **Threat actor aliases** — Curated from MITRE ATT&CK, ESET Research, Microsoft Threat Intelligence naming conventions
- **Basemap** — CARTO dark tiles

## Limitations

- **Actor attribution is sparse** — GDELT indexes general news; most cyber-attack articles don't name the threat actor. Attribution rate is typically ~1-5% of incidents.
- **GDELT publish lag** — Files appear in the masterfilelist ~15-30 minutes before they're uploaded. The ingester stops early on 404 to avoid noise.
- **Rate limiting** — GDELT requests are throttled to ~1 req/sec.
- **Single-file GKG parsing** — Each 15-min file is downloaded and parsed in full (~5-10MB compressed).
