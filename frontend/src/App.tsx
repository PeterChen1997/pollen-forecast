import { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import CityDetailModal from './components/CityDetailModal';
import PollenMap from './components/Map';
import PollenRating from './components/PollenRating';

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
  date: string;
  levelCode: number;
  level: string;
  color: string;
  msg: string;
}

interface ScrapeStatus {
  isScraping: boolean;
  scrapingCities: string[];
}

interface MyCityInfo {
  city: { en: string; cn: string; lat: number; lng: number };
  distance: number;
  inList: boolean;
  data: CityData | null;
}

interface UserLocation {
  lat: number;
  lng: number;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distance: number | null): string {
  if (distance === null) return '已收录';
  if (distance < 1) return '距您 <1km';
  if (distance < 10) return `距您 ${distance.toFixed(1)}km`;
  return `距您 ${Math.round(distance)}km`;
}

function App() {
  const [cities, setCities] = useState<CityMeta[]>([]);
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ isScraping: false, scrapingCities: [] });
  const [myCity, setMyCity] = useState<MyCityInfo | null>(null);
  const [myCityLoading, setMyCityLoading] = useState(
    () => typeof navigator !== 'undefined' && 'geolocation' in navigator
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const wasScrapingRef = useRef(false);
  const currentYear = new Date().getFullYear();

  // Fetch cities list + pollen data
  useEffect(() => {
    Promise.all([
      fetch('/api/cities').then(r => r.json()),
      fetch('/api/pollen').then(r => r.json()),
    ])
      .then(([citiesData, pollenData]) => {
        setCities(citiesData);
        setData(pollenData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('无法连接服务器，请稍后重试');
        setLoading(false);
      });
  }, []);

  // Get user geolocation and fetch their city's pollen data
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        fetch(`/api/my-city?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then(r => r.json())
          .then((info: MyCityInfo) => {
            setMyCity(info);
            setMyCityLoading(false);
          })
          .catch(() => setMyCityLoading(false));
      },
      () => setMyCityLoading(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Poll scrape status while scraping
  useEffect(() => {
    const poll = () => {
      fetch('/api/scrape-status')
        .then(r => r.json())
        .then((status: ScrapeStatus) => {
          setScrapeStatus(status);
          const justFinished = wasScrapingRef.current && !status.isScraping;
          wasScrapingRef.current = status.isScraping;

          if (justFinished) {
            fetch('/api/pollen').then(r => r.json()).then(setData).catch(() => {});
          }
        })
        .catch(() => {});
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCityClick = useCallback((cityEn: string, cityName: string) => {
    setSelectedCity({ id: cityEn, name: cityName });
  }, []);

  // Build data map for quick lookup
  const dataMap = new Map(data.map(d => [d.city_en, d]));
  const cityMetaMap = new Map(cities.map(city => [city.en, city]));
  const effectiveMyCity = myCity
    ? {
        ...myCity,
        data: dataMap.get(myCity.city.en) ?? myCity.data,
      }
    : null;
  const listedData = data.filter(item => cityMetaMap.has(item.city_en));
  const coveredCityCount = cities.filter(city => dataMap.has(city.en)).length;
  const isMyCityScraping = effectiveMyCity ? scrapeStatus.scrapingCities.includes(effectiveMyCity.city.en) : false;

  const getDistanceToCity = (cityEn: string): number | null => {
    if (!userLocation) return null;
    const city = cityMetaMap.get(cityEn) ?? (effectiveMyCity?.city.en === cityEn ? effectiveMyCity.city : undefined);
    if (!city) return null;

    return haversineDistance(userLocation.lat, userLocation.lng, city.lat, city.lng);
  };

  const sortedCityData = userLocation
    ? [...listedData].sort((left, right) => {
        const leftDistance = getDistanceToCity(left.city_en);
        const rightDistance = getDistanceToCity(right.city_en);

        if (leftDistance === null && rightDistance === null) {
          return right.levelCode - left.levelCode;
        }
        if (leftDistance === null) return 1;
        if (rightDistance === null) return -1;
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        return right.levelCode - left.levelCode;
      })
    : listedData;

  const pendingCities = cities.filter(city => !dataMap.has(city.en) && scrapeStatus.scrapingCities.includes(city.en));
  const sortedPendingCities = userLocation
    ? [...pendingCities].sort((left, right) => {
        const leftDistance = haversineDistance(userLocation.lat, userLocation.lng, left.lat, left.lng);
        const rightDistance = haversineDistance(userLocation.lat, userLocation.lng, right.lat, right.lng);
        return leftDistance - rightDistance;
      })
    : pendingCities;

  // Stats
  const highCount = data.filter(d => d.levelCode >= 4).length;
  const mediumCount = data.filter(d => d.levelCode === 3).length;
  const safeCount = data.filter(d => d.levelCode <= 2 && d.levelCode >= 0).length;

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <a className="navbar-brand" href="/" aria-label="花粉雷达首页">
          <img className="navbar-logo" src="/favicon.svg" alt="" />
          <div className="navbar-copy">
            <span className="navbar-title">花粉雷达</span>
            <span className="navbar-subtitle">Peter Chen 的开源城市花粉地图</span>
          </div>
        </a>
        <div className="navbar-actions">
          <a
            className="navbar-link"
            href="https://blog.peterchen97.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            博客
          </a>
          <a
            className="navbar-link"
            href="https://github.com/PeterChen1997/pollen-forecast"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <div className="navbar-status">
            <span className={`status-dot ${scrapeStatus.isScraping ? 'scraping' : ''}`}></span>
            {scrapeStatus.isScraping
              ? `正在更新数据 (${scrapeStatus.scrapingCities.length} 城市抓取中)`
              : `${coveredCityCount} 个收录城市已更新`}
          </div>
        </div>
      </nav>

      {/* My City Banner (compact) */}
      {!myCityLoading && effectiveMyCity && (
        <div
          className={`city-banner compact ${effectiveMyCity.data ? 'clickable' : ''}`}
          style={effectiveMyCity.data ? { borderLeftColor: effectiveMyCity.data.color } : undefined}
          onClick={() => effectiveMyCity.data && handleCityClick(effectiveMyCity.city.en, effectiveMyCity.city.cn)}
        >
          <svg className="banner-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="banner-city-name-sm">{effectiveMyCity.city.cn}</span>
          {!effectiveMyCity.inList && <span className="banner-tag-sm">实时抓取</span>}
          {effectiveMyCity.distance > 30 && (
            <span className="banner-tag-sm muted">距您 {effectiveMyCity.distance}km</span>
          )}
          <span className="banner-msg-sm">
            {effectiveMyCity.data
              ? effectiveMyCity.data.msg || '暂无花粉提示'
              : isMyCityScraping
                ? '正在抓取...'
                : '数据准备中...'}
          </span>
          <span className="banner-spacer" />
          {effectiveMyCity.data ? (
            <span className="banner-level-sm" style={{ backgroundColor: effectiveMyCity.data.color || '#94a3b8' }}>
              {effectiveMyCity.data.level}
            </span>
          ) : (
            <span className="banner-level-sm" style={{ backgroundColor: isMyCityScraping ? '#f59e0b' : '#94a3b8' }}>
              {isMyCityScraping ? '抓取中' : '加载中'}
            </span>
          )}
        </div>
      )}

      {/* Pollen Rating */}
      {!myCityLoading && effectiveMyCity && effectiveMyCity.data && (
        <PollenRating cityEn={effectiveMyCity.city.en} cityName={effectiveMyCity.city.cn} />
      )}

      {error && <div className="error-banner">{error}</div>}

      {/* Stats Bar */}
      {!loading && !error && (
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-label">监测城市</span>
            <span className="stat-value">{cities.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">高浓度预警</span>
            <span className="stat-value danger">{highCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">中等浓度</span>
            <span className="stat-value warning">{mediumCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">低浓度安全</span>
            <span className="stat-value safe">{safeCount}</span>
          </div>
        </div>
      )}

      {/* Main content: Map + Sidebar */}
      <div className="main-content">
        <div className="map-section">
          {!loading && (
            <PollenMap
              cities={cities}
              data={data}
              scrapingCities={scrapeStatus.scrapingCities}
              onCityClick={handleCityClick}
            />
          )}
        </div>

        <div className="city-sidebar">
          <div className="sidebar-header">
            <div>
              <div className="sidebar-title">{userLocation ? '附近城市' : '城市列表'}</div>
              <div className="sidebar-subtitle">
                {userLocation ? '按距离由近到远展示' : '未开启定位时展示默认顺序'}
              </div>
            </div>
            <span className="sidebar-count">
              {coveredCityCount}/{cities.length}
            </span>
          </div>
          <div className="city-list">
            {/* Show cities with data */}
            {sortedCityData.map((item) => (
              <div
                key={item.city_en}
                className={`city-item ${selectedCity?.id === item.city_en ? 'active' : ''}`}
                onClick={() => handleCityClick(item.city_en, item.city)}
              >
                <span className={`city-distance ${userLocation ? 'nearby' : 'listed'}`}>
                  {formatDistance(getDistanceToCity(item.city_en))}
                </span>
                <div className="city-info">
                  <div className="city-name">{item.city}</div>
                  <div className="city-msg">{item.msg}</div>
                </div>
                <span className="city-level-badge" style={{ backgroundColor: item.color || '#94a3b8' }}>
                  {item.level}
                </span>
              </div>
            ))}

            {/* Show loading skeletons for cities not yet scraped */}
            {sortedPendingCities.map(c => (
                <div key={c.en} className="city-item" style={{ opacity: 0.6 }}>
                  <span className="city-distance pending">
                    {userLocation ? formatDistance(getDistanceToCity(c.en)) : '抓取中'}
                  </span>
                  <div className="city-info">
                    <div className="city-name">{c.cn}</div>
                    <div className="city-msg pulse" style={{ color: '#eab308' }}>数据抓取中...</div>
                  </div>
                </div>
              ))}

            {loading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="city-item-loading">
                <div className="skeleton skeleton-circle" style={{ width: 24, height: 24 }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 6 }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCity && (
        <CityDetailModal
          cityId={selectedCity.id}
          cityName={selectedCity.name}
          currentData={dataMap.get(selectedCity.id)}
          onClose={() => setSelectedCity(null)}
        />
      )}

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-title">Peter Chen &copy; {currentYear} 花粉雷达</div>
          <div className="footer-note">
            花粉雷达是 Peter Chen 维护的开源项目，默认优先展示用户所在城市花粉情况，并把中国城市花粉数据做成更直观的地图与趋势视图。
          </div>
          <div className="footer-note">
            花粉数据来源：第三方花粉接口
            {' '}
            <span className="footer-source">graph.weatherdt.com</span>
            ；地图底图来源：
            {' '}
            <a href="https://ditu.amap.com/" target="_blank" rel="noopener noreferrer">
              高德地图
            </a>
            。本项目对原始数据做抓取、缓存与可视化，不拥有原始数据版权；页面内容仅供健康防护参考，不构成医疗建议或官方预报。
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
