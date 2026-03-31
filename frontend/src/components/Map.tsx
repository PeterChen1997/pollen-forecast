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

export default function PollenMap({ cities, data, scrapingCities, onCityClick }: MapProps) {
  const dataMap = new Map(data.map(d => [d.city_en, d]));

  return (
    <MapContainer
      center={[34.5, 108]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      {cities.map((city) => {
        const cityData = dataMap.get(city.en);
        const isScraping = scrapingCities.includes(city.en);
        const color = cityData ? (cityData.color || getLevelColor(cityData.levelCode)) : (isScraping ? '#eab308' : '#d1d5db');
        const radius = cityData ? (city.tier === 1 ? 10 : 7) : 5;
        const opacity = cityData ? 0.9 : 0.4;

        return (
          <CircleMarker
            key={city.en}
            center={[city.lat, city.lng]}
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
                    background: '#22c55e',
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
