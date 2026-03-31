import { Database } from "bun:sqlite";

// Initialize SQLite database
// Use a data directory so Docker volumes can persist it
const db = new Database('./data/pollen.sqlite', { create: true });

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS pollen_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_en TEXT NOT NULL,
    city_cn TEXT NOT NULL,
    date TEXT NOT NULL,
    level_code INTEGER NOT NULL,
    level_name TEXT NOT NULL,
    color TEXT,
    msg TEXT,
    UNIQUE(city_en, date)
  );

  CREATE TABLE IF NOT EXISTS scrape_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    last_scraped_at TEXT NOT NULL
  );
`);

export default db;
