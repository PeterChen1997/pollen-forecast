import sql from './db';
import {
  type CityDef,
  findCityByChineseName,
  findNearestMajorCity,
  haversineDistance,
  majorCities,
} from './cityDirectory';

export async function scrapeSingleCity(cityEn: string, cityCn: string): Promise<void> {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const past = new Date(today);
  past.setDate(past.getDate() - 7);
  const startDate = past.toISOString().split('T')[0];
  const city: CityDef = { en: cityEn, cn: cityCn, id: 0, tier: 2, lat: 0, lng: 0 };
  await fetchPollenData(city, startDate, endDate);
}

// Track which cities are currently being scraped
const scrapingCities = new Set<string>();
let isScraping = false;

export function getScrapingStatus() {
  return {
    isScraping,
    scrapingCities: Array.from(scrapingCities),
  };
}

// ============================================================
// Data Source: P0 - weatherdt (primary)
// ============================================================
const fetchPollenData = async (city: CityDef, startDate: string, endDate: string): Promise<boolean> => {
  const url = `https://graph.weatherdt.com/ty/pollen/v2/hfindex.html?eletype=1&city=${city.en}&start=${startDate}&end=${endDate}&predictFlag=true`;
  let hasData = false;
  try {
    scrapingCities.add(city.en);
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;

    const data: any = await response.json();
    if (data && data.dataList && data.dataList.length > 0) {
      for (const row of data.dataList) {
        if (row.levelCode == null || row.levelCode < 0) continue;
        await sql`
          INSERT INTO pollen_data (city_en, city_cn, date, level_code, level_name, color, msg, source)
          VALUES (${city.en}, ${city.cn}, ${row.addTime}, ${row.levelCode ?? -1}, ${row.level || '暂无'}, ${row.color || ''}, ${row.levelMsg || ''}, 'weatherdt')
          ON CONFLICT(city_en, date) DO UPDATE SET
            level_code = EXCLUDED.level_code,
            level_name = EXCLUDED.level_name,
            color = EXCLUDED.color,
            msg = EXCLUDED.msg,
            source = EXCLUDED.source
        `;
        hasData = true;
      }
    }
  } catch (error) {
    console.error(`[P0 weatherdt] Error for ${city.en}:`, error);
  } finally {
    scrapingCities.delete(city.en);
  }
  return hasData;
};

// ============================================================
// Data Source: P1 - QWeather indices API (花粉过敏指数 type=7)
// Requires QWEATHER_KEY env var
// ============================================================
const QWEATHER_KEY = process.env.QWEATHER_KEY || '';
// Custom API Host from console (e.g. abcxyz.qweatherapi.com). Falls back to devapi.qweather.com
const QWEATHER_HOST = process.env.QWEATHER_HOST || 'devapi.qweather.com';

// QWeather level (1-5) → our level_code (0-5) mapping + colors
const qweatherLevelMap: Record<number, { code: number; name: string; color: string; msg: string }> = {
  1: { code: 0, name: '未检测', color: '#A8D8EA', msg: '花粉浓度极低，可自由进行户外活动。(过敏指数)' },
  2: { code: 1, name: '很低',  color: '#81C784', msg: '花粉浓度较低，一般不会引发过敏。(过敏指数)' },
  3: { code: 2, name: '偏高',  color: '#FFB74D', msg: '花粉浓度中等，敏感人群注意防护。(过敏指数)' },
  4: { code: 3, name: '较高',  color: '#FF8A65', msg: '花粉浓度偏高，建议佩戴口罩。(过敏指数)' },
  5: { code: 5, name: '很高',  color: '#FF2319', msg: '花粉浓度极高，减少外出，规范用药。(过敏指数)' },
};

const fetchQWeatherPollen = async (city: CityDef, dateStr: string): Promise<boolean> => {
  if (!QWEATHER_KEY) return false;

  const locationParam = `${city.lng.toFixed(2)},${city.lat.toFixed(2)}`;
  const url = `https://${QWEATHER_HOST}/v7/indices/1d?location=${locationParam}&type=7&key=${QWEATHER_KEY}`;

  try {
    scrapingCities.add(city.en);
    const response = await fetch(url, {
      headers: { "User-Agent": "PollenRadar/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;

    const data: any = await response.json();
    if (data.code !== '200' || !data.daily || data.daily.length === 0) return false;

    const item = data.daily[0];
    const level = parseInt(item.level) || 0;
    const mapped = qweatherLevelMap[level];
    if (!mapped) return false;

    await sql`
      INSERT INTO pollen_data (city_en, city_cn, date, level_code, level_name, color, msg, source)
      VALUES (${city.en}, ${city.cn}, ${dateStr}, ${mapped.code}, ${mapped.name}, ${mapped.color},
              ${item.text || mapped.msg}, 'qweather')
      ON CONFLICT(city_en, date) DO NOTHING
    `;
    console.log(`[P1 qweather] ${city.cn}: level ${level} → ${mapped.name}`);
    return true;
  } catch (error) {
    console.error(`[P1 qweather] Error for ${city.en}:`, error);
    return false;
  } finally {
    scrapingCities.delete(city.en);
  }
};

// ============================================================
// Data Source: P2 - Nearby city interpolation (no external call)
// Uses inverse-distance-weighted average of nearest cities with data
// ============================================================
const levelColors: Record<number, string> = {
  0: '#A8D8EA', 1: '#81C784', 2: '#FFB74D', 3: '#FF8A65', 4: '#EF5350', 5: '#FF2319',
};
const levelNames: Record<number, string> = {
  0: '未检测', 1: '很低', 2: '较低', 3: '偏高', 4: '较高', 5: '很高',
};
const levelMsgs: Record<number, string> = {
  0: '花粉浓度极低，可自由活动。(邻近推算)',
  1: '花粉浓度较低，一般无需担心。(邻近推算)',
  2: '花粉浓度偏低，敏感人群适当注意。(邻近推算)',
  3: '花粉浓度中等，建议佩戴口罩。(邻近推算)',
  4: '花粉浓度偏高，减少外出。(邻近推算)',
  5: '花粉浓度极高，避免户外活动。(邻近推算)',
};

const interpolateFromNearbyCities = async (city: CityDef, dateStr: string): Promise<boolean> => {
  try {
    // Get today's data for all cities from DB
    const rows = await sql`
      SELECT city_en, level_code FROM pollen_data
      WHERE date = ${dateStr} AND source = 'weatherdt' AND level_code >= 0
    `;
    if (rows.length < 3) return false; // not enough data to interpolate

    // Build city→levelCode map from DB data
    const cityMap = new Map(majorCities.map(c => [c.en, c]));
    const neighbors: { dist: number; level: number }[] = [];

    for (const row of rows) {
      const neighbor = cityMap.get(row.city_en);
      if (!neighbor || neighbor.en === city.en) continue;
      const dist = haversineDistance(city.lat, city.lng, neighbor.lat, neighbor.lng);
      if (dist < 800) { // within 800km
        neighbors.push({ dist: Math.max(dist, 1), level: row.level_code });
      }
    }

    if (neighbors.length < 2) return false;

    // Inverse distance weighted average
    let weightSum = 0;
    let valueSum = 0;
    for (const n of neighbors) {
      const w = 1 / (n.dist * n.dist); // inverse square
      weightSum += w;
      valueSum += w * n.level;
    }

    const estimated = Math.round(valueSum / weightSum);
    const clamped = Math.max(0, Math.min(5, estimated));

    await sql`
      INSERT INTO pollen_data (city_en, city_cn, date, level_code, level_name, color, msg, source)
      VALUES (${city.en}, ${city.cn}, ${dateStr}, ${clamped},
              ${levelNames[clamped] || '未知'}, ${levelColors[clamped] || '#94a3b8'},
              ${levelMsgs[clamped] || ''}, 'nearby')
      ON CONFLICT(city_en, date) DO NOTHING
    `;
    console.log(`[P2 nearby] ${city.cn}: interpolated level ${clamped} from ${neighbors.length} neighbors`);
    return true;
  } catch (error) {
    console.error(`[P2 nearby] Error for ${city.en}:`, error);
    return false;
  }
};

// ============================================================
// Main scrape orchestrator with fallback chain
// ============================================================
export const runScrape = async () => {
  if (isScraping) return;

  // Check rate limit: 15 minutes
  const lastScrapedRows = await sql`SELECT last_scraped_at FROM scrape_log ORDER BY id DESC LIMIT 1`;
  if (lastScrapedRows.length > 0) {
    const lastTime = new Date(lastScrapedRows[0].last_scraped_at).getTime();
    const now = Date.now();
    if (now - lastTime < 15 * 60 * 1000) {
      console.log("Scraped recently, skipping. Last scraped at:", lastScrapedRows[0].last_scraped_at);
      return;
    }
  }

  isScraping = true;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const past = new Date(today);
  past.setDate(past.getDate() - 7);
  const pastStr = past.toISOString().split('T')[0];

  // --- Phase 1: P0 weatherdt (primary source for all cities) ---
  console.log("[Phase 1] P0 weatherdt scrape starting...");
  const citiesWithData = new Set<string>();

  for (const city of majorCities) {
    console.log(`  Scraping ${city.cn} (${city.en})...`);
    scrapingCities.add(city.en);
    const ok = await fetchPollenData(city, pastStr, todayStr);
    if (ok) citiesWithData.add(city.en);
    await new Promise(r => setTimeout(r, 300));
  }

  // Check which cities still have no data for today
  const todayRows = await sql`
    SELECT DISTINCT city_en FROM pollen_data WHERE date = ${todayStr}
  `;
  for (const row of todayRows) citiesWithData.add(row.city_en);

  const missingCities = majorCities.filter(c => !citiesWithData.has(c.en));
  console.log(`[Phase 1] Done. ${citiesWithData.size} cities have data, ${missingCities.length} missing.`);

  // --- Phase 2: P1 QWeather fallback for missing cities ---
  if (missingCities.length > 0 && QWEATHER_KEY) {
    console.log(`[Phase 2] P1 QWeather fallback for ${missingCities.length} cities...`);
    for (const city of missingCities) {
      const ok = await fetchQWeatherPollen(city, todayStr);
      if (ok) citiesWithData.add(city.en);
      await new Promise(r => setTimeout(r, 200));
    }
  } else if (missingCities.length > 0 && !QWEATHER_KEY) {
    console.log(`[Phase 2] Skipped - QWEATHER_KEY not set. ${missingCities.length} cities still missing.`);
  }

  // --- Phase 3: P2 Nearby interpolation for remaining missing cities ---
  const stillMissing = majorCities.filter(c => !citiesWithData.has(c.en));
  if (stillMissing.length > 0) {
    console.log(`[Phase 3] P2 Nearby interpolation for ${stillMissing.length} cities...`);
    for (const city of stillMissing) {
      await interpolateFromNearbyCities(city, todayStr);
    }
  }

  await sql`INSERT INTO scrape_log (last_scraped_at) VALUES (NOW())`;
  console.log("Scrape finished (all phases).");
  isScraping = false;
};

// Initial scrape is triggered from index.ts after DB init
