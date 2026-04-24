import React, { useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Download, FileDown, Image as ImageIcon } from 'lucide-react';

const ChartCard = ({ title, option, data = [], fileName = "data" }) => {
  const chartRef = useRef(null);

  const exportImage = () => {
    const echartsInstance = chartRef.current.getEchartsInstance();
    const dataURL = echartsInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${title}.png`;
    link.click();
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon" onClick={exportImage} title="이미지로 저장">
            <ImageIcon size={18} />
          </button>
          <button className="btn-icon" onClick={downloadCSV} title="CSV 다운로드">
            <FileDown size={18} />
          </button>
        </div>
      </div>
      <ReactECharts 
        ref={chartRef}
        option={option} 
        style={{ height: '400px', width: '100%' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default ChartCard;
