import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

interface ChartModalProps {
  cityId: string;
  cityName: string;
  onClose: () => void;
}

export default function ChartModal({ cityId, cityName, onClose }: ChartModalProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let myChart: echarts.ECharts | null = null;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/pollen/${cityId}`);
        const data: any[] = await response.json();

        if (chartRef.current && data && Array.isArray(data)) {
          myChart = echarts.init(chartRef.current);

          const option = {
            title: {
              text: `${cityName} - 花粉浓度历史曲线`
            },
            tooltip: {
              trigger: 'axis'
            },
            xAxis: {
              type: 'category',
              data: data.map((d: any) => d.date)
            },
            yAxis: {
              type: 'value',
              name: '等级 (0-5)'
            },
            series: [
              {
                data: data.map((d: any) => d.levelCode),
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: (params: any) => data[params.dataIndex]?.color || '#5470c6'
                },
                lineStyle: {
                    color: '#5470c6'
                }
              }
            ]
          };

          myChart.setOption(option);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (myChart) {
        myChart.dispose();
      }
    };
  }, [cityId, cityName]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        {loading && <p>加载历史数据中...</p>}
        <div ref={chartRef} className="echarts-container" style={{ display: loading ? 'none' : 'block' }}></div>
      </div>
    </div>
  );
}
