import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Users, Map, BarChart3, Binary, Rocket, X, Eye, Globe, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const [visitorStats, setVisitorStats] = useState({ total: 0, today: 0 });
  const location = useLocation();
  const { lang, toggleLanguage, t } = useLanguage();

  // 초기 접속 시 방문 기록 (POST)
  useEffect(() => {
    const recordVisit = async () => {
      try {
        const response = await fetch('/api/stats/visitors', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          setVisitorStats(data);
        }
      } catch (error) {
        console.error('Failed to record visit:', error);
      }
    };
    recordVisit();
  }, []); // 컴포넌트 마운트 시 1회 실행

  // 경로 이동 시 최신 통계 조회 (GET)
  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await fetch('/api/stats/visitors');
        if (response.ok) {
          const data = await response.json();
          setVisitorStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch visitor stats:', error);
      }
    };
    fetchVisitors();
  }, [location.pathname]);

  const menuItems = [
    { name: t('menu_dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
    { name: t('menu_trend'), path: '/trend', icon: <TrendingUp size={20} /> },
    { name: t('menu_disparity'), path: '/disparity', icon: <Users size={20} /> },
    { name: t('menu_geographic'), path: '/geographic', icon: <Map size={20} /> },
    { name: t('menu_cross'), path: '/cross', icon: <BarChart3 size={20} /> },
    { name: t('menu_asr'), path: '/asr', icon: <Binary size={20} /> },
    { name: t('menu_forecast'), path: '/forecast', icon: <Rocket size={20} /> },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span>{t('app_title')}</span>
        <button className="menu-toggle mobile-only" onClick={onClose} style={{ marginLeft: 'auto', display: 'none' }}>
          <X size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        {/* 언어 선택 토글 */}
        <div className="language-selector" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Globe size={14} color="#2563eb" />
            <span>{t('language')}</span>
          </div>
          <div className="lang-toggle-box" onClick={toggleLanguage}>
            <div className={`lang-option ${lang === 'ko' ? 'active' : ''}`}>KO</div>
            <div className={`lang-option ${lang === 'en' ? 'active' : ''}`}>EN</div>
            <div className={`lang-slider ${lang === 'en' ? 'slide-right' : ''}`}></div>
          </div>
        </div>

        <div className="visitor-card">
          <div className="visitor-header">
            <Eye size={14} className="visitor-icon" />
            <span>{t('visitor_stats')}</span>
          </div>
          <div className="visitor-stats">
            <div className="visitor-stat">
              <span className="stat-label">{t('visitor_today')}</span>
              <span className="stat-value">{visitorStats.today.toLocaleString()}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="visitor-stat">
              <span className="stat-label">{t('visitor_total')}</span>
              <span className="stat-value">{visitorStats.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 시스템 소개 (하단 이동) */}
        <NavLink 
          to="/landing" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} 
          style={{ marginTop: '12px', borderLeft: 'none', padding: '10px 16px', borderRadius: '10px' }}
          onClick={onClose}
        >
          <span className="nav-icon"><Info size={18} /></span>
          <span style={{ fontSize: '0.875rem' }}>{t('menu_landing')}</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
