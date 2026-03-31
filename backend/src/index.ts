import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

import sql, { initDB } from "./db";
import { runScrape, getScrapingStatus, majorCities } from "./scraper";
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
  // Get scrape status
  .get("/api/scrape-status", () => {
    return getScrapingStatus();
  })
  // Get today's pollen data
  .get("/api/pollen", async () => {
    runScrape().catch(console.error);

    const today = new Date().toISOString().split('T')[0];
    const data = await sql`
      SELECT city_cn as city, city_en, date, level_code as "levelCode", level_name as level, color, msg
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
      SELECT date, level_code as "levelCode", level_name as level, color, msg
      FROM pollen_data
      WHERE city_en = ${city}
      ORDER BY date ASC
    `;
    return data;
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
