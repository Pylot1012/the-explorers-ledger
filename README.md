# The Explorer's Ledger

A full end-to-end data project built around [Atlas Obscura](https://www.atlasobscura.com) — a website cataloguing the world's most unusual and overlooked places.

The scraper pulls 100 place records from the Atlas Obscura search API, classifies them into three categories, runs analysis across 42 countries and 87 cities, and exposes the data through a REST API and interactive dashboard.

---

## What's Inside

| File / Folder | Description |
|---|---|
| `atlas_scraper.py` | Python scraper — runs the full pipeline |
| `atlas_places.csv` | Scraped dataset (100 rows × 7 columns) |
| `chart_categories.png` | Places per category |
| `chart_countries.png` | Top 15 countries |
| `chart_cities.png` | Top 15 cities |
| `chart_word_freq.png` | Top 20 words in place names |
| `requirements.txt` | Python dependencies |
| `artifacts/api-server/` | REST API (TypeScript / Express) |
| `artifacts/mockup-sandbox/` | Interactive dashboard (React) |

---

## Categories

Places are classified into three categories via keyword matching on title and description:

- **Weird & Unusual** — 31 places
- **Hidden Gems** — 50 places
- **Mysterious** — 19 places

---

## Running the Scraper

### Requirements

- Python 3.9+
- An internet connection

### Setup

```bash
# Clone the repo
git clone https://github.com/Pylot1012/the-explorers-ledger.git
cd the-explorers-ledger

# (Recommended) Create a virtual environment
python -m venv .venv
source .venv/bin/activate   # macOS / Linux
.venv\Scripts\Activate.ps1  # Windows PowerShell

# Install dependencies
pip install -r requirements.txt
```

### Run

```bash
python atlas_scraper.py
```

The script takes a couple of minutes — it paginates through the Atlas Obscura search API with polite delays to avoid rate limiting. All output files are written to the current working directory.

---

## REST API

Built with Node.js, Express, and TypeScript.

| Endpoint | Description |
|---|---|
| `GET /api/places` | All 100 places. Optional query params: `category`, `country`, `city`, `q` (search) |
| `GET /api/places/stats` | Summary stats — totals, category breakdown, top countries, top cities |

### Example

```bash
# All places in Italy
curl "/api/places?country=italy"

# Full-text search
curl "/api/places?q=floating"

# Stats summary
curl "/api/places/stats"
```

---

## Dashboard

An interactive data dashboard — "The Explorer's Ledger" — visualising the full dataset with:

- Summary stat cards (100 places, 42 countries, 87 cities)
- Global distribution bar chart (top 10 countries)
- Category breakdown with percentage bars
- Top cities ranking
- Searchable and filterable places table

---

## How It Works

Atlas Obscura does not expose public category filters in its API, and its listing pages are JavaScript-rendered (not scrapeable with plain HTTP). The working approach is the JSON search endpoint:

```
GET https://www.atlasobscura.com/search?page=N
```

Each page returns 15 place records with name, subtitle (used as description), location string, and URL. City and country are parsed from the location field. Category is assigned via keyword matching.

---

## Stack

**Scraper & Analysis**
- Python 3.11
- `requests` — HTTP client
- `beautifulsoup4` + `lxml` — HTML parsing
- `pandas` — data processing and CSV output
- `matplotlib` + `seaborn` — chart generation

**API**
- Node.js + TypeScript
- Express 5

**Dashboard**
- React + Vite
- Tailwind CSS + shadcn/ui

---

## Dataset Sample

| Name | Location | Category |
|---|---|---|
| Waldemar Julsrud Museum | Acámbaro, Mexico | Mysterious |
| Cypress Swamp Driftwood Family Museum | Pierre Part, Louisiana | Weird & Unusual |
| Antonio Pigafetta Memorial | Vicenza, Italy | Hidden Gems |
| Clinton Home | Nago-shi, Japan | Weird & Unusual |
| Makoko Floating School | Lagos, Nigeria | Hidden Gems |
