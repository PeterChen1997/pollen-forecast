import db from './db';

const majorCities = [
  {"en": "beijing", "cn": "北京", "id": 101010100},
  {"en": "shanghai", "cn": "上海", "id": 101020100},
  {"en": "guangzhou", "cn": "广州", "id": 101280101},
  {"en": "shenzhen", "cn": "深圳", "id": 101280601},
  {"en": "chengdu", "cn": "成都", "id": 101270101},
  {"en": "hangzhou", "cn": "杭州", "id": 101210101},
  {"en": "wuhan", "cn": "武汉", "id": 101200101},
  {"en": "xian", "cn": "西安", "id": 101110101},
  {"en": "chongqing", "cn": "重庆", "id": 101040100},
  {"en": "qingdao", "cn": "青岛", "id": 101120201},
  {"en": "nanjing", "cn": "南京", "id": 101190101},
  {"en": "changsha", "cn": "长沙", "id": 101250101},
  {"en": "xiamen", "cn": "厦门", "id": 101230201},
  {"en": "kunming", "cn": "昆明市", "id": 101290101},
  {"en": "zhengzhou", "cn": "郑州", "id": 101180101},
  {"en": "haerbin", "cn": "哈尔滨", "id": 101050101},
  {"en": "shenyang", "cn": "沈阳", "id": 101070101},
  {"en": "taiyuan", "cn": "太原", "id": 101100101},
  {"en": "hefei", "cn": "合肥", "id": 101220101},
  {"en": "fuzhou", "cn": "福州", "id": 101230101},
  {"en": "jinan", "cn": "济南", "id": 101120101},
  {"en": "haikou", "cn": "海口", "id": 101310101},
  {"en": "guiyang", "cn": "贵阳", "id": 101260101},
  {"en": "lanzhou", "cn": "兰州", "id": 101160101},
  {"en": "xining", "cn": "西宁", "id": 101150101},
  {"en": "yinchuan", "cn": "银川", "id": 101170101},
  {"en": "wulumuqi", "cn": "乌鲁木齐", "id": 101130101},
  {"en": "huhehaote", "cn": "呼和浩特", "id": 101080101},
  {"en": "nanning", "cn": "南宁", "id": 101300101},
  {"en": "tianjin", "cn": "天津", "id": 101030100}
];

const fetchPollenData = async (cityNameEn: string, cityNameCn: string, startDate: string, endDate: string) => {
  const url = `https://graph.weatherdt.com/ty/pollen/v2/hfindex.html?eletype=1&city=${cityNameEn}&start=${startDate}&end=${endDate}&predictFlag=true`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) return;

    const data: any = await response.json();
    if (data && data.dataList) {
      const stmt = db.prepare(`
        INSERT INTO pollen_data (city_en, city_cn, date, level_code, level_name, color, msg)
        VALUES ($city_en, $city_cn, $date, $level_code, $level_name, $color, $msg)
        ON CONFLICT(city_en, date) DO UPDATE SET
          level_code = excluded.level_code,
          level_name = excluded.level_name,
          color = excluded.color,
          msg = excluded.msg
      `);

      const insertMany = db.transaction((rows: any[]) => {
        for (const row of rows) {
            stmt.run({
                $city_en: cityNameEn,
                $city_cn: cityNameCn,
                $date: row.addTime,
                $level_code: row.levelCode ?? -1,
                $level_name: row.level || '暂无',
                $color: row.color || '',
                $msg: row.levelMsg || ''
            });
        }
      });

      insertMany(data.dataList);
    }
  } catch (error) {
    console.error(`Error fetching data for ${cityNameEn}:`, error);
  }
};

let isScraping = false;

export const runScrape = async () => {
  if (isScraping) return;

  // Check rate limit: 15 minutes
  const lastScrapedRow = db.query("SELECT last_scraped_at FROM scrape_log ORDER BY id DESC LIMIT 1").get() as any;
  if (lastScrapedRow) {
    const lastTime = new Date(lastScrapedRow.last_scraped_at).getTime();
    const now = Date.now();
    if (now - lastTime < 15 * 60 * 1000) {
      console.log("Scraped recently, skipping. Last scraped at:", lastScrapedRow.last_scraped_at);
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
    await fetchPollenData(city.en, city.cn, endcurrentdate, currentdate);
    await new Promise(r => setTimeout(r, 500));
  }

  db.run("INSERT INTO scrape_log (last_scraped_at) VALUES (?)", [new Date().toISOString()]);
  console.log("Scrape finished.");
  isScraping = false;
};

// Start an initial scrape
runScrape().catch(console.error);

if (import.meta.main) {
  runScrape().then(() => console.log("Done."));
}
