import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router = Router();

// Resolve CSV path relative to this compiled file (dist/routes/places.js → workspace root)
const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "..", "..", "..", "atlas_places.csv");

type Place = {
  name: string;
  location: string;
  category: string;
  description: string;
  url: string;
  city: string;
  country: string;
};

function parseCSV(content: string): Place[] {
  const lines = content.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (values[i] ?? "").trim();
    });
    return record as unknown as Place;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function loadPlaces(): Place[] {
  try {
    const content = readFileSync(CSV_PATH, "utf-8");
    return parseCSV(content);
  } catch {
    return [];
  }
}

// GET /api/places — return all places with optional filters
router.get("/places", (req, res) => {
  const places = loadPlaces();

  const { category, country, city, q } = req.query as Record<string, string>;

  let filtered = places;
  if (category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
  }
  if (country) {
    filtered = filtered.filter(
      (p) => p.country.toLowerCase().includes(country.toLowerCase()),
    );
  }
  if (city) {
    filtered = filtered.filter(
      (p) => p.city.toLowerCase().includes(city.toLowerCase()),
    );
  }
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query),
    );
  }

  res.json({ total: filtered.length, places: filtered });
});

// GET /api/places/stats — summary statistics
router.get("/places/stats", (req, res) => {
  const places = loadPlaces();

  const categoryCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};

  for (const p of places) {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    if (p.country && p.country !== "Unknown") {
      countryCounts[p.country] = (countryCounts[p.country] ?? 0) + 1;
    }
    if (p.city && p.city !== "Unknown") {
      cityCounts[p.city] = (cityCounts[p.city] ?? 0) + 1;
    }
  }

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  const categories = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  res.json({
    total: places.length,
    categories,
    topCountries,
    topCities,
  });
});

export default router;
