import { useEffect, useState, useCallback } from 'react';
import './App.css';
import CityDetailModal from './components/CityDetailModal';
import PollenMap from './components/Map';

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

function App() {
  const [cities, setCities] = useState<CityMeta[]>([]);
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ isScraping: false, scrapingCities: [] });
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

  // Poll scrape status while scraping
  useEffect(() => {
    const poll = () => {
      fetch('/api/scrape-status')
        .then(r => r.json())
        .then((status: ScrapeStatus) => {
          setScrapeStatus(status);
          // Refresh pollen data if scraping just finished
          if (!status.isScraping) {
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

  // Stats
  const highCount = data.filter(d => d.levelCode >= 4).length;
  const mediumCount = data.filter(d => d.levelCode === 3).length;
  const safeCount = data.filter(d => d.levelCode <= 2 && d.levelCode >= 0).length;

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          花粉雷达
        </div>
        <div className="navbar-status">
          <span className={`status-dot ${scrapeStatus.isScraping ? 'scraping' : ''}`}></span>
          {scrapeStatus.isScraping
            ? `正在更新数据 (${scrapeStatus.scrapingCities.length} 城市抓取中)`
            : `${data.length} 个城市已更新`}
        </div>
      </nav>

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
            <span className="sidebar-title">城市排行</span>
            <span className="sidebar-count">
              {data.length}/{cities.length}
            </span>
          </div>
          <div className="city-list">
            {/* Show ranked cities with data */}
            {data.map((item, index) => (
              <div
                key={item.city_en}
                className={`city-item ${selectedCity?.id === item.city_en ? 'active' : ''}`}
                onClick={() => handleCityClick(item.city_en, item.city)}
              >
                <span className={`city-rank ${index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : 'normal'}`}>
                  {index + 1}
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
            {cities
              .filter(c => !dataMap.has(c.en) && scrapeStatus.scrapingCities.includes(c.en))
              .map(c => (
                <div key={c.en} className="city-item" style={{ opacity: 0.6 }}>
                  <span className="city-rank normal" style={{ background: '#e2e8f0' }}>-</span>
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
          <div className="footer-title">花粉雷达 &copy; {currentYear} 项目作者与贡献者</div>
          <div className="footer-note">
            花粉数据来源：第三方花粉接口
            {' '}
            <span className="footer-source">graph.weatherdt.com</span>
            ；地图底图来源：
            {' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              OpenStreetMap
            </a>
            {' '}
            与
            {' '}
            <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">
              CARTO
            </a>
            。
          </div>
          <div className="footer-note">
            本项目对原始数据做抓取、缓存与可视化，不拥有原始数据版权；页面内容仅供健康防护参考，不构成医疗建议或官方预报。
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
