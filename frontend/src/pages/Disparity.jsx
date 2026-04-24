import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { Users, Info, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Disparity = () => {
  const { lang, t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = '/api';

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/stats/disparity/income?year=${selectedYear}`);
        if (res.data && Array.isArray(res.data)) {
          setData(res.data);
        } else {
          setData([]);
          console.warn("API returned unexpected data format:", res.data);
        }
      } catch (error) {
        console.error("Error fetching disparity data:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setFetching(false);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // 안전한 차트 옵션 생성
  const getChartOption = () => {
    if (!data || data.length === 0) return null;
    
    try {
      return {
        tooltip: { 
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: { 
          data: [t('db_incidence_label'), t('db_cfr_label')],
          top: '0%',
          left: 'center'
        },
        grid: { 
          top: '15%',
          left: '3%', 
          right: '10%', 
          bottom: '10%', 
          containLabel: true 
        },
        xAxis: { 
          type: 'category', 
          data: data.map(d => {
            if (d.income_level === 0) return t('disparity_income_0');
            if (d.income_level === 99) return t('disparity_income_99');
            return t('disparity_income_nth', { n: d.income_level });
          }),
          name: '',
          axisLabel: { interval: 0, rotate: 45 }
        },
        yAxis: [
          { type: 'value', name: `${t('db_incidence_label')} (${t('db_incidence_unit')})` },
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
            type: 'bar',
            data: data.map(d => (parseFloat(d.incidence_rate) || 0).toFixed(1)),
            itemStyle: { color: '#3b82f6' }
          },
          {
            name: t('db_cfr_label'),
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            data: data.map(d => (parseFloat(d.cfr) || 0).toFixed(2)),
            itemStyle: { color: '#ef4444' },
            lineStyle: { width: 3 }
          }
        ]
      };
    } catch (e) {
      console.error("Chart option generation error:", e);
      return null;
    }
  };

  const chartOption = getChartOption();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('disparity_title')}</h1>
          <p style={{ color: '#64748b' }}>{t('disparity_subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="select-input"
          >
            {[...Array(19).keys()].map(i => 2006 + i).reverse().map(yr => (
              <option key={yr} value={yr}>{yr}{lang === 'ko' ? '년' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px', background: '#f0f9ff', borderColor: '#bae6fd' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Info style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} size={20} />
          <div>
            <p style={{ color: '#0369a1', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              <strong>{t('disparity_def_title')}:</strong> {t('disparity_def_desc')}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="chart-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t('disparity_engine')}
        </div>
      ) : error ? (
        <div className="chart-card" style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
          <AlertCircle size={40} style={{ marginBottom: '12px' }} />
          {error}
        </div>
      ) : chartOption ? (
        <>
          <div style={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <ChartCard 
              title={`${t('disparity_income_title')} (${selectedYear})`}
              option={chartOption}
              data={data}
              fileName={`stroke_disparity_income_${selectedYear}`}
            />
          </div>

          <div className="chart-card" style={{ marginTop: '24px' }}>
            <h3 className="info-item-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
              <Info size={20} className="text-primary" /> {t('disparity_info_title')}
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <h4 className="info-item-title">{t('disparity_info_1_title')}</h4>
                <p className="info-item-content">
                  {t('disparity_info_1_desc')}
                </p>
              </div>
              <div className="info-item">
                <h4 className="info-item-title">{t('disparity_info_2_title')}</h4>
                <p className="info-item-content">
                  {t('disparity_info_2_desc')}
                </p>
              </div>
              <div className="info-item">
                <h4 className="info-item-title">{t('disparity_info_3_title')}</h4>
                <p className="info-item-content" dangerouslySetInnerHTML={{ __html: t('disparity_info_3_desc') }} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="chart-card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          {t('disparity_no_data')}
        </div>
      )}
    </div>
  );
};

export default Disparity;
