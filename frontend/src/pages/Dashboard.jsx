import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { Calendar, CalendarRange, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
  const { t, lang } = useLanguage();
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2024);
  
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingSummary, setFetchingSummary] = useState(false);
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
    const fetchTrends = async () => {
      setFetchingSummary(true);
      try {
        const res = await axios.get(`${API_BASE}/stats/trends?region_name=${selectedRegion}`);
        setTrends(res.data);
      } catch (error) {
        console.error("Error fetching trends:", error);
      } finally {
        setFetchingSummary(false);
        setLoading(false);
      }
    };
    fetchTrends();
  }, [selectedRegion]);

  useEffect(() => {
    const fetchSummary = async () => {
      setFetchingSummary(true);
      try {
        let url = `${API_BASE}/stats/summary`;
        if (isRangeMode) {
          url += `?start_year=${startYear}&end_year=${endYear}&region_name=${selectedRegion}`;
        } else {
          url += `?year=${selectedYear}&region_name=${selectedRegion}`;
        }
        const res = await axios.get(url);
        setSummary(res.data.metrics);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setFetchingSummary(false);
      }
    };
    fetchSummary();
  }, [selectedYear, startYear, endYear, isRangeMode, selectedRegion]);

  if (loading) return <div className="page-container">{t('loading')}</div>;

  const years = Array.from({ length: 2024 - 2006 + 1 }, (_, i) => 2006 + i);

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { 
      data: [t('db_incidence_label'), t('db_cfr_label')],
      top: '0%',
      left: 'center',
      itemGap: 20
    },
    grid: { 
      left: '3%', 
      right: '10%', 
      bottom: '3%', 
      top: '15%', 
      containLabel: true 
    },
    xAxis: { type: 'category', data: trends.map(t => t.year), name: t('db_year_label') },
    yAxis: [
      { type: 'value', name: `${t('db_incidence_label')} (${t('db_incidence_unit')})`, position: 'left' },
      { 
        type: 'value', 
        name: `${t('db_cfr_label')} (%)`, 
        position: 'right', 
        nameGap: 35,
        axisLabel: { formatter: '{value}%' } 
      }
    ],
    series: [
      {
        name: t('db_incidence_label'),
        type: 'line',
        smooth: true,
        data: trends.map(t => t.incidence_rate.toFixed(1)),
        color: '#2563eb',
        markArea: {
          itemStyle: { color: 'rgba(37, 99, 235, 0.1)' },
          data: isRangeMode ? [
            [{ xAxis: startYear.toString() }, { xAxis: endYear.toString() }]
          ] : [
            [{ xAxis: selectedYear.toString() }, { xAxis: selectedYear.toString() }]
          ]
        },
        markLine: !isRangeMode ? {
          silent: true,
          symbol: 'none',
          label: { show: false },
          data: [{ xAxis: selectedYear.toString(), lineStyle: { color: '#2563eb', type: 'dashed', width: 2 } }]
        } : null
      },
      {
        name: t('db_cfr_label'),
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trends.map(t => t.cfr.toFixed(2)),
        color: '#ef4444'
      }
    ]
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {t('db_summary_title')} {isRangeMode ? `(${startYear}~${endYear})` : `(${selectedYear})`}
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>{t('db_subtitle')}</p>
        </div>
        
        <div className="mode-toggle" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setIsRangeMode(false)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: !isRangeMode ? '#fff' : 'transparent',
              boxShadow: !isRangeMode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              color: !isRangeMode ? '#2563eb' : '#64748b'
            }}
          >
            <Calendar size={16} /> {t('db_single_year')}
          </button>
          <button 
            onClick={() => setIsRangeMode(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: isRangeMode ? '#fff' : 'transparent',
              boxShadow: isRangeMode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              color: isRangeMode ? '#2563eb' : '#64748b'
            }}
          >
            <CalendarRange size={16} /> {t('db_range_year')}
          </button>
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
        <div className="responsive-flex" style={{ alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
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
        {!isRangeMode ? (
          <div className="responsive-flex" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{t('db_analysis_year')}</span>
            <input 
              type="range" 
              min="2006" 
              max="2024" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: '#2563eb' }}
            />
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              color: '#2563eb', 
              background: '#eff6ff', 
              padding: '4px 16px', 
              borderRadius: '8px',
              minWidth: '90px',
              textAlign: 'center'
            }}>{selectedYear}{lang === 'ko' ? '년' : ''}</span>
          </div>
        ) : (
          <div className="responsive-flex" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{t('db_start_year')}</span>
              <select 
                value={startYear} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStartYear(val);
                  if (val > endYear) setEndYear(val);
                }}
                className="select-input"
                style={{ width: '100%' }}
              >
                {years.map(y => <option key={y} value={y}>{y}{lang === 'ko' ? '년' : ''}</option>)}
              </select>
            </div>
            <div className="mobile-hide" style={{ height: '2px', width: '20px', background: '#cbd5e1' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{t('db_end_year')}</span>
              <select 
                value={endYear} 
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                className="select-input"
                style={{ width: '100%' }}
              >
                {years.filter(y => y >= startYear).map(y => <option key={y} value={y}>{y}{lang === 'ko' ? '년' : ''}</option>)}
              </select>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
              {t('db_total_years', { count: endYear - startYear + 1 })}
            </div>
          </div>
        )}
      </div>
      
      <div className={`kpi-grid ${fetchingSummary ? 'loading-opacity' : ''}`} style={{ transition: 'opacity 0.2s' }}>
        <div className="kpi-card" style={{ borderTop: '4px solid #64748b' }}>
          <div className="kpi-label">{t('db_total_patients')}</div>
          <div className="kpi-value">{summary?.total_patients?.toLocaleString() || '0'}{lang === 'ko' ? t('db_patients_unit') : ''}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>선택 기간 내 누적 발생 건수</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '4px solid #2563eb' }}>
          <div className="kpi-label">{t('db_avg_incidence')}</div>
          <div className="kpi-value" style={{ color: '#2563eb' }}>{summary?.incidence_rate || '0'}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>기간 내 인년당 발생 비율</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '4px solid #ef4444' }}>
          <div className="kpi-label">{t('db_avg_cfr')}</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>{summary?.cfr || '0'}%</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>발생 환자 대비 사망자 비율</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '4px solid #1e293b' }}>
          <div className="kpi-label">{t('db_total_deaths')}</div>
          <div className="kpi-value">{summary?.total_deaths?.toLocaleString() || '0'}{lang === 'ko' ? t('db_patients_unit') : ''}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>기간 내 누적 사망자 합계</div>
        </div>
      </div>

      <ChartCard 
        title={t('db_trend_chart_title')} 
        option={trendOption} 
        data={trends}
        fileName="stroke_trends_summary"
      />
    </div>
  );
};

export default Dashboard;
