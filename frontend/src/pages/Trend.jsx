import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Trend = () => {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const API_BASE = '/api';

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/stats/trends?region_name=${selectedRegion}`);
        setData(res.data);
      } catch (error) {
        console.error("Trend data error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedRegion]);

  if (loading) return <div className="page-container">{t('trend_engine')}</div>;

  // CAGR 계산 (최근 5년)
  const calculateCAGR = (values) => {
    if (values.length < 5) return 0;
    const recent = values.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    return (((last / first) ** (1 / 4)) - 1) * 100;
  };

  const incCAGR = calculateCAGR(data.map(d => d.incidence_rate));
  const cfrCAGR = calculateCAGR(data.map(d => d.cfr));

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { 
      data: [t('db_incidence_label'), t('db_cfr_label'), t('trend_mortality')],
      top: '0%',
      left: 'center'
    },
    grid: {
      top: '12%',
      left: '3%',
      right: '10%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: { 
      type: 'category', 
      data: data.map(d => d.year), 
      name: t('db_year_label'),
      nameLocation: 'end',
      nameGap: 15,
      axisLabel: {
        margin: 15
      }
    },
    yAxis: [
      { type: 'value', name: t('trend_incidence_deaths') },
      { 
        type: 'value', 
        name: `${t('db_cfr_label')} (%)`, 
        position: 'right', 
        nameGap: 35,
        axisLabel: { formatter: '{value}%' } 
      }
    ],
    series: [
      { name: t('db_incidence_label'), type: 'line', smooth: true, data: data.map(d => d.incidence_rate.toFixed(1)) },
      { name: t('trend_mortality'), type: 'line', smooth: true, data: data.map(d => d.mortality_rate.toFixed(1)), color: '#64748b' },
      { name: t('db_cfr_label'), type: 'line', yAxisIndex: 1, smooth: true, data: data.map(d => d.cfr.toFixed(2)), color: '#ef4444' }
    ]
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('trend_title')}</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>{t('trend_subtitle')}</p>
        </div>
      </div>

      {/* 분석 지역 선택 패널 - 대시보드 홈과 동일한 디자인 */}
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
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={16} /> 분석 지역 선택
            </span>
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
          <div className="kpi-label">{t('trend_incidence_change')}</div>
          <div className="kpi-value" style={{ color: incCAGR > 0 ? '#ef4444' : '#2563eb' }}>
            {incCAGR > 0 ? '+' : ''}{incCAGR.toFixed(2)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('trend_cfr_speed')}</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>
            {t('trend_improving', { val: Math.abs(cfrCAGR).toFixed(2) })}
          </div>
        </div>
      </div>

      <ChartCard 
        title={t('trend_chart_title')} 
        option={option} 
        data={data}
        fileName="stroke_detailed_trends"
      />
    </div>
  );
};

export default Trend;
