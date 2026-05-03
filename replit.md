# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `python atlas_scraper.py` — run Atlas Obscura scraper

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Atlas Obscura Web Scraping Project

### Files
- `atlas_scraper.py` — main Python scraper script
- `atlas_places.csv` — scraped dataset (100 rows, 7 columns)
- `chart_categories.png` — bar chart: places per category
- `chart_countries.png` — bar chart: top 15 countries
- `chart_cities.png` — bar chart: top 15 cities
- `chart_word_freq.png` — bar chart: top 20 words in place names

### Stack
- Python 3.11
- requests — HTTP client
- beautifulsoup4 + lxml — HTML parsing
- pandas — DataFrame and CSV output
- matplotlib + seaborn — data visualisation

### How It Works
Uses Atlas Obscura's JSON search API (`/search?page=N`) to paginate through 100+
place records. Each record contains name, description (subtitle), location, and URL.
Categories (Weird & Unusual / Hidden Gems / Mysterious) are assigned via keyword
matching on title + description since Atlas Obscura doesn't expose category filters
in its public API. City and country are parsed from the `location` field.

### REST API
Live at `/api` via the API server artifact:
- `GET /api/places` — all 100 places, with optional filters: `category`, `country`,
  `city`, `q` (full-text search on name/description)
- `GET /api/places/stats` — totals, category breakdown, top 15 countries, top 15 cities

Implementation: `artifacts/api-server/src/routes/places.ts` reads
`atlas_places.csv` from the workspace root using a small inline CSV parser
(no extra dependencies).

### Dashboard Mockup
"The Explorer's Ledger" — a dark, atmospheric data dashboard visualising the
scraped dataset. Lives at
`artifacts/mockup-sandbox/src/components/mockups/atlas-dashboard/Dashboard.tsx`
and is embedded as an iframe shape on the canvas (shape id: `atlas-dashboard`).
