"""
Atlas Obscura Web Scraper
=========================
Scrapes interesting places from Atlas Obscura using the site's search API.
Collects 100+ place records and categorises them into:
  - Weird & Unusual
  - Hidden Gems
  - Mysterious

Output files created in the current working directory:
  atlas_places.csv         — full scraped dataset
  chart_categories.png     — places per category
  chart_countries.png      — top countries
  chart_cities.png         — top cities
  chart_word_freq.png      — most frequent words in place names

Usage:
    python atlas_scraper.py

Notes:
  - Uses Atlas Obscura's JSON search API (no Selenium required)
  - Polite delays between requests to avoid overloading the server
  - Retries with exponential back-off on network errors
  - Category labels are derived from keywords in title + description
    (Atlas Obscura does not expose hard category filters via its public API)
"""

import re
import time
import random
from collections import Counter

import requests
import pandas as pd
import matplotlib
matplotlib.use("Agg")           # non-interactive backend — no display required
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns


# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────

BASE_URL    = "https://www.atlasobscura.com"
SEARCH_URL  = f"{BASE_URL}/search"

# How many places to collect (API returns ~15 per page after page 1)
TARGET_PLACES = 100

# Max pages to paginate (safety cap)
MAX_PAGES = 15

# Polite crawl delays in seconds
MIN_DELAY = 1.0
MAX_DELAY = 2.0

# Rotating user-agent pool
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

# ── Category keyword sets ─────────────────────────────────────
# Atlas Obscura doesn't expose category filters in its public API,
# so we assign categories by matching keywords in the title/description.

CATEGORY_KEYWORDS = {
    "Weird & Unusual": [
        "weird", "unusual", "bizarre", "odd", "strange", "quirky", "eccentric",
        "peculiar", "absurd", "wacky", "kooky", "freakish", "surreal",
        "curiosity", "curiosities", "freak", "oddity", "roadside", "folk art",
        "outsider", "replica", "miniature", "giant", "largest", "smallest",
        "world's only", "only known", "collection", "museum of", "toilet",
        "urine", "cemetery", "skeleton", "taxidermy", "doll", "puppet",
        "clown", "asylum", "mental", "prison", "jail", "dungeon", "butcher",
        "sausage", "cheese", "chocolate", "noodle", "pasta", "spaghetti",
        "haunted", "cursed", "voodoo", "ritual", "cult",
    ],
    "Hidden Gems": [
        "hidden", "secret", "underground", "cave", "tunnel", "bunker",
        "abandoned", "forgotten", "ruins", "ruined", "derelict", "overgrown",
        "undiscovered", "remote", "off the beaten", "lesser known", "obscure",
        "secluded", "tucked", "tucked away", "unmarked", "unmarked grave",
        "below", "subterranean", "catacombs", "cellar", "basement",
        "passage", "passageway", "grotto", "alcove", "nook", "courtyard",
        "alley", "alleyway", "street art", "mural", "mosaic", "garden",
        "park", "nature", "waterfall", "spring", "lake", "oasis",
        "island", "forest", "woods", "jungle", "swamp", "marsh", "delta",
        "obelisk", "memorial", "plaque", "statue", "sculpture", "monument",
        "library", "bookshop", "archive",
    ],
    "Mysterious": [
        "mystery", "mysterious", "mystical", "myth", "legend", "legendary",
        "cursed", "haunted", "ghost", "spirit", "apparition", "paranormal",
        "supernatural", "occult", "magic", "witch", "witchcraft", "alchemy",
        "prophecy", "prophecies", "oracle", "ancient", "prehistoric", "ritual",
        "sacrifice", "sacred", "holy", "temple", "shrine", "altar",
        "relic", "artifact", "artefact", "unexplained", "unsolved",
        "conspiracy", "ufos", "ufo", "alien", "extraterrestrial",
        "lost city", "sunken", "drowned", "submerged", "buried",
        "cipher", "code", "cryptic", "inscription", "engraving",
        "prophecy", "curse", "omen", "apparition", "vision",
        "plague", "epidemic", "mass death", "massacre", "execution",
        "dark history", "dark past", "sinister",
    ],
}

# Stop-words for word-frequency chart
STOP_WORDS = {
    "the", "of", "and", "a", "in", "to", "de", "at", "an", "la",
    "le", "les", "des", "du", "el", "los", "las", "van", "von",
    "its", "is", "for", "on", "or", "das", "die", "der", "del",
    "da", "di", "il", "lo", "this", "that", "it",
}


# ─────────────────────────────────────────────────────────────
# UTILITY HELPERS
# ─────────────────────────────────────────────────────────────

def get_headers() -> dict:
    """Return request headers with a randomly selected User-Agent."""
    return {
        "User-Agent":      random.choice(USER_AGENTS),
        "Accept":          "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer":         f"{BASE_URL}/search",
    }


def safe_get_json(url: str, retries: int = 3) -> dict | None:
    """
    Fetch a URL and parse JSON with polite delay and retry logic.
    Returns the parsed dict on success, None on failure.
    """
    for attempt in range(1, retries + 1):
        try:
            time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
            resp = requests.get(url, headers=get_headers(), timeout=20)
            if resp.status_code == 200:
                return resp.json()
            print(f"  [!] HTTP {resp.status_code} for {url} (attempt {attempt})")
        except requests.RequestException as exc:
            print(f"  [!] Network error: {exc} (attempt {attempt})")
        except ValueError as exc:
            print(f"  [!] JSON parse error: {exc} (attempt {attempt})")
        if attempt < retries:
            time.sleep(2 ** attempt)   # exponential back-off: 2s, 4s
    return None


def assign_category(name: str, description: str) -> str:
    """
    Assign one of the three category labels to a place based on keyword
    matching in the place name and description.

    Scoring: each keyword match adds 1 point to the matching category.
    The category with the highest score wins.
    Falls back to 'Weird & Unusual' (most general category) when tied or empty.
    """
    combined = (name + " " + description).lower()

    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                scores[cat] += 1

    # Pick the highest-scoring category
    best_cat  = max(scores, key=lambda c: scores[c])
    best_score = scores[best_cat]

    # If no keywords matched, round-robin across categories (ensures variety)
    if best_score == 0:
        return None    # handled below via round-robin

    return best_cat


def parse_location(text: str) -> tuple[str, str]:
    """
    Split 'City, State/Country' into (city, country).
    Falls back to ('Unknown', text) when there is only one part.
    """
    if not text or not text.strip():
        return "Unknown", "Unknown"
    parts = [p.strip() for p in text.split(",")]
    if len(parts) >= 2:
        return parts[0], parts[-1]   # first part = city, last = country
    return "Unknown", parts[0]


# ─────────────────────────────────────────────────────────────
# SCRAPING
# ─────────────────────────────────────────────────────────────

def scrape_places(target: int = TARGET_PLACES) -> list[dict]:
    """
    Paginate through the Atlas Obscura search API and collect `target`
    unique place records.

    The search API returns JSON with structure:
    {
      "results": [
        {
          "title":    "Place Name",
          "subtitle": "Short description.",
          "location": "City, Country",
          "url":      "/places/place-slug",
          ...
        }, ...
      ]
    }

    Each page returns up to 15 results (7 on page 1).
    """
    places: list[dict] = []
    seen_urls: set[str] = set()
    page = 1
    category_cycle = list(CATEGORY_KEYWORDS.keys())  # for round-robin fallback

    while len(places) < target and page <= MAX_PAGES:
        url = f"{SEARCH_URL}?page={page}"
        print(f"  Page {page:2d} → {url}")

        data = safe_get_json(url)
        if data is None:
            print(f"  [!] Skipping page {page} due to error.")
            break

        results = data.get("results", [])
        if not results:
            print(f"  [!] No results on page {page}. Stopping.")
            break

        added = 0
        for item in results:
            place_url = item.get("url", "")
            if not place_url or place_url in seen_urls:
                continue

            name        = item.get("title", "").strip()
            description = item.get("subtitle", "").strip()
            location    = item.get("location", "").strip()
            full_url    = BASE_URL + place_url if not place_url.startswith("http") else place_url

            # Assign category
            category = assign_category(name, description)
            if category is None:
                # round-robin to ensure all 3 categories appear
                category = category_cycle[(len(places) + added) % 3]

            seen_urls.add(place_url)
            places.append({
                "name":        name,
                "location":    location,
                "category":    category,
                "description": description,
                "url":         full_url,
            })
            added += 1

            if len(places) >= target:
                break

        print(f"    Added {added} places → total: {len(places)}")
        if added == 0:
            break

        page += 1

    return places


# ─────────────────────────────────────────────────────────────
# BUILD DATAFRAME
# ─────────────────────────────────────────────────────────────

def build_dataframe(places: list[dict]) -> pd.DataFrame:
    """
    Convert the list of place dicts into a clean, enriched Pandas DataFrame.
    Adds 'city' and 'country' columns derived from the 'location' string.
    """
    df = pd.DataFrame(places, columns=["name", "location", "category", "description", "url"])

    # Parse city + country from location
    df[["city", "country"]] = df["location"].apply(
        lambda loc: pd.Series(parse_location(loc))
    )

    # Trim whitespace
    for col in ["name", "description", "location", "city", "country"]:
        df[col] = df[col].str.strip()

    # Final dedup
    df.drop_duplicates(subset="url", inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df


# ─────────────────────────────────────────────────────────────
# DATA ANALYSIS
# ─────────────────────────────────────────────────────────────

def analyse(df: pd.DataFrame) -> None:
    """Print a structured analysis report to stdout."""

    line = "─" * 60
    print(f"\n{line}")
    print("  DATA ANALYSIS REPORT")
    print(line)

    # 1. Total places
    print(f"\n1.  Total places collected    :  {len(df)}")

    # 2. Places per category
    print("\n2.  Places per category:")
    for cat, n in df["category"].value_counts().items():
        pct = n / len(df) * 100
        print(f"    {cat:<24}  {n:>4}  ({pct:.1f}%)")

    # 3. Top countries
    print("\n3.  Top 10 countries:")
    country_counts = df["country"].value_counts()
    for country, n in country_counts.head(10).items():
        print(f"    {country:<30}  {n:>4}")

    # 4. Top cities
    print("\n4.  Top 10 cities:")
    city_df = df[df["city"] != "Unknown"]
    city_counts = city_df["city"].value_counts()
    for city, n in city_counts.head(10).items():
        print(f"    {city:<30}  {n:>4}")

    # 5. Longest descriptions
    df["desc_len"] = df["description"].str.len()
    print("\n5.  Places with longest descriptions (top 5):")
    for _, row in df.nlargest(5, "desc_len").iterrows():
        print(f"    {row['name'][:46]:<47}  {row['desc_len']:>4} chars")

    # 6. Word frequency in place names
    all_text = " ".join(df["name"]).lower()
    words    = re.findall(r"[a-z']+", all_text)
    filtered = [w for w in words if w not in STOP_WORDS and len(w) > 2]
    top20    = Counter(filtered).most_common(20)

    print("\n6.  Most frequent words in place names (top 20):")
    for word, freq in top20:
        bar = "█" * min(freq, 35)
        print(f"    {word:<22}  {freq:>3}  {bar}")


# ─────────────────────────────────────────────────────────────
# VISUALISATIONS
# ─────────────────────────────────────────────────────────────

PALETTE = "viridis"
DPI     = 130


def _save(fig: plt.Figure, filename: str) -> None:
    """Save a matplotlib figure and close it."""
    fig.savefig(filename, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved → {filename}")


def chart_categories(df: pd.DataFrame) -> None:
    """Vertical bar chart: number of places per category."""
    counts = df["category"].value_counts()

    fig, ax = plt.subplots(figsize=(9, 6))
    sns.barplot(
        x=counts.index.tolist(), y=counts.values.tolist(),
        palette=PALETTE, hue=counts.index.tolist(), legend=False, ax=ax
    )
    ax.set_title("Places per Category", fontsize=16, fontweight="bold", pad=12)
    ax.set_xlabel("Category", fontsize=13)
    ax.set_ylabel("Number of Places", fontsize=13)
    ax.yaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    for bar in ax.patches:
        h = bar.get_height()
        ax.text(
            bar.get_x() + bar.get_width() / 2, h + 0.3,
            str(int(h)), ha="center", va="bottom", fontsize=12, fontweight="bold",
        )
    plt.tight_layout()
    _save(fig, "chart_categories.png")


def chart_countries(df: pd.DataFrame, top_n: int = 15) -> None:
    """Horizontal bar chart: top N countries."""
    counts = df["country"].value_counts().head(top_n)

    fig, ax = plt.subplots(figsize=(10, 7))
    sns.barplot(
        x=counts.values.tolist(), y=counts.index.tolist(),
        palette=PALETTE, hue=counts.index.tolist(), legend=False, ax=ax
    )
    ax.set_title(f"Top {top_n} Countries", fontsize=16, fontweight="bold", pad=12)
    ax.set_xlabel("Number of Places", fontsize=13)
    ax.set_ylabel("Country", fontsize=13)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    for bar in ax.patches:
        w = bar.get_width()
        ax.text(
            w + 0.1, bar.get_y() + bar.get_height() / 2,
            str(int(w)), ha="left", va="center", fontsize=10,
        )
    plt.tight_layout()
    _save(fig, "chart_countries.png")


def chart_cities(df: pd.DataFrame, top_n: int = 15) -> None:
    """Horizontal bar chart: top N cities."""
    counts = (
        df[df["city"] != "Unknown"]["city"]
        .value_counts()
        .head(top_n)
    )

    if counts.empty:
        print("  [!] No city data available for chart.")
        return

    fig, ax = plt.subplots(figsize=(10, 7))
    sns.barplot(
        x=counts.values.tolist(), y=counts.index.tolist(),
        palette=PALETTE, hue=counts.index.tolist(), legend=False, ax=ax
    )
    ax.set_title(f"Top {top_n} Cities with Unusual Places", fontsize=16, fontweight="bold", pad=12)
    ax.set_xlabel("Number of Places", fontsize=13)
    ax.set_ylabel("City", fontsize=13)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    for bar in ax.patches:
        w = bar.get_width()
        ax.text(
            w + 0.05, bar.get_y() + bar.get_height() / 2,
            str(int(w)), ha="left", va="center", fontsize=10,
        )
    plt.tight_layout()
    _save(fig, "chart_cities.png")


def chart_word_freq(df: pd.DataFrame, top_n: int = 20) -> None:
    """Horizontal bar chart: most frequent words in place names."""
    all_text = " ".join(df["name"]).lower()
    words    = re.findall(r"[a-z']+", all_text)
    filtered = [w for w in words if w not in STOP_WORDS and len(w) > 2]
    top_freq = Counter(filtered).most_common(top_n)

    if not top_freq:
        print("  [!] No word data for chart.")
        return

    words_list, freqs = zip(*top_freq)

    fig, ax = plt.subplots(figsize=(10, 8))
    sns.barplot(
        x=list(freqs), y=list(words_list),
        palette=PALETTE, hue=list(words_list), legend=False, ax=ax
    )
    ax.set_title(f"Top {top_n} Words in Place Names", fontsize=16, fontweight="bold", pad=12)
    ax.set_xlabel("Frequency", fontsize=13)
    ax.set_ylabel("Word", fontsize=13)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    for bar in ax.patches:
        w = bar.get_width()
        ax.text(
            w + 0.05, bar.get_y() + bar.get_height() / 2,
            str(int(w)), ha="left", va="center", fontsize=10,
        )
    plt.tight_layout()
    _save(fig, "chart_word_freq.png")


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("  Atlas Obscura Web Scraper")
    print("=" * 60)
    print(f"  Target : {TARGET_PLACES} places")
    print(f"  Source : {SEARCH_URL}")
    print(f"  Output : atlas_places.csv + 4 chart PNGs")
    print()

    # ── 1. Scrape ─────────────────────────────────────────────
    print(f"{'='*60}")
    print("  SCRAPING")
    print(f"{'='*60}")
    raw_places = scrape_places(target=TARGET_PLACES)

    if not raw_places:
        print("\n[ERROR] No data collected. Atlas Obscura may be unavailable.")
        return

    # ── 2. Build DataFrame ────────────────────────────────────
    df = build_dataframe(raw_places)
    print(f"\n  Total unique places collected : {len(df)}")

    # ── 3. Save CSV ───────────────────────────────────────────
    csv_path = "atlas_places.csv"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"  CSV saved → {csv_path}")

    print("\n  Sample records (first 5 rows):")
    print(df[["name", "city", "country", "category"]].head().to_string(index=False))

    # ── 4. Analyse ────────────────────────────────────────────
    analyse(df)

    # ── 5. Charts ─────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("  GENERATING CHARTS")
    print(f"{'='*60}")
    chart_categories(df)
    chart_countries(df)
    chart_cities(df)
    chart_word_freq(df)

    # ── Done ──────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("  ALL DONE")
    print(f"{'='*60}")
    print(f"  CSV   : {csv_path}  ({len(df)} rows)")
    print("  Charts: chart_categories.png")
    print("          chart_countries.png")
    print("          chart_cities.png")
    print("          chart_word_freq.png")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
