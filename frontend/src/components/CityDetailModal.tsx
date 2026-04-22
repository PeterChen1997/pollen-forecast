import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

import { getSourceMeta } from '../lib/pollenSources';

interface HistoryItem {
  date: string;
  levelCode: number;
  level: string;
  color: string;
  msg: string;
  source?: string;
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

interface CityDetailModalProps {
  cityId: string;
  cityName: string;
  currentData?: CityData;
  onClose: () => void;
}

interface TooltipParamLike {
  dataIndex: number;
}

const levelDescriptions: Record<number, string> = {
  0: '花粉浓度极低，适合户外活动',
  1: '花粉浓度较低，一般不会引发过敏',
  2: '花粉浓度偏低，过敏人群需适当注意',
  3: '花粉浓度中等，过敏人群减少外出',
  4: '花粉浓度偏高，建议佩戴口罩、减少外出',
  5: '花粉浓度极高，强烈建议避免户外活动',
};

const protectionTips: Record<number, string[]> = {
  0: ['可自由进行户外运动'],
  1: ['外出可不戴口罩', '保持室内通风'],
  2: ['敏感人群可佩戴口罩', '回家后清洗面部'],
  3: ['建议佩戴口罩', '减少户外停留时间', '回家后换洗衣物'],
  4: ['必须佩戴口罩', '尽量避免户外活动', '关闭门窗', '可服用抗过敏药物'],
  5: ['避免一切户外活动', '紧闭门窗', '使用空气净化器', '遵医嘱用药'],
};

export default function CityDetailModal({ cityId, cityName, currentData, onClose }: CityDetailModalProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pollen/${cityId}`)
      .then((response) => response.json())
      .then((items: HistoryItem[]) => {
        setHistory(items.filter((item) => item.levelCode >= 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cityId]);

  useEffect(() => {
    if (loading || !chartRef.current || history.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      grid: { top: 20, right: 20, bottom: 30, left: 40 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: TooltipParamLike | TooltipParamLike[]) => {
          const firstParam = Array.isArray(params) ? params[0] : params;
          if (!firstParam) return '';

          const item = history[firstParam.dataIndex];
          if (!item) return '';
          const sourceMeta = getSourceMeta(item.source);

          return `<strong>${item.date}</strong><br/>
                  等级: <span style="color:${item.color}">${item.level}</span> (${item.levelCode})<br/>
                  ${sourceMeta ? `来源: ${sourceMeta.label}<br/>` : ''}
                  ${item.msg}`;
        },
      },
      xAxis: {
        type: 'category',
        data: history.map((item) => item.date.slice(5)),
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 5,
        axisLabel: { fontSize: 11, color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [{
        data: history.map((item) => ({
          value: item.levelCode,
          itemStyle: { color: item.color || '#94a3b8' },
        })),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#7e14ff', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(126,20,255,0.26)' },
            { offset: 1, color: 'rgba(126,20,255,0.03)' },
          ]),
        },
      }],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [loading, history]);

  const levelCode = currentData?.levelCode ?? 0;
  const tips = protectionTips[Math.min(levelCode, 5)] || protectionTips[0];
  const desc = levelDescriptions[Math.min(levelCode, 5)] || '';
  const sourceMeta = getSourceMeta(currentData?.source);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-header-left">
            <span className="detail-city-name">{cityName}</span>
            {currentData && (
              <span className="detail-level-badge" style={{ backgroundColor: currentData.color || '#94a3b8' }}>
                {currentData.level}
              </span>
            )}
          </div>
          <button className="detail-close" onClick={onClose}>&times;</button>
        </div>

        <div className="detail-body">
          {currentData ? (
            <>
              <div className="detail-info-grid">
                <div className="detail-info-card">
                  <div className="detail-info-label">花粉等级</div>
                  <div className="detail-info-value" style={{ color: currentData.color }}>
                    {currentData.level} ({currentData.levelCode}/5)
                  </div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-info-label">监测日期</div>
                  <div className="detail-info-value">{currentData.date}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-info-label">数据来源</div>
                  <div className="detail-info-value">{sourceMeta?.label ?? '未标注'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-info-label">来源类型</div>
                  <div className="detail-info-value">{sourceMeta?.isEstimated ? '推算数据' : '直接来源'}</div>
                </div>
                <div className="detail-info-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-info-label">浓度描述</div>
                  <div className="detail-info-value detail-info-copy">
                    {desc}
                  </div>
                </div>
              </div>

              {sourceMeta && (
                <div className="detail-source-note">
                  <strong>{sourceMeta.shortLabel}</strong>
                  {' '}
                  {sourceMeta.description}
                </div>
              )}

              <div className="detail-msg">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>防护建议</div>
                <div>{currentData.msg}</div>
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {tips.map((tip, index) => (
                    <li key={index} style={{ marginBottom: 2 }}>{tip}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
              暂无当日数据
            </div>
          )}

          <div className="detail-chart-title">近期趋势</div>
          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              加载历史数据中...
            </div>
          ) : history.length === 0 ? (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              暂无历史数据
            </div>
          ) : (
            <div ref={chartRef} className="detail-chart"></div>
          )}
        </div>
      </div>
    </div>
  );
}
