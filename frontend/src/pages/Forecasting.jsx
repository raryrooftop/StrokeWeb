import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { useLanguage } from '../contexts/LanguageContext';

const Forecasting = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetMetric, setTargetMetric] = useState('incidence_rate'); // incidence_rate or cfr

  const API_BASE = '/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/stats/forecasting`);
        setData(res.data);
      } catch (error) {
        console.error("Error fetching forecast data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>{t('forecast_title')}</h1>
        <select 
          value={targetMetric} 
          onChange={(e) => setTargetMetric(e.target.value)}
          className="select-input"
        >
          <option value="incidence_rate">{t('forecast_metric_inc')}</option>
          <option value="cfr">{t('forecast_metric_cfr')}</option>
        </select>
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
