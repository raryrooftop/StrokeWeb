import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Disparity from './pages/Disparity';
import ASRPage from './pages/ASRPage';
import Forecasting from './pages/Forecasting';
import Trend from './pages/Trend';
import Geographic from './pages/Geographic';
import Cross from './pages/Cross';
import Landing from './pages/Landing';
import SystemInfo from './pages/SystemInfo';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import './index.css';

function AppContent() {
  const { t } = useLanguage();
  // 로컬 스토리지에서 동의 여부를 가져오거나 기본값 false 설정
  const [isAccepted, setIsAccepted] = useState(() => {
    try {
      const saved = sessionStorage.getItem('stroke_insight_accepted');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 동의 상태가 변경될 때마다 세션 스토리지 업데이트
  useEffect(() => {
    sessionStorage.setItem('stroke_insight_accepted', isAccepted);
  }, [isAccepted]);

  const handleAccept = () => {
    setIsAccepted(true);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      {!isAccepted ? (
        <Landing onAccept={handleAccept} />
      ) : (
        <div className="app-container">
          <div 
            className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
            onClick={closeSidebar}
          ></div>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          <main className="main-content">
            <header className="header">
              <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
                <button className="menu-toggle" onClick={toggleSidebar}>
                  {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem' }}>
                  {t('app_title')} <span className="version-tag" style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '8px' }}>v1.0</span>
                </span>
              </div>
              <div className="header-right">
                <div style={{ fontSize: '0.875rem', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px' }}>
                  {t('analysis_engine')}
                </div>
              </div>
            </header>
            <Routes>
              <Route path="/landing" element={<SystemInfo />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/trend" element={<Trend />} />
              <Route path="/disparity" element={<Disparity />} />
              <Route path="/geographic" element={<Geographic />} />
              <Route path="/cross" element={<Cross />} />
              <Route path="/asr" element={<ASRPage />} />
              <Route path="/forecast" element={<Forecasting />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
