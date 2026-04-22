import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import CityDetailModal from './components/CityDetailModal';
import CitySwitcher from './components/CitySwitcher';
import PollenMap from './components/Map';
import PollenRating from './components/PollenRating';
import {
  formatDistanceLabel,
  getDistanceToReference,
  sortCityDataByReference,
  sortOptionsByReference,
  type CityOptionLike,
  type CityReferenceLike,
} from './lib/cityReference';
import { getSourceMeta, summarizeSources } from './lib/pollenSources';

interface CityMeta {
  en: string;
  cn: string;
  tier: number;
  lat: number;
  lng: number;
}

interface CityOption extends CityOptionLike {
  tier?: number;
}

interface CityData {
  city: string;
  city_en: string;
  date: string;
  levelCode: number;
  level: string;
  color: string;
  msg: string;
  source?: string;
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

function App() {
  const [cities, setCities] = useState<CityMeta[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ isScraping: false, scrapingCities: [] });
  const [myCity, setMyCity] = useState<MyCityInfo | null>(null);
  const [myCityLoading, setMyCityLoading] = useState(
    () => typeof navigator !== 'undefined' && 'geolocation' in navigator,
  );
  const [manualReferenceCity, setManualReferenceCity] = useState<CityOption | null>(null);
  const wasScrapingRef = useRef(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      fetch('/api/cities').then((response) => response.json()),
      fetch('/api/pollen').then((response) => response.json()),
      fetch('/api/city-options')
        .then((response) => response.json())
        .catch(() => []),
    ])
      .then(([citiesData, pollenData, optionsData]) => {
        const fallbackOptions = citiesData.map((city: CityMeta) => ({ ...city, inList: true }));
        setCities(citiesData);
        setData(pollenData);
        setCityOptions(optionsData.length > 0 ? optionsData : fallbackOptions);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('无法连接服务器，请稍后重试');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch(`/api/my-city?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then((response) => response.json())
          .then((info: MyCityInfo) => {
            setMyCity(info);
            setMyCityLoading(false);
          })
          .catch(() => setMyCityLoading(false));
      },
      () => setMyCityLoading(false),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const poll = () => {
      fetch('/api/scrape-status')
        .then((response) => response.json())
        .then((status: ScrapeStatus) => {
          setScrapeStatus(status);
          const justFinished = wasScrapingRef.current && !status.isScraping;
          wasScrapingRef.current = status.isScraping;

          if (justFinished) {
            fetch('/api/pollen').then((response) => response.json()).then(setData).catch(() => {});
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

  const validData = useMemo(
    () => data.filter((item) => item.levelCode >= 0),
    [data],
  );

  const dataMap = useMemo(
    () => new Map(validData.map((item) => [item.city_en, item])),
    [validData],
  );

  const cityMetaMap = useMemo(
    () => new Map(cities.map((city) => [city.en, city])),
    [cities],
  );

  const effectiveMyCity = useMemo(() => (
    myCity
      ? {
          ...myCity,
          data: dataMap.get(myCity.city.en) ?? myCity.data,
        }
      : null
  ), [dataMap, myCity]);

  const locationReferenceCity = useMemo<CityOption | null>(() => (
    effectiveMyCity
      ? {
          ...effectiveMyCity.city,
          inList: effectiveMyCity.inList,
          mode: 'location',
        }
      : null
  ), [effectiveMyCity]);

  const referenceCity = useMemo<CityReferenceLike | null>(() => (
    manualReferenceCity
      ? { ...manualReferenceCity, mode: 'manual' }
      : locationReferenceCity
  ), [locationReferenceCity, manualReferenceCity]);

  const listedData = validData.filter((item) => cityMetaMap.has(item.city_en));
  const coveredCityCount = cities.filter((city) => dataMap.has(city.en)).length;
  const isMyCityScraping = effectiveMyCity ? scrapeStatus.scrapingCities.includes(effectiveMyCity.city.en) : false;

  const getDistanceToCity = (cityEn: string): number | null => {
    const city = cityMetaMap.get(cityEn) ?? (referenceCity?.en === cityEn ? referenceCity : undefined);
    if (!city) return null;
    return getDistanceToReference(city, referenceCity);
  };

  const sortedCityData = useMemo(
    () => sortCityDataByReference(listedData, cityMetaMap, referenceCity),
    [listedData, cityMetaMap, referenceCity],
  );

  const pendingCities = useMemo(
    () => cities.filter((city) => !dataMap.has(city.en) && scrapeStatus.scrapingCities.includes(city.en)),
    [cities, dataMap, scrapeStatus.scrapingCities],
  );

  const missingCities = useMemo(
    () => cities.filter((city) => !dataMap.has(city.en) && !scrapeStatus.scrapingCities.includes(city.en)),
    [cities, dataMap, scrapeStatus.scrapingCities],
  );

  const sortedPendingCities = useMemo(
    () => sortOptionsByReference(pendingCities.map((city) => ({ ...city, inList: true })), referenceCity),
    [pendingCities, referenceCity],
  );

  const sortedMissingCities = useMemo(
    () => sortOptionsByReference(missingCities.map((city) => ({ ...city, inList: true })), referenceCity),
    [missingCities, referenceCity],
  );

  const highCount = validData.filter((item) => item.levelCode >= 4).length;
  const mediumCount = validData.filter((item) => item.levelCode === 3).length;
  const safeCount = validData.filter((item) => item.levelCode <= 2).length;
  const sourceSummary = summarizeSources(validData);
  const myCitySourceMeta = getSourceMeta(effectiveMyCity?.data?.source);

  const sidebarTitle = referenceCity ? `${referenceCity.cn} 附近城市` : '城市列表';
  const sidebarSubtitle = manualReferenceCity
    ? manualReferenceCity.inList
      ? '按所选城市距离由近到远展示'
      : '该城市未单独监测，以下为附近已监测城市'
    : referenceCity?.mode === 'location'
      ? '按定位城市距离由近到远展示'
      : '未开启定位时按花粉风险等级展示';

  return (
    <div className="app">
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

      {!myCityLoading && effectiveMyCity && (
        <div
          className={`city-banner compact ${effectiveMyCity.data ? 'clickable' : ''}`}
          style={effectiveMyCity.data ? { borderLeftColor: effectiveMyCity.data.color } : undefined}
          onClick={() => effectiveMyCity.data && handleCityClick(effectiveMyCity.city.en, effectiveMyCity.city.cn)}
        >
          <svg className="banner-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="banner-city-name-sm">{effectiveMyCity.city.cn}</span>
          {!effectiveMyCity.inList && <span className="banner-tag-sm">实时抓取</span>}
          {myCitySourceMeta && <span className="banner-tag-sm muted">{myCitySourceMeta.shortLabel}</span>}
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

      {!myCityLoading && effectiveMyCity && effectiveMyCity.data && (
        <PollenRating cityEn={effectiveMyCity.city.en} />
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="main-content">
        <div className="map-section">
          {!loading && (
            <PollenMap
              cities={cities}
              data={validData}
              scrapingCities={scrapeStatus.scrapingCities}
              focusCity={manualReferenceCity}
              onCityClick={handleCityClick}
            />
          )}
        </div>

        <div className="city-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-main">
              <div>
                <div className="sidebar-title">{sidebarTitle}</div>
                <div className="sidebar-subtitle">{sidebarSubtitle}</div>
              </div>
              <span className="sidebar-count">
                {coveredCityCount}/{cities.length}
              </span>
            </div>

            <CitySwitcher
              options={cityOptions}
              activeCity={manualReferenceCity}
              onSelect={(city) => setManualReferenceCity(city)}
              onClear={() => setManualReferenceCity(null)}
            />
          </div>

          <div className="city-list">
            {sortedCityData.map((item) => {
              const sourceMeta = getSourceMeta(item.source);
              return (
                <div
                  key={item.city_en}
                  className={`city-item ${selectedCity?.id === item.city_en ? 'active' : ''}`}
                  onClick={() => handleCityClick(item.city_en, item.city)}
                >
                  <span className={`city-distance ${referenceCity ? 'nearby' : 'listed'}`}>
                    {formatDistanceLabel(getDistanceToCity(item.city_en), referenceCity)}
                  </span>
                  <div className="city-info">
                    <div className="city-name">
                      {item.city}
                      {sourceMeta && (
                        <span className="source-tag">{sourceMeta.shortLabel}</span>
                      )}
                    </div>
                    <div className="city-msg">{item.msg}</div>
                  </div>
                  <span className="city-level-badge" style={{ backgroundColor: item.color || '#94a3b8' }}>
                    {item.level}
                  </span>
                </div>
              );
            })}

            {sortedPendingCities.map((city) => (
              <div key={city.en} className="city-item" style={{ opacity: 0.7 }}>
                <span className="city-distance pending">
                  {referenceCity ? formatDistanceLabel(getDistanceToCity(city.en), referenceCity) : '抓取中'}
                </span>
                <div className="city-info">
                  <div className="city-name">{city.cn}</div>
                  <div className="city-msg pulse" style={{ color: '#eab308' }}>数据抓取中...</div>
                </div>
              </div>
            ))}

            {sortedMissingCities.map((city) => (
              <div key={city.en} className="city-item city-item-muted">
                <span className="city-distance listed">
                  {referenceCity ? formatDistanceLabel(getDistanceToCity(city.en), referenceCity) : '待更新'}
                </span>
                <div className="city-info">
                  <div className="city-name">{city.cn}</div>
                  <div className="city-msg">今日暂无可展示数据</div>
                </div>
                <span className="city-level-badge city-level-badge-muted">待更新</span>
              </div>
            ))}

            {loading && Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="city-item-loading">
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

      {selectedCity && (
        <CityDetailModal
          cityId={selectedCity.id}
          cityName={selectedCity.name}
          currentData={dataMap.get(selectedCity.id)}
          onClose={() => setSelectedCity(null)}
        />
      )}

      {!loading && !error && (
        <div className="stats-strip">
          <span className="stats-strip-item">监测城市 <strong>{cities.length}</strong></span>
          <span className="stats-strip-sep" />
          <span className="stats-strip-item">高浓度预警 <strong className="danger">{highCount}</strong></span>
          <span className="stats-strip-sep" />
          <span className="stats-strip-item">中等浓度 <strong className="warning">{mediumCount}</strong></span>
          <span className="stats-strip-sep" />
          <span className="stats-strip-item">低浓度安全 <strong className="safe">{safeCount}</strong></span>
        </div>
      )}

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-title">Peter Chen &copy; {currentYear} 花粉雷达</div>
          <div className="footer-note">
            花粉雷达是 Peter Chen 维护的开源项目，默认优先展示用户所在城市花粉情况，并把中国城市花粉数据做成更直观的地图与趋势视图。
          </div>
          {sourceSummary.length > 0 && (
            <div className="footer-note">
              今日数据源：
              {' '}
              <span className="footer-source-list">
                {sourceSummary.map((source) => (
                  <span key={source.key} className="footer-source-pill">
                    {source.label}（{source.count} 城）
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="footer-note">
            地图底图来源：
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
