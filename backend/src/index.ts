import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import db from "./db";
import { runScrape } from "./scraper";
import path from "path";

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({
    assets: path.join(__dirname, '../../frontend/dist'),
    prefix: '/'
  }))
  .get("/api/pollen", async () => {
    // Run scrape asynchronously (non-blocking) on visit
    runScrape().catch(console.error);

    const today = new Date().toISOString().split('T')[0];
    const data = db.query(`
      SELECT city_cn as city, city_en, date, level_code as levelCode, level_name as level, color, msg
      FROM pollen_data
      WHERE date = $date
      ORDER BY levelCode DESC
    `).all({ $date: today as any });

    return data;
  })
  .get("/api/pollen/:city", async ({ params: { city } }) => {
    // Run scrape asynchronously (non-blocking) on visit
    runScrape().catch(console.error);

    const data = db.query(`
      SELECT date, level_code as levelCode, level_name as level, color, msg
      FROM pollen_data
      WHERE city_en = $city
      ORDER BY date ASC
    `).all({ $city: city as any });

    return data;
  })
  .get("/", ({ set }) => {
    set.redirect = '/index.html';
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
