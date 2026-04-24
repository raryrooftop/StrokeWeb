import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Forecasting = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetMetric, setTargetMetric] = useState('incidence_rate'); // incidence_rate or cfr
  const [selectedRegion, setSelectedRegion] = useState('all');

  const regions = [
    { value: 'all', label: '전국 (All Regions)' },
    { value: '서울특별시', label: '서울특별시' },
    { value: '부산광역시', label: '부산광역시' },
    { value: '대구광역시', label: '대구광역시' },
    { value: '인천광역시', label: '인천광역시' },
    { value: '광주광역시', label: '광주광역시' },
    { value: '대전광역시', label: '대전광역시' },
    { value: '울산광역시', label: '울산광역시' },
    { value: '세종특별자치시', label: '세종특별자치시' },
    { value: '경기도', label: '경기도' },
    { value: '강원특별자치도', label: '강원특별자치도' },
    { value: '충청북도', label: '충청북도' },
    { value: '충청남도', label: '충청남도' },
    { value: '전라북도', label: '전라북도' },
    { value: '전라남도', label: '전라남도' },
    { value: '경상북도', label: '경상북도' },
    { value: '경상남도', label: '경상남도' },
    { value: '제주특별자치도', label: '제주특별자치도' }
  ];

  const API_BASE = '/api';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/stats/forecasting?region_name=${selectedRegion}`);
        setData(res.data);
      } catch (error) {
        console.error("Error fetching forecast data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedRegion]);

  if (loading) return <div className="page-container">{t('forecast_engine')}</div>;

  const historical = data.historical;
  const forecast = data.forecast;

  const chartOption = {
    title: { text: targetMetric === 'incidence_rate' ? t('forecast_chart_inc') : t('forecast_chart_cfr') },
    tooltip: { trigger: 'axis' },
    legend: { data: ['Historical', 'Base', 'Optimistic', 'Pessimistic'] },
    xAxis: { 
      type: 'category', 
      data: [...historical.map(h => h.year), ...forecast.map(f => f.year)],
      name: t('db_year_label')
    },
    yAxis: { type: 'value', name: targetMetric === 'incidence_rate' ? t('db_incidence_label') : t('db_cfr_label') },
    series: [
      {
        name: 'Historical',
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        data: [...historical.map(h => h[targetMetric]), ...Array(forecast.length).fill(null)],
        itemStyle: { color: '#1e293b' },
        lineStyle: { width: 3 }
      },
      {
        name: 'Base',
        type: 'line',
        smooth: true,
        lineStyle: { type: 'dashed' },
        data: [...Array(historical.length - 1).fill(null), historical[historical.length-1][targetMetric], ...forecast.map(f => f[targetMetric].base)],
        itemStyle: { color: '#6366f1' }
      },
      {
        name: 'Optimistic',
        type: 'line',
        smooth: true,
        data: [...Array(historical.length - 1).fill(null), historical[historical.length-1][targetMetric], ...forecast.map(f => f[targetMetric].optimistic)],
        itemStyle: { color: '#10b981' },
        areaStyle: { opacity: 0.1, color: '#10b981' }
      },
      {
        name: 'Pessimistic',
        type: 'line',
        smooth: true,
        data: [...Array(historical.length - 1).fill(null), historical[historical.length-1][targetMetric], ...forecast.map(f => f[targetMetric].pessimistic)],
        itemStyle: { color: '#f43f5e' },
        areaStyle: { opacity: 0.1, color: '#f43f5e' }
      }
    ]
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              {t('forecast_title')}
            </h1>
          </div>
          <select 
            value={targetMetric} 
            onChange={(e) => setTargetMetric(e.target.value)}
            className="select-input"
          >
            <option value="incidence_rate">{t('forecast_metric_inc')}</option>
            <option value="cfr">{t('forecast_metric_cfr')}</option>
          </select>
        </div>
      </div>

      <div className="selector-panel" style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        marginBottom: '32px'
      }}>
        <div className="responsive-flex" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> 분석 지역 선택</span>
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="select-input"
              style={{ width: '100%', maxWidth: '300px' }}
            >
              {regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">{t('forecast_kpi_1')}</div>
          <div className="kpi-value">{forecast[forecast.length-1].incidence_rate.base}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('forecast_kpi_2')}</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{forecast[forecast.length-1].cfr.optimistic}%</div>
        </div>
      </div>

      <ChartCard 
        title={targetMetric === 'incidence_rate' ? t('forecast_chart_inc') : t('forecast_chart_cfr')}
        option={chartOption}
        data={[...historical, ...forecast]}
        fileName="stroke_forecast_2030"
      />

      <div className="chart-card">
        <div className="chart-title">{t('forecast_summary')}</div>
        <p style={{ color: '#64748b', marginTop: '12px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: t('forecast_summary_desc') }} />
      </div>
    </div>
  );
};

export default Forecasting;
