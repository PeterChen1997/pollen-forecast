import { useEffect, useState } from 'react';
import './App.css';
import ChartModal from './components/ChartModal';
import Map from './components/Map';

interface CityData {
  city: string;
  city_en: string;
  date: string;
  levelCode: number;
  level: string;
  color: string;
  msg: string;
}

function App() {
  const [data, setData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<{ id: string, name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/pollen')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('无法获取数据，请检查后端服务是否启动。');
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header>
        <h1>今日全国主要城市花粉浓度排行</h1>
        <p className="subtitle">数据仅供参考，外出请做好防护</p>
      </header>

      {error ? (
        <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      ) : loading ? (
        <p style={{ textAlign: 'center' }}>正在抓取并加载最新花粉数据...</p>
      ) : (
        <div className="content-wrapper">
          <div className="map-container">
            <Map data={data} onCityClick={(id, name) => setSelectedCity({ id, name })} />
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>城市</th>
                  <th>等级</th>
                  <th>建议防护</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.city_en} style={{ cursor: 'pointer' }} onClick={() => setSelectedCity({ id: item.city_en, name: item.city })}>
                    <td>{index + 1}</td>
                    <td>{item.city}</td>
                    <td>
                      <span className="level-badge" style={{ backgroundColor: item.color || '#999' }}>
                        {item.level}
                      </span>
                    </td>
                    <td style={{ fontSize: '14px', color: '#666' }}>{item.msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCity && (
        <ChartModal
          cityId={selectedCity.id}
          cityName={selectedCity.name}
          onClose={() => setSelectedCity(null)}
        />
      )}
    </div>
  );
}

export default App;
