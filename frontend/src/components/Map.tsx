import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';

// Coordinates mapping (approximate)
const cityCoords: Record<string, [number, number]> = {
  "beijing": [39.9042, 116.4074],
  "shanghai": [31.2304, 121.4737],
  "guangzhou": [23.1291, 113.2644],
  "shenzhen": [22.5431, 114.0579],
  "chengdu": [30.5728, 104.0665],
  "hangzhou": [30.2741, 120.1551],
  "wuhan": [30.5928, 114.3055],
  "xian": [34.3416, 108.9398],
  "chongqing": [29.5332, 106.5050],
  "qingdao": [36.0671, 120.3826],
  "nanjing": [32.0603, 118.7969],
  "changsha": [28.2282, 112.9388],
  "xiamen": [24.4798, 118.0894],
  "kunming": [25.0406, 102.7123],
  "zhengzhou": [34.7466, 113.6253],
  "haerbin": [45.8038, 126.5350],
  "shenyang": [41.8057, 123.4315],
  "taiyuan": [37.8706, 112.5489],
  "hefei": [31.8206, 117.2272],
  "fuzhou": [26.0745, 119.2965],
  "jinan": [36.6512, 117.1201],
  "haikou": [20.0174, 110.3492],
  "guiyang": [26.6470, 106.6302],
  "lanzhou": [36.0611, 103.8343],
  "xining": [36.6171, 101.7782],
  "yinchuan": [38.4872, 106.2309],
  "wulumuqi": [43.8256, 87.6168],
  "huhehaote": [40.8423, 111.7492],
  "nanning": [22.8170, 108.3665],
  "tianjin": [39.0842, 117.2009]
};

interface MapProps {
  data: any[];
  onCityClick: (cityId: string, cityName: string) => void;
}

export default function Map({ data, onCityClick }: MapProps) {
  return (
    <MapContainer center={[35.8617, 104.1954]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {data.map((city) => {
        const coords = cityCoords[city.city_en];
        if (!coords) return null;

        const createCustomIcon = (color: string) => {
            return divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${color || '#999'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });
        };

        return (
          <Marker
              key={city.city_en}
              position={coords}
              icon={createCustomIcon(city.color)}
              eventHandlers={{
                  click: () => onCityClick(city.city_en, city.city)
              }}
          >
            <Popup>
              <div>
                <strong>{city.city}</strong><br />
                级别: {city.level}<br />
                <span style={{color: city.color}}>●</span> {city.msg}
                <br />
                <button
                  onClick={() => onCityClick(city.city_en, city.city)}
                  style={{marginTop: '5px', cursor: 'pointer', border: '1px solid #ccc', background: '#f0f0f0', borderRadius: '4px', padding: '2px 8px'}}
                >
                  查看历史曲线
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
