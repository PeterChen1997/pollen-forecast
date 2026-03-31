import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CityMeta {
  en: string;
  cn: string;
  tier: number;
  lat: number;
  lng: number;
}

interface CityData {
  city: string;
  city_en: string;
  levelCode: number;
  level: string;
  color: string;
  msg: string;
}

interface MapProps {
  cities: CityMeta[];
  data: CityData[];
  scrapingCities: string[];
  onCityClick: (cityId: string, cityName: string) => void;
}

function getLevelColor(levelCode: number): string {
  if (levelCode >= 5) return '#991b1b';
  if (levelCode === 4) return '#ef4444';
  if (levelCode === 3) return '#f97316';
  if (levelCode === 2) return '#eab308';
  if (levelCode === 1) return '#22c55e';
  return '#94a3b8';
}

function outOfChina(lat: number, lng: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
  result += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
  return result;
}

function transformLng(x: number, y: number): number {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
  result += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
  return result;
}

function wgs84ToGcj02(lat: number, lng: number): [number, number] {
  if (outOfChina(lat, lng)) return [lat, lng];

  const a = 6378245;
  const ee = Number('0.00669342162296594323');
  let dLat = transformLat(lng - 105, lat - 35);
  let dLng = transformLng(lng - 105, lat - 35);
  const radLat = lat / 180 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
  dLng = (dLng * 180) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

  return [lat + dLat, lng + dLng];
}

export default function PollenMap({ cities, data, scrapingCities, onCityClick }: MapProps) {
  const dataMap = new Map(data.map(d => [d.city_en, d]));
  const [centerLat, centerLng] = wgs84ToGcj02(34.5, 108);

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        subdomains={['1', '2', '3', '4']}
      />
      {cities.map((city) => {
        const cityData = dataMap.get(city.en);
        const isScraping = scrapingCities.includes(city.en);
        const color = cityData ? (cityData.color || getLevelColor(cityData.levelCode)) : (isScraping ? '#eab308' : '#d1d5db');
        const radius = cityData ? (city.tier === 1 ? 10 : 7) : 5;
        const opacity = cityData ? 0.9 : 0.4;
        const [markerLat, markerLng] = wgs84ToGcj02(city.lat, city.lng);

        return (
          <CircleMarker
            key={city.en}
            center={[markerLat, markerLng]}
            radius={radius}
            fillColor={color}
            fillOpacity={opacity}
            color="white"
            weight={2}
            eventHandlers={{
              click: () => onCityClick(city.en, city.cn),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent={false}>
              <div style={{ textAlign: 'center', padding: '2px 4px' }}>
                <strong>{city.cn}</strong>
                {cityData ? (
                  <>
                    <br />
                    <span style={{ color: cityData.color }}>
                      {cityData.level}
                    </span>
                  </>
                ) : isScraping ? (
                  <>
                    <br />
                    <span style={{ color: '#eab308', fontSize: 12 }}>更新中...</span>
                  </>
                ) : null}
              </div>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{city.cn}</div>
                {cityData ? (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: cityData.color || '#999',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {cityData.level}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                      {cityData.msg}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
                    {isScraping ? '数据抓取中...' : '暂无数据'}
                  </div>
                )}
                <button
                  onClick={() => onCityClick(city.en, city.cn)}
                  style={{
                    width: '100%',
                    padding: '6px 0',
                    background: '#7e14ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  查看详情
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
