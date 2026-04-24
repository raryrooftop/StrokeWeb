import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { useLanguage } from '../contexts/LanguageContext';

const ASRPage = () => {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [standard, setStandard] = useState('2005'); // '2005' or '2020'

  const API_BASE = '/api';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/stats/asr?standard=${standard}`);
        setData(res.data);
      } catch (error) {
        console.error("Error fetching ASR data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [standard]);

  const chartOption = {
    title: { text: t('asr_chart_title') },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(d => d.year), name: t('db_year_label') },
    yAxis: { type: 'value', name: 'ASR' },
    series: [
      {
        name: 'ASR',
        type: 'bar',
        data: data.map(d => d.asr.toFixed(1)),
        color: '#6366f1',
        label: { show: true, position: 'top' }
      },
      {
        name: 'ASR',
        type: 'line',
        data: data.map(d => d.asr.toFixed(1)),
        smooth: true,
        lineStyle: { color: '#f59e0b' }
      }
    ]
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>{t('asr_title')}</h1>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setStandard('2005')}
            style={{ 
              padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: standard === '2005' ? '#fff' : 'transparent',
              boxShadow: standard === '2005' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: standard === '2005' ? 600 : 400
            }}
          >
            {t('asr_btn_2005')}
          </button>
          <button 
            onClick={() => setStandard('2020')}
            style={{ 
              padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: standard === '2020' ? '#fff' : 'transparent',
              boxShadow: standard === '2020' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: standard === '2020' ? 600 : 400
            }}
          >
            {t('asr_btn_2020')}
          </button>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px', background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <p style={{ color: '#1e40af', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: t('asr_desc') }} />
      </div>

      {loading ? (
        <div className="chart-card">{t('asr_engine')}</div>
      ) : (
        <ChartCard 
          title={`${t('asr_chart_title')} (${standard})`}
          option={chartOption}
          data={data}
          fileName={`stroke_asr_${standard}`}
        />
      )}
    </div>
  );
};

export default ASRPage;
