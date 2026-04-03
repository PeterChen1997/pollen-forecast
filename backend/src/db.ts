import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Initialize tables
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS pollen_data (
      id SERIAL PRIMARY KEY,
      city_en TEXT NOT NULL,
      city_cn TEXT NOT NULL,
      date TEXT NOT NULL,
      level_code INTEGER NOT NULL,
      level_name TEXT NOT NULL,
      color TEXT,
      msg TEXT,
      source TEXT NOT NULL DEFAULT 'weatherdt',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(city_en, date)
    )
  `;

  // Add source column if missing (existing deployments)
  await sql`
    ALTER TABLE pollen_data ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'weatherdt'
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scrape_log (
      id SERIAL PRIMARY KEY,
      last_scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pollen_ratings (
      id SERIAL PRIMARY KEY,
      city_en TEXT NOT NULL,
      date TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
      fingerprint TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(city_en, date, fingerprint)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_pollen_ratings_city_date
    ON pollen_ratings (city_en, date)
  `;

  console.log('Database tables initialized.');
}

export default sql;
