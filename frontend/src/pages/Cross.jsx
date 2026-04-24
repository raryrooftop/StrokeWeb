import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { Layers, Calendar, CalendarRange, CheckSquare, Square } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Cross = () => {
  const { lang, t } = useLanguage();
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2024);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dim1, setDim1] = useState('sex');
  const [dim2, setDim2] = useState('age_group_5yr');
  const [fetching, setFetching] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState([]);
  
  const API_BASE = '/api';

  const dimensions = [
    { value: 'sex', label: t('cross_dim_sex') },
    { value: 'age_group_5yr', label: t('cross_dim_age') },
    { value: 'income_level', label: t('cross_dim_income') },
    { value: 'region_name', label: t('cross_dim_region') }
  ];

  const formatLabel = (dim, val) => {
    if (!val && val !== 0) return t('disparity_income_99');
    const sVal = String(val);
    if (dim === 'sex') return sVal === '1' ? (lang === 'ko' ? '남성' : 'Male') : (lang === 'ko' ? '여성' : 'Female');
    if (dim === 'age_group_5yr') {
      const age = parseInt(sVal);
      if (isNaN(age)) return sVal;
      return lang === 'ko' ? `${age}-${age + 4}세` : `${age}-${age + 4} yrs`;
    }
    if (dim === 'income_level') {
      if (sVal === '0') return t('disparity_income_0');
      if (sVal === '99') return t('disparity_income_99');
      return t('disparity_income_nth', { n: sVal });
    }
    return sVal;
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        let url = `${API_BASE}/stats/cross?dim1=${dim1}&dim2=${dim2}`;
        if (isRangeMode) {
          url += `&start_year=${startYear}&end_year=${endYear}`;
        } else {
          url += `&year=${selectedYear}`;
        }
        const res = await axios.get(url);
        setData(res.data);
        
        if (dim1 === 'region_name' || dim2 === 'region_name') {
          const regions = [...new Set(res.data.map(d => d.region_name))];
          if (selectedRegions.length === 0) setSelectedRegions(regions);
        }
      } catch (error) {
        console.error("Cross analysis error:", error);
      } finally {
        setFetching(false);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, startYear, endYear, isRangeMode, dim1, dim2]);

  const filteredData = useMemo(() => {
    if (dim1 !== 'region_name' && dim2 !== 'region_name') return data;
    if (selectedRegions.length === 0) return data;
    return data.filter(d => selectedRegions.includes(d.region_name));
  }, [data, selectedRegions, dim1, dim2]);

  const uniqueDim1 = [...new Set(filteredData.map(d => d[dim1]))].sort();
  const uniqueDim2 = [...new Set(filteredData.map(d => d[dim2]))].sort((a,b) => parseInt(a) - parseInt(b));

  const series = uniqueDim1.map(v1 => ({
    name: formatLabel(dim1, v1),
    type: 'bar',
    emphasis: { focus: 'series' },
    data: uniqueDim2.map(v2 => {
      const match = filteredData.find(d => d[dim1] === v1 && d[dim2] === v2);
      return match ? parseFloat(match.incidence_rate.toFixed(1)) : 0;
    })
  }));

  const chartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: '0%', left: 'center', icon: 'circle' },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: { 
        type: 'category', 
        data: uniqueDim2.map(v => formatLabel(dim2, v)), 
        axisLabel: { rotate: uniqueDim2.length > 8 ? 45 : 0, interval: 0 } 
    },
    yAxis: { type: 'value', name: `${t('db_incidence_label')} (${t('db_incidence_unit')})` },
    series: series,
    color: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1', '#06b6d4']
  };

  const allRegions = useMemo(() => {
    if (dim1 !== 'region_name' && dim2 !== 'region_name') return [];
    return [...new Set(data.map(d => d.region_name))].sort();
  }, [data, dim1, dim2]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('cross_title')}</h1>
          <p style={{ color: '#64748b' }}>{t('cross_subtitle')}</p>
        </div>

        <div className="mode-toggle" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setIsRangeMode(false)} style={toggleBtnStyle(!isRangeMode)}><Calendar size={16} /> {t('db_single_year')}</button>
          <button onClick={() => setIsRangeMode(true)} style={toggleBtnStyle(isRangeMode)}><CalendarRange size={16} /> {t('db_range_year')}</button>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="responsive-flex">
          <div className="filter-group" style={{ flex: 1, minWidth: '250px' }}>
            <label style={labelStyle}><Calendar size={14} /> {t('cross_filter_label')}</label>
            {!isRangeMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <input type="range" min="2006" max="2024" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#2563eb' }} />
                <span style={yearBadgeStyle}>{selectedYear}{lang === 'ko' ? '년' : ''}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <select value={startYear} onChange={(e) => setStartYear(parseInt(e.target.value))} className="select-input" style={{ flex: 1 }}>{[...Array(19)].map((_, i) => <option key={2006+i} value={2006+i}>{2006+i}{lang === 'ko' ? '년' : ''}</option>)}</select>
                <span>~</span>
                <select value={endYear} onChange={(e) => setEndYear(parseInt(e.target.value))} className="select-input" style={{ flex: 1 }}>{[...Array(19)].map((_, i) => <option key={2006+i} value={2006+i} disabled={2006+i < startYear}>{2006+i}{lang === 'ko' ? '년' : ''}</option>)}</select>
              </div>
            )}
          </div>
          
          <div className="filter-group" style={{ flex: 1, minWidth: '250px' }}>
            <label style={labelStyle}><Layers size={14} /> {t('cross_dim_label')}</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('cross_dim1')}</span>
                <select value={dim1} onChange={(e) => setDim1(e.target.value)} className="select-input" style={{ width: '100%' }}>
                  {dimensions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('cross_dim2')}</span>
                <select value={dim2} onChange={(e) => setDim2(e.target.value)} className="select-input" style={{ width: '100%' }}>
                  {dimensions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {(dim1 === 'region_name' || dim2 === 'region_name') && allRegions.length > 0 && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <label style={labelStyle}><CheckSquare size={14} /> {t('cross_region_select')}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button 
                onClick={() => setSelectedRegions(allRegions)}
                style={{ ...regionBtnStyle(selectedRegions.length === allRegions.length), background: '#f1f5f9' }}
              >
                {t('geo_select_all')}
              </button>
              <button 
                onClick={() => setSelectedRegions([])}
                style={{ ...regionBtnStyle(false), background: '#f1f5f9' }}
              >
                {t('geo_deselect_all')}
              </button>
              <div style={{ width: '100%', height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>
              {allRegions.map(reg => (
                <button key={reg} onClick={() => setSelectedRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg])} style={regionBtnStyle(selectedRegions.includes(reg))}>
                  {selectedRegions.includes(reg) ? <CheckSquare size={14} /> : <Square size={14} />} {reg}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="chart-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('cross_engine')}</div>
      ) : (
        <div style={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <ChartCard title={t('cross_chart_title', { year: isRangeMode ? `${startYear}~${endYear}` : selectedYear })} option={chartOption} data={filteredData} fileName="cross_analysis" />
        </div>
      )}
    </div>
  );
};

const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' };
const yearBadgeStyle = { background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '6px', fontWeight: 700 };
const toggleBtnStyle = (active) => ({ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', color: active ? '#2563eb' : '#64748b' });
const regionBtnStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: active ? '1px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#3b82f6' : '#64748b', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' });

export default Cross;
