export interface CityDef {
  en: string;
  cn: string;
  id: number;
  tier: 1 | 2;
  lat: number;
  lng: number;
}

export interface CityOption {
  en: string;
  cn: string;
  lat: number;
  lng: number;
  inList: boolean;
  tier?: 1 | 2;
}

export const majorCities: CityDef[] = [
  { en: "beijing", cn: "北京", id: 101010100, tier: 1, lat: 39.9042, lng: 116.4074 },
  { en: "shanghai", cn: "上海", id: 101020100, tier: 1, lat: 31.2304, lng: 121.4737 },
  { en: "guangzhou", cn: "广州", id: 101280101, tier: 1, lat: 23.1291, lng: 113.2644 },
  { en: "shenzhen", cn: "深圳", id: 101280601, tier: 1, lat: 22.5431, lng: 114.0579 },
  { en: "chengdu", cn: "成都", id: 101270101, tier: 1, lat: 30.5728, lng: 104.0665 },
  { en: "hangzhou", cn: "杭州", id: 101210101, tier: 1, lat: 30.2741, lng: 120.1551 },
  { en: "wuhan", cn: "武汉", id: 101200101, tier: 1, lat: 30.5928, lng: 114.3055 },
  { en: "xian", cn: "西安", id: 101110101, tier: 1, lat: 34.3416, lng: 108.9398 },
  { en: "chongqing", cn: "重庆", id: 101040100, tier: 1, lat: 29.5332, lng: 106.5050 },
  { en: "nanjing", cn: "南京", id: 101190101, tier: 1, lat: 32.0603, lng: 118.7969 },
  { en: "tianjin", cn: "天津", id: 101030100, tier: 1, lat: 39.0842, lng: 117.2009 },
  { en: "changsha", cn: "长沙", id: 101250101, tier: 1, lat: 28.2282, lng: 112.9388 },
  { en: "zhengzhou", cn: "郑州", id: 101180101, tier: 1, lat: 34.7466, lng: 113.6253 },
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

export const expandedCityMap: Record<string, { en: string; cn: string; lat: number; lng: number }> = {
  "徐州": { en: "xuzhou", cn: "徐州", lat: 34.2044, lng: 117.2859 },
  "常州": { en: "changzhou", cn: "常州", lat: 31.8106, lng: 119.9741 },
  "烟台": { en: "yantai", cn: "烟台", lat: 37.4638, lng: 121.4480 },
  "潍坊": { en: "weifang", cn: "潍坊", lat: 36.7069, lng: 119.1619 },
  "临沂": { en: "linyi", cn: "临沂", lat: 35.1046, lng: 118.3565 },
  "淄博": { en: "zibo", cn: "淄博", lat: 36.8131, lng: 118.0548 },
  "绍兴": { en: "shaoxing", cn: "绍兴", lat: 30.0025, lng: 120.5803 },
  "台州": { en: "taizhou", cn: "台州", lat: 28.6614, lng: 121.4201 },
  "嘉兴": { en: "jiaxing", cn: "嘉兴", lat: 30.7522, lng: 120.7518 },
  "金华": { en: "jinhua", cn: "金华", lat: 29.0785, lng: 119.6478 },
  "泉州": { en: "quanzhou", cn: "泉州", lat: 24.8741, lng: 118.6758 },
  "中山": { en: "zhongshan", cn: "中山", lat: 22.5154, lng: 113.3926 },
  "惠州": { en: "huizhou", cn: "惠州", lat: 23.1116, lng: 114.4165 },
  "南通": { en: "nantong", cn: "南通", lat: 31.9800, lng: 120.8942 },
  "保定": { en: "baoding", cn: "保定", lat: 38.8739, lng: 115.4646 },
  "唐山": { en: "tangshan", cn: "唐山", lat: 39.6292, lng: 118.1802 },
  "廊坊": { en: "langfang", cn: "廊坊", lat: 39.5186, lng: 116.6831 },
  "洛阳": { en: "luoyang", cn: "洛阳", lat: 34.6198, lng: 112.4540 },
  "襄阳": { en: "xiangyang", cn: "襄阳", lat: 32.0420, lng: 112.1443 },
  "宜昌": { en: "yichang", cn: "宜昌", lat: 30.6918, lng: 111.2866 },
  "岳阳": { en: "yueyang", cn: "岳阳", lat: 29.3572, lng: 113.1289 },
  "株洲": { en: "zhuzhou", cn: "株洲", lat: 27.8274, lng: 113.1340 },
  "芜湖": { en: "wuhu", cn: "芜湖", lat: 31.3529, lng: 118.4331 },
  "绵阳": { en: "mianyang", cn: "绵阳", lat: 31.4680, lng: 104.6796 },
  "南充": { en: "nanchong", cn: "南充", lat: 30.8373, lng: 106.1107 },
  "遵义": { en: "zunyi", cn: "遵义", lat: 27.7254, lng: 106.9272 },
  "湛江": { en: "zhanjiang", cn: "湛江", lat: 21.2707, lng: 110.3594 },
  "汕头": { en: "shantou", cn: "汕头", lat: 23.3535, lng: 116.6814 },
  "柳州": { en: "liuzhou", cn: "柳州", lat: 24.3260, lng: 109.4280 },
  "吉林": { en: "jilinshi", cn: "吉林", lat: 43.8519, lng: 126.5601 },
  "大庆": { en: "daqing", cn: "大庆", lat: 46.5883, lng: 125.1037 },
  "鞍山": { en: "anshan", cn: "鞍山", lat: 41.1087, lng: 122.9956 },
  "包头": { en: "baotou", cn: "包头", lat: 40.6571, lng: 109.8400 },
  "赣州": { en: "ganzhou", cn: "赣州", lat: 25.8310, lng: 114.9332 },
  "桂林": { en: "guilin", cn: "桂林", lat: 25.2736, lng: 110.2905 },
  "三亚": { en: "sanya", cn: "三亚", lat: 18.2528, lng: 109.5120 },
  "威海": { en: "weihai", cn: "威海", lat: 37.5091, lng: 122.1163 },
  "扬州": { en: "yangzhou", cn: "扬州", lat: 32.3942, lng: 119.4133 },
  "盐城": { en: "yancheng", cn: "盐城", lat: 33.3477, lng: 120.1634 },
  "镇江": { en: "zhenjiang", cn: "镇江", lat: 32.1871, lng: 119.4244 },
  "泰安": { en: "taian", cn: "泰安", lat: 36.1880, lng: 117.0875 },
  "邯郸": { en: "handan", cn: "邯郸", lat: 36.6256, lng: 114.5391 },
  "九江": { en: "jiujiang", cn: "九江", lat: 29.7051, lng: 116.0014 },
  "宜春": { en: "yichun", cn: "宜春", lat: 27.8043, lng: 114.4163 },
  "咸阳": { en: "xianyang", cn: "咸阳", lat: 34.3293, lng: 108.7089 },
  "宝鸡": { en: "baoji", cn: "宝鸡", lat: 34.3612, lng: 107.2370 },
  "衡阳": { en: "hengyang", cn: "衡阳", lat: 26.8936, lng: 112.5719 },
  "常德": { en: "changde", cn: "常德", lat: 29.0318, lng: 111.6988 },
  "许昌": { en: "xuchang", cn: "许昌", lat: 34.0357, lng: 113.8526 },
  "漯河": { en: "luohe", cn: "漯河", lat: 33.5816, lng: 114.0167 },
};

const majorCityByCn = new Map(majorCities.map((city) => [city.cn, city]));

function normalizeChineseName(name: string): string {
  return name.trim().replace(/[市区县]$/, "");
}

function normalizeQuery(query: string): string {
  return normalizeChineseName(query).toLowerCase();
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestMajorCity(lat: number, lng: number): { city: CityDef; distance: number } {
  let nearest = majorCities[0];
  let minDist = haversineDistance(lat, lng, nearest.lat, nearest.lng);

  for (const city of majorCities) {
    const dist = haversineDistance(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }

  return { city: nearest, distance: minDist };
}

export function findCityByChineseName(name: string): CityOption | null {
  const cleaned = normalizeChineseName(name);
  const major = majorCityByCn.get(cleaned) || majorCityByCn.get(name);

  if (major) {
    return {
      en: major.en,
      cn: major.cn,
      lat: major.lat,
      lng: major.lng,
      inList: true,
      tier: major.tier,
    };
  }

  const expanded = expandedCityMap[cleaned] || expandedCityMap[name];
  if (!expanded) return null;

  return {
    ...expanded,
    inList: false,
  };
}

export function getAllCityOptions(): CityOption[] {
  const listedOptions = majorCities.map((city) => ({
    en: city.en,
    cn: city.cn,
    lat: city.lat,
    lng: city.lng,
    inList: true,
    tier: city.tier,
  }));

  const expandedOptions = Object.values(expandedCityMap)
    .filter((city) => !listedOptions.some((listed) => listed.en === city.en))
    .map((city) => ({
      ...city,
      inList: false,
    }));

  return [...listedOptions, ...expandedOptions];
}

export function getCityOptions(query = ""): CityOption[] {
  const normalizedQuery = normalizeQuery(query);
  const options = getAllCityOptions();

  const filtered = normalizedQuery
    ? options.filter((option) => {
        const cn = normalizeQuery(option.cn);
        const en = option.en.toLowerCase();
        return cn.includes(normalizedQuery) || en.includes(normalizedQuery);
      })
    : options;

  return filtered.sort((left, right) => {
    if (left.inList !== right.inList) return left.inList ? -1 : 1;
    if ((left.tier ?? 9) !== (right.tier ?? 9)) return (left.tier ?? 9) - (right.tier ?? 9);
    return left.cn.localeCompare(right.cn, "zh-Hans-CN");
  });
}
