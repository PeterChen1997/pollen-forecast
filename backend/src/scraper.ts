import sql from './db';

export interface CityDef {
  en: string;
  cn: string;
  id: number;
  tier: 1 | 2;
  lat: number;
  lng: number;
}

export const majorCities: CityDef[] = [
  // Tier 1
  { en: "beijing", cn: "北京", id: 101010100, tier: 1, lat: 39.9042, lng: 116.4074 },
  { en: "shanghai", cn: "上海", id: 101020100, tier: 1, lat: 31.2304, lng: 121.4737 },
  { en: "guangzhou", cn: "广州", id: 101280101, tier: 1, lat: 23.1291, lng: 113.2644 },
  { en: "shenzhen", cn: "深圳", id: 101280601, tier: 1, lat: 22.5431, lng: 114.0579 },
  // New tier 1
  { en: "chengdu", cn: "成都", id: 101270101, tier: 1, lat: 30.5728, lng: 104.0665 },
  { en: "hangzhou", cn: "杭州", id: 101210101, tier: 1, lat: 30.2741, lng: 120.1551 },
  { en: "wuhan", cn: "武汉", id: 101200101, tier: 1, lat: 30.5928, lng: 114.3055 },
  { en: "xian", cn: "西安", id: 101110101, tier: 1, lat: 34.3416, lng: 108.9398 },
  { en: "chongqing", cn: "重庆", id: 101040100, tier: 1, lat: 29.5332, lng: 106.5050 },
  { en: "nanjing", cn: "南京", id: 101190101, tier: 1, lat: 32.0603, lng: 118.7969 },
  { en: "tianjin", cn: "天津", id: 101030100, tier: 1, lat: 39.0842, lng: 117.2009 },
  { en: "changsha", cn: "长沙", id: 101250101, tier: 1, lat: 28.2282, lng: 112.9388 },
  { en: "zhengzhou", cn: "郑州", id: 101180101, tier: 1, lat: 34.7466, lng: 113.6253 },

  // Tier 2
  { en: "qingdao", cn: "青岛", id: 101120201, tier: 2, lat: 36.0671, lng: 120.3826 },
  { en: "xiamen", cn: "厦门", id: 101230201, tier: 2, lat: 24.4798, lng: 118.0894 },
  { en: "kunming", cn: "昆明", id: 101290101, tier: 2, lat: 25.0406, lng: 102.7123 },
  { en: "haerbin", cn: "哈尔滨", id: 101050101, tier: 2, lat: 45.8038, lng: 126.5350 },
  { en: "shenyang", cn: "沈阳", id: 101070101, tier: 2, lat: 41.8057, lng: 123.4315 },
  { en: "taiyuan", cn: "太原", id: 101100101, tier: 2, lat: 37.8706, lng: 112.5489 },
  { en: "hefei", cn: "合肥", id: 101220101, tier: 2, lat: 31.8206, lng: 117.2272 },
  { en: "fuzhou", cn: "福州", id: 101230101, tier: 2, lat: 26.0745, lng: 119.2965 },
  { en: "jinan", cn: "济南", id: 101120101, tier: 2, lat: 36.6512, lng: 117.1201 },
  { en: "haikou", cn: "海口", id: 101310101, tier: 2, lat: 20.0174, lng: 110.3492 },
  { en: "guiyang", cn: "贵阳", id: 101260101, tier: 2, lat: 26.6470, lng: 106.6302 },
  { en: "lanzhou", cn: "兰州", id: 101160101, tier: 2, lat: 36.0611, lng: 103.8343 },
  { en: "xining", cn: "西宁", id: 101150101, tier: 2, lat: 36.6171, lng: 101.7782 },
  { en: "yinchuan", cn: "银川", id: 101170101, tier: 2, lat: 38.4872, lng: 106.2309 },
  { en: "wulumuqi", cn: "乌鲁木齐", id: 101130101, tier: 2, lat: 43.8256, lng: 87.6168 },
  { en: "huhehaote", cn: "呼和浩特", id: 101080101, tier: 2, lat: 40.8423, lng: 111.7492 },
  { en: "nanning", cn: "南宁", id: 101300101, tier: 2, lat: 22.8170, lng: 108.3665 },
  { en: "suzhou", cn: "苏州", id: 101190401, tier: 2, lat: 31.2990, lng: 120.5853 },
  { en: "dongguan", cn: "东莞", id: 101281601, tier: 2, lat: 23.0430, lng: 113.7633 },
  { en: "wuxi", cn: "无锡", id: 101190201, tier: 2, lat: 31.4912, lng: 120.3119 },
  { en: "ningbo", cn: "宁波", id: 101210401, tier: 2, lat: 29.8683, lng: 121.5440 },
  { en: "foshan", cn: "佛山", id: 101280800, tier: 2, lat: 23.0218, lng: 113.1219 },
  { en: "dalian", cn: "大连", id: 101070201, tier: 2, lat: 38.9140, lng: 121.6147 },
  { en: "changchun", cn: "长春", id: 101060101, tier: 2, lat: 43.8171, lng: 125.3235 },
  { en: "shijiazhuang", cn: "石家庄", id: 101090101, tier: 2, lat: 38.0428, lng: 114.5149 },
  { en: "nanchang", cn: "南昌", id: 101240101, tier: 2, lat: 28.6820, lng: 115.8579 },
  { en: "wenzhou", cn: "温州", id: 101210701, tier: 2, lat: 28.0006, lng: 120.6722 },
  { en: "zhuhai", cn: "珠海", id: 101280701, tier: 2, lat: 22.2710, lng: 113.5767 },
  { en: "lasa", cn: "拉萨", id: 101140101, tier: 2, lat: 29.6500, lng: 91.1000 },
];

// Track which cities are currently being scraped
const scrapingCities = new Set<string>();
let isScraping = false;

export function getScrapingStatus() {
  return {
    isScraping,
    scrapingCities: Array.from(scrapingCities),
  };
}

const fetchPollenData = async (city: CityDef, startDate: string, endDate: string) => {
  const url = `https://graph.weatherdt.com/ty/pollen/v2/hfindex.html?eletype=1&city=${city.en}&start=${startDate}&end=${endDate}&predictFlag=true`;
  try {
    scrapingCities.add(city.en);
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) return;

    const data: any = await response.json();
    if (data && data.dataList) {
      for (const row of data.dataList) {
        await sql`
          INSERT INTO pollen_data (city_en, city_cn, date, level_code, level_name, color, msg)
          VALUES (${city.en}, ${city.cn}, ${row.addTime}, ${row.levelCode ?? -1}, ${row.level || '暂无'}, ${row.color || ''}, ${row.levelMsg || ''})
          ON CONFLICT(city_en, date) DO UPDATE SET
            level_code = EXCLUDED.level_code,
            level_name = EXCLUDED.level_name,
            color = EXCLUDED.color,
            msg = EXCLUDED.msg
        `;
      }
    }
  } catch (error) {
    console.error(`Error fetching data for ${city.en}:`, error);
  } finally {
    scrapingCities.delete(city.en);
  }
};

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
  console.log("Starting scrape...");

  const today = new Date();
  const currentdate = today.toISOString().split('T')[0];
  const past = new Date(today);
  past.setDate(past.getDate() - 7);
  const endcurrentdate = past.toISOString().split('T')[0];

  for (const city of majorCities) {
    console.log(`Scraping ${city.cn} (${city.en})...`);
    await fetchPollenData(city, endcurrentdate, currentdate);
    await new Promise(r => setTimeout(r, 300));
  }

  await sql`INSERT INTO scrape_log (last_scraped_at) VALUES (NOW())`;
  console.log("Scrape finished.");
  isScraping = false;
};

// Initial scrape is triggered from index.ts after DB init
