import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

import sql, { initDB } from "./db";
import { runScrape, getScrapingStatus, scrapeSingleCity } from "./scraper";
import { findCityByChineseName, findNearestMajorCity, getCityOptions, majorCities } from "./cityDirectory";
import path from "path";

const port = process.env.PORT ?? 8080;
const staticDir = path.join(__dirname, '../../frontend/dist');

// Initialize DB before starting server
await initDB();
// Start initial scrape after DB is ready
runScrape().catch(console.error);

const app = new Elysia()
  .use(cors())
  // Get all cities metadata (static list + coordinates)
  .get("/api/cities", () => {
    return majorCities.map(c => ({
      en: c.en,
      cn: c.cn,
      tier: c.tier,
      lat: c.lat,
      lng: c.lng,
    }));
  })
  .get("/api/city-options", ({ query }) => {
    const keyword = typeof query.q === "string" ? query.q : "";
    return getCityOptions(keyword);
  })
  // Locate user's city by coordinates
  .get("/api/my-city", async ({ query }) => {
    const lat = parseFloat(query.lat as string);
    const lng = parseFloat(query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      return { error: "Invalid coordinates" };
    }

    const today = new Date().toISOString().split('T')[0];
    const { city: nearest, distance } = findNearestMajorCity(lat, lng);

    // If user is close to a known city, return it directly
    if (distance < 150) {
      const rows = await sql`
        SELECT city_cn as city, city_en, date, level_code as "levelCode", level_name as level, color, msg, source
        FROM pollen_data WHERE city_en = ${nearest.en} AND date = ${today} LIMIT 1
      `;
      return {
        city: { en: nearest.en, cn: nearest.cn, lat: nearest.lat, lng: nearest.lng },
        distance: Math.round(distance),
        inList: true,
        data: rows[0] || null,
      };
    }

    // Not close to any major city — try reverse geocoding
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=zh&zoom=10`,
        { headers: { "User-Agent": "PollenRadar/1.0" } }
      );
      const geo: any = await geoRes.json();
      const cityName = geo.address?.city || geo.address?.town || geo.address?.county || '';

      if (cityName) {
        const matched = findCityByChineseName(cityName);
        if (matched) {
          // Scrape this city on demand
          await scrapeSingleCity(matched.en, matched.cn);
          const rows = await sql`
            SELECT city_cn as city, city_en, date, level_code as "levelCode", level_name as level, color, msg, source
            FROM pollen_data WHERE city_en = ${matched.en} AND date = ${today} LIMIT 1
          `;
          return {
            city: { en: matched.en, cn: matched.cn, lat: matched.lat, lng: matched.lng },
            distance: 0,
            inList: matched.inList,
            data: rows[0] || null,
          };
        }
      }
    } catch (e) {
      console.error("Reverse geocode failed:", e);
    }

    // Fallback: return nearest major city
    const rows = await sql`
      SELECT city_cn as city, city_en, date, level_code as "levelCode", level_name as level, color, msg, source
      FROM pollen_data WHERE city_en = ${nearest.en} AND date = ${today} LIMIT 1
    `;
    return {
      city: { en: nearest.en, cn: nearest.cn, lat: nearest.lat, lng: nearest.lng },
      distance: Math.round(distance),
      inList: true,
      data: rows[0] || null,
    };
  })
  // Get scrape status
  .get("/api/scrape-status", () => {
    return getScrapingStatus();
  })
  // Get today's pollen data
  .get("/api/pollen", async () => {
    runScrape().catch(console.error);

    const today = new Date().toISOString().split('T')[0];
    const data = await sql`
      SELECT city_cn as city, city_en, date, level_code as "levelCode", level_name as level, color, msg, source
      FROM pollen_data
      WHERE date = ${today}
      ORDER BY level_code DESC
    `;
    return data;
  })
  // Get historical pollen data for a city
  .get("/api/pollen/:city", async ({ params: { city } }) => {
    runScrape().catch(console.error);

    const data = await sql`
      SELECT date, level_code as "levelCode", level_name as level, color, msg, source
      FROM pollen_data
      WHERE city_en = ${city}
      ORDER BY date ASC
    `;
    return data;
  })
  // Submit a pollen rating
  .post("/api/rating", async ({ body, request }) => {
    const { city_en, score, fingerprint } = body as { city_en: string; score: number; fingerprint: string };
    if (!city_en || !score || !fingerprint) {
      return { error: "Missing required fields" };
    }
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return { error: "Score must be integer 1-5" };
    }

    const today = new Date().toISOString().split('T')[0];
    await sql`
      INSERT INTO pollen_ratings (city_en, date, score, fingerprint)
      VALUES (${city_en}, ${today}, ${score}, ${fingerprint})
      ON CONFLICT (city_en, date, fingerprint) DO UPDATE SET
        score = EXCLUDED.score,
        created_at = NOW()
    `;

    // Return updated summary
    const summary = await sql`
      SELECT
        COUNT(*)::int as count,
        ROUND(AVG(score), 1)::float as avg,
        json_agg(score) as scores
      FROM pollen_ratings
      WHERE city_en = ${city_en} AND date = ${today}
    `;
    return summary[0] || { count: 0, avg: 0, scores: [] };
  })
  // Get rating summary for a city today
  .get("/api/ratings/:city", async ({ params: { city } }) => {
    const today = new Date().toISOString().split('T')[0];
    const summary = await sql`
      SELECT
        COUNT(*)::int as count,
        ROUND(AVG(score), 1)::float as avg,
        json_agg(score ORDER BY created_at DESC) as scores
      FROM pollen_ratings
      WHERE city_en = ${city} AND date = ${today}
    `;
    const row = summary[0];
    if (!row || row.count === 0) return { count: 0, avg: 0, distribution: [0,0,0,0,0] };

    // Build distribution array [count_1, count_2, count_3, count_4, count_5]
    const dist = [0,0,0,0,0];
    for (const s of (row.scores as number[])) {
      dist[s - 1]++;
    }
    return { count: row.count, avg: row.avg, distribution: dist };
  })
  .get("/", () => Bun.file(path.join(staticDir, 'index.html')))
  .get("/*", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return;

    const filePath = path.join(staticDir, url.pathname);
    const file = Bun.file(filePath);

    return file.exists().then(exists => {
      if (exists) return file;
      return Bun.file(path.join(staticDir, 'index.html'));
    });
  })
  .listen(port);

console.log(
  `🌿 花粉雷达 server running at ${app.server?.hostname}:${app.server?.port}`
);
