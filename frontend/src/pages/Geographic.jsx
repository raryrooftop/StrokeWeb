import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import ChartCard from '../components/ChartCard';
import { Map as MapIcon, Table as TableIcon, CheckSquare, Square, Calendar, CalendarRange, TrendingUp, BarChart2, Globe, Building2, Building, Trees, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Geographic = () => {
  const { lang, t } = useLanguage();
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2024);


  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('incidence_rate');
  const [viewMode, setViewMode] = useState('map');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [districtView, setDistrictView] = useState('all'); // 'all', 1, 2, 3
  const [selectedDrilldownRegion, setSelectedDrilldownRegion] = useState(null);

  const API_BASE = '/api';

  const metrics = [
    { value: 'incidence_rate', label: t('db_incidence_label'), unit: t('db_incidence_unit') },
    { value: 'cfr', label: t('db_cfr_label'), unit: '%' },
    { value: 'mortality_rate', label: t('trend_mortality'), unit: t('db_incidence_unit') }
  ];

  // 지도 파일(GeoJSON)의 properties.name과 일치시키기 위한 매핑
  const normalizeRegionName = (name) => {
    if (!name) return "";
    // 1. 공백 제거
    const cleanName = name.trim();
    // 2. 특수 사례 처리 (데이터와 지도 명칭 불일치 방지)
    if (cleanName.includes("서울")) return "서울특별시";
    if (cleanName.includes("부산")) return "부산광역시";
    if (cleanName.includes("대구")) return "대구광역시";
    if (cleanName.includes("인천")) return "인천광역시";
    if (cleanName.includes("광주")) return "광주광역시";
    if (cleanName.includes("대전")) return "대전광역시";
    if (cleanName.includes("울산")) return "울산광역시";
    if (cleanName.includes("세종")) return "세종특별자치시";
    if (cleanName.includes("경기")) return "경기도";
    if (cleanName.includes("강원")) return "강원도";
    if (cleanName.includes("충북") || cleanName === "충청북도") return "충청북도";
    if (cleanName.includes("충남") || cleanName === "충청남도") return "충청남도";
    if (cleanName.includes("전북") || cleanName === "전라북도") return "전라북도";
    if (cleanName.includes("전남") || cleanName === "전라남도") return "전라남도";
    if (cleanName.includes("경북") || cleanName === "경상북도") return "경상북도";
    if (cleanName.includes("경남") || cleanName === "경상남도") return "경상남도";
    if (cleanName.includes("제주")) return "제주특별자치도";
    return cleanName;
  };

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await axios.get('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo.json');
        echarts.registerMap('south_korea', response.data);
      } catch (error) {
        console.error("Map data load error:", error);
      }
    };
    loadMap();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        let url = `${API_BASE}/stats/geographic?`;
        if (isRangeMode) {
          url += `start_year=${startYear}&end_year=${endYear}`;
        } else {
          url += `year=${selectedYear}`;
        }
        const res = await axios.get(url);
        const enrichedData = res.data.map(item => ({
          ...item,
          mortality_rate: (item.deaths / item.person_years) * 100000
        }));
        setData(enrichedData);
        if (selectedRegions.length === 0) {
          setSelectedRegions(enrichedData.map(d => d.region_name));
        }
      } catch (error) {
        console.error("Geographic data error:", error);
      } finally {
        setFetching(false);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, startYear, endYear, isRangeMode]);

  const aggregatedData = useMemo(() => {
    let filtered = data;
    if (districtView !== 'all') {
      filtered = data.filter(d => d.district_code === districtView);
    }
    
    const grouped = {};
    filtered.forEach(d => {
      if (!grouped[d.region_name]) {
        grouped[d.region_name] = {
          region_code: d.region_code,
          region_name: d.region_name,
          episodes: 0,
          person_years: 0,
          deaths: 0
        };
      }
      grouped[d.region_name].episodes += d.episodes;
      grouped[d.region_name].person_years += d.person_years;
      grouped[d.region_name].deaths += d.deaths;
    });

    return Object.values(grouped).map(item => ({
      ...item,
      incidence_rate: item.person_years > 0 ? (item.episodes / item.person_years) * 100000 : 0,
      cfr: item.episodes > 0 ? (item.deaths / item.episodes) * 100 : 0,
      mortality_rate: item.person_years > 0 ? (item.deaths / item.person_years) * 100000 : 0
    }));
  }, [data, districtView]);

  const filteredData = useMemo(() => {
    if (selectedRegions.length === 0) return aggregatedData;
    return aggregatedData.filter(d => selectedRegions.includes(d.region_name));
  }, [aggregatedData, selectedRegions]);

  const nationalAvg = useMemo(() => {
    if (aggregatedData.length === 0) return 0;
    return aggregatedData.reduce((acc, curr) => acc + curr[selectedMetric], 0) / aggregatedData.length;
  }, [aggregatedData, selectedMetric]);

  const mapData = useMemo(() => {
    return aggregatedData.map(item => ({
      name: normalizeRegionName(item.region_name),
      value: parseFloat(item[selectedMetric]?.toFixed(2)) || 0,
      fullData: item
    }));
  }, [aggregatedData, selectedMetric]);

  // 드릴다운(도내 격차) 차트용 데이터
  const drilldownData = useMemo(() => {
    if (!selectedDrilldownRegion) return [];
    return data.filter(d => normalizeRegionName(d.region_name) === selectedDrilldownRegion || d.region_name === selectedDrilldownRegion);
  }, [data, selectedDrilldownRegion]);

  const drilldownOption = useMemo(() => {
    if (!selectedDrilldownRegion || drilldownData.length === 0) return null;
    
    const distMap = {1: '대도시(구)', 2: '중소도시(시)', 3: '농어촌(군)'};
    const chartData = drilldownData.map(d => ({
      name: distMap[d.district_code] || `기타(${d.district_code})`,
      value: parseFloat(d[selectedMetric]?.toFixed(2)) || 0,
      itemStyle: { color: d.district_code === 1 ? '#3b82f6' : d.district_code === 2 ? '#22c55e' : '#f59e0b' }
    })).sort((a, b) => drilldownData.find(d => distMap[d.district_code] === a.name)?.district_code - drilldownData.find(d => distMap[d.district_code] === b.name)?.district_code);
    
    return {
      title: { text: `${selectedDrilldownRegion} 도시 규모별 도내 격차`, left: 'center', top: 10, textStyle: { fontSize: 15, fontWeight: 700, color: '#1e293b' } },
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      grid: { left: '15%', right: '10%', bottom: '15%', top: 75 },
      xAxis: { type: 'category', data: chartData.map(d => d.name), axisLabel: { fontWeight: 600 } },
      yAxis: { 
        type: 'value', 
        name: metrics.find(m => m.value === selectedMetric)?.unit || '',
        nameTextStyle: { align: 'right' },
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      series: [
        {
          type: 'bar',
          data: chartData,
          barWidth: '40%',
          label: { show: true, position: 'top', formatter: '{c}', fontWeight: 'bold', distance: 10 },
          itemStyle: { borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  }, [drilldownData, selectedDrilldownRegion, selectedMetric, metrics]);

  const onMapEvents = {
    'click': (params) => {
      if (params.name) {
        setSelectedDrilldownRegion(params.name);
      }
    }
  };

  const mapOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (!params.data || !params.data.fullData) return params.name;
        const d = params.data.fullData;
        const diff = ((d[selectedMetric] - nationalAvg) / nationalAvg * 100).toFixed(1);
        const diffText = diff > 0 ? `<span style="color: #ef4444;">평균 대비 ${diff}% 높음 ↑</span>` : `<span style="color: #3b82f6;">평균 대비 ${Math.abs(diff)}% 낮음 ↓</span>`;
        
        return `
          <div style="font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">${d.region_name}</div>
          <div style="font-size: 0.9rem; margin-bottom: 8px;">${diffText}</div>
          <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 0.85rem; margin-bottom: 4px;">
            <span style="color: #64748b;">현재 지표:</span>
            <span style="font-weight: 600;">${d[selectedMetric].toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 0.85rem;">
            <span style="color: #64748b;">전국 평균:</span>
            <span style="font-weight: 600;">${nationalAvg.toFixed(2)}</span>
          </div>
        `;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' }
    },
    visualMap: {
      type: 'piecewise',
      splitNumber: 5,
      min: Math.min(...mapData.map(d => d.value)),
      max: Math.max(...mapData.map(d => d.value)),
      left: 'right',
      top: 'bottom',
      text: [t('geo_high'), t('geo_low')],
      calculable: true,
      inRange: {
        color: ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1d4ed8', '#1e3a8a']
      }
    },
    series: [
      {
        name: '뇌졸중 지표',
        type: 'map',
        map: 'south_korea',
        roam: true,
        label: { 
          show: true, 
          fontSize: 12, 
          fontWeight: 'bold',
          color: '#1e293b', // 더 진한 색상
          textBorderColor: '#fff', // 글자 외곽선 추가 (가시성 확보)
          textBorderWidth: 2,
          formatter: (p) => {
            return p.name.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace('북도', '북').replace('남도', '남');
          }
        },
        emphasis: {
          label: { 
            show: true, 
            fontWeight: '900', 
            fontSize: 14,
            color: '#000',
            textBorderColor: '#fff',
            textBorderWidth: 3
          },
          itemStyle: { areaColor: '#fde047' }
        },
        data: mapData
      }
    ]
  };

  const rankOption = {
    grid: { left: '15%', right: '10%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { 
      type: 'category', 
      data: mapData.sort((a,b) => a.value - b.value).map(d => lang === 'ko' ? d.name.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace('북도', '북').replace('남도', '남') : d.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontWeight: 600, color: '#475569' }
    },
    series: [
      {
        type: 'bar',
        data: mapData.sort((a,b) => a.value - b.value).map(d => ({
          value: d.value,
          itemStyle: { color: d.value > nationalAvg ? '#3b82f6' : '#94a3b8' }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          fontWeight: 'bold'
        },
        barWidth: '60%',
        itemStyle: { borderRadius: [0, 4, 4, 0] }
      }
    ]
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('geo_title')}</h1>
          <p style={{ color: '#64748b' }}>{t('geo_subtitle')}</p>
        </div>
        
        <div className="mode-toggle" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setIsRangeMode(false)} style={toggleBtnStyle(!isRangeMode)}><Calendar size={16} /> {t('db_single_year')}</button>
          <button onClick={() => setIsRangeMode(true)} style={toggleBtnStyle(isRangeMode)}><CalendarRange size={16} /> {t('db_range_year')}</button>
        </div>
      </div>

      {/* 도시 규모(도농 격차) 토글 필터 */}
      <div className="chart-card" style={{ marginBottom: '16px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={18} /> 도시 규모 뷰(View) 필터:
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', overflowX: 'auto' }}>
          <button onClick={() => setDistrictView('all')} style={toggleBtnStyle(districtView === 'all')}><Globe size={14} /> 전체 시도 평균</button>
          <button onClick={() => setDistrictView(1)} style={toggleBtnStyle(districtView === 1)}><Building2 size={14} /> 대도시(구) 뷰</button>
          <button onClick={() => setDistrictView(2)} style={toggleBtnStyle(districtView === 2)}><Building size={14} /> 중소도시(시) 뷰</button>
          <button onClick={() => setDistrictView(3)} style={toggleBtnStyle(districtView === 3)}><Trees size={14} /> 농어촌(군) 뷰</button>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
          * 특정 규모 지역 데이터만 분리하여 애플 투 애플(Apples-to-apples) 비교가 가능합니다.
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="responsive-flex" style={{ alignItems: 'flex-end' }}>
          <div className="filter-group" style={{ flex: 1, minWidth: '250px' }}>
            <label style={labelStyle}><Calendar size={14} /> {t('geo_filter_label')}</label>
            {!isRangeMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <input type="range" min="2006" max="2024" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#2563eb' }} />
                <span style={badgeStyle}>{selectedYear}{lang === 'ko' ? '년' : ''}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <select value={startYear} onChange={(e) => setStartYear(parseInt(e.target.value))} className="select-input" style={{ flex: 1 }}>{[...Array(19)].map((_, i) => <option key={2006+i} value={2006+i}>{2006+i}{lang === 'ko' ? '년' : ''}</option>)}</select>
                <span>~</span>
                <select value={endYear} onChange={(e) => setEndYear(parseInt(e.target.value))} className="select-input" style={{ flex: 1 }}>{[...Array(19)].map((_, i) => <option key={2006+i} value={2006+i} disabled={2006+i < startYear}>{2006+i}{lang === 'ko' ? '년' : ''}</option>)}</select>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setViewMode('map')} style={viewBtnStyle(viewMode === 'map')}><MapIcon size={18} /> {t('geo_map_btn')}</button>
            <button onClick={() => setViewMode('table')} style={viewBtnStyle(viewMode === 'table')}><TableIcon size={18} /> {t('geo_table_btn')}</button>
          </div>
        </div>
      </div>

      <div className="responsive-flex" style={{ gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {metrics.map(m => (
          <button key={m.value} onClick={() => setSelectedMetric(m.value)} style={metricBtnStyle(selectedMetric === m.value)}>
            {m.label} ({m.unit})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="chart-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('geo_engine')}</div>
      ) : (
        <div style={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {viewMode === 'map' ? (
            <div className="responsive-grid-2">
              <div className="chart-card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapIcon size={20} color="#3b82f6" /> {isRangeMode ? `${startYear}~${endYear}` : selectedYear}{lang === 'ko' ? '년' : ''} {t('geo_map_title', { metric: metrics.find(m => m.value === selectedMetric).label })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>지도 클릭 시 도내 격차 분석 패널 열림</span>
                </div>
                <div style={{ flex: 1 }}>
                  <ReactECharts option={mapOption} onEvents={onMapEvents} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="chart-card" style={{ flex: selectedDrilldownRegion ? '1' : '1', minHeight: selectedDrilldownRegion ? '350px' : '600px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' }}>
                  <div style={{ marginBottom: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <BarChart2 size={20} color="#3b82f6" /> {t('geo_rank_title', { avg: nationalAvg.toFixed(1) })}
                  </div>
                  <div style={{ flex: 1 }}>
                     <ReactECharts option={rankOption} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
                
                {/* 드릴다운 패널 */}
                {selectedDrilldownRegion && (
                  <div className="chart-card" style={{ flex: '1', minHeight: '280px', display: 'flex', flexDirection: 'column', border: '2px solid #3b82f6', background: '#f8fafc', position: 'relative' }}>
                    <button 
                      onClick={() => setSelectedDrilldownRegion(null)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                      <X size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                      {drilldownOption ? (
                        <ReactECharts option={drilldownOption} style={{ height: '100%', width: '100%' }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          해당 지역의 상세 데이터가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="chart-card" style={{ marginBottom: '24px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 600, color: '#475569' }}>
                  <CheckSquare size={18} /> {t('geo_region_select')}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setSelectedRegions(data.map(d => d.region_name))} style={regionControlBtnStyle}>{t('geo_select_all')}</button>
                  <button onClick={() => setSelectedRegions([])} style={regionControlBtnStyle}>{t('geo_deselect_all')}</button>
                  <div style={{ width: '100%', height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>
                  {data.map(d => (
                    <button key={d.region_code} onClick={() => setSelectedRegions(prev => prev.includes(d.region_name) ? prev.filter(r => r !== d.region_name) : [...prev, d.region_name])} style={regionBtnStyle(selectedRegions.includes(d.region_name))}>
                      {selectedRegions.includes(d.region_name) ? <CheckSquare size={14} /> : <Square size={14} />} {lang === 'ko' ? d.region_name : normalizeRegionName(d.region_name)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chart-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '24px' }}>{t('geo_th_region')}</th>
                      <th style={{ textAlign: 'right' }}>{t('geo_th_episodes')}</th>
                      <th style={{ textAlign: 'right' }}>{t('geo_th_incidence')}</th>
                      <th style={{ textAlign: 'right' }}>{t('geo_th_cfr')}</th>
                      <th style={{ textAlign: 'right', paddingRight: '24px' }}>{t('geo_th_mortality')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.sort((a,b) => b[selectedMetric] - a[selectedMetric]).map(d => (
                      <tr key={d.region_code}>
                        <td style={{ fontWeight: 700, paddingLeft: '24px', color: '#1e293b' }}>{d.region_name}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{d.episodes.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>{d.incidence_rate.toFixed(1)}</td>
                        <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{d.cfr.toFixed(2)}%</td>
                        <td style={{ textAlign: 'right', paddingRight: '24px' }}>{(d.deaths / d.person_years * 100000).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' };
const badgeStyle = { background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '6px', fontWeight: 700 };
const toggleBtnStyle = (active) => ({ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', color: active ? '#2563eb' : '#64748b' });
const viewBtnStyle = (active) => ({ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', color: active ? '#2563eb' : '#64748b', transition: 'all 0.2s' });
const metricBtnStyle = (active) => ({ padding: '10px 20px', borderRadius: '10px', border: active ? '1px solid #2563eb' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' });
const regionBtnStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: active ? '1px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#3b82f6' : '#64748b', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' });
const regionControlBtnStyle = { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' };

export default Geographic;
