import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';
import db from "./db";
import { runScrape } from "./scraper";
import path from "path";
import fs from "fs";

const port = parseInt(process.env.PORT || "8080");
const host = "0.0.0.0"; // bind to all interfaces for docker

// Get static directory relative to this script
const staticDir = path.join(__dirname, '../../frontend/dist');

const app = new Elysia()
  .use(cors())
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
  .use(staticPlugin({
    assets: staticDir,
    prefix: '/'
  }))
  .get("/", ({ set }) => {
      set.headers['Content-Type'] = 'text/html';
      return fs.readFileSync(path.join(staticDir, 'index.html'), 'utf8');
  })
  .get("/*", ({ set, request }) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/assets/')) return;

      set.headers['Content-Type'] = 'text/html; charset=utf8';
      return fs.readFileSync(path.join(staticDir, 'index.html'), 'utf8');
  })
  .listen({ port, hostname: host });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
