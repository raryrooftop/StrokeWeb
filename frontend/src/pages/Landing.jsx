import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, ArrowRight, BrainCircuit, Code2, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Landing = ({ onAccept }) => {
  const { t } = useLanguage();

  return (
    <div className="landing-wrapper">
      <style>{`
        .landing-wrapper {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          font-family: 'Inter', 'Pretendard', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding: 20px;
        }
        .landing-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(#2563eb 0.5px, transparent 0.5px);
          background-size: 24px 24px;
          opacity: 0.1;
          pointer-events: none;
        }
        .landing-card {
          width: 100%;
          max-width: 1000px;
          background: #ffffff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          z-index: 10;
          border: 1px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
        }
        .landing-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .landing-title {
          font-size: 2.25rem;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .landing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .landing-section {
          padding: 20px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }
        @media (max-width: 768px) {
          .landing-grid {
            grid-template-columns: 1fr;
          }
          .landing-card {
            padding: 24px;
          }
          .landing-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
      <div className="landing-overlay"></div>
      <div className="landing-card">
        <div className="landing-header">
          <div style={iconBoxStyle}>
            <BrainCircuit size={40} color="#2563eb" />
          </div>
          <h1 className="landing-title">{t('app_title')}</h1>
          <p style={subtitleStyle}>{t('landing_subtitle')}</p>
        </div>

        <div className="landing-grid">
          <section className="landing-section">
            <div style={sectionHeaderStyle}>
              <FileText size={20} color="#3b82f6" />
              <h2 style={sectionTitleStyle}>{t('landing_intro_title')}</h2>
            </div>
            <p style={textStyle}>
              {t('landing_intro_text')}
            </p>
          </section>

          <section className="landing-section">
            <div style={sectionHeaderStyle}>
              <Code2 size={20} color="#8b5cf6" />
              <h2 style={sectionTitleStyle}>{t('landing_tech_title')}</h2>
            </div>
            <p style={textStyle}>
              <strong>Data:</strong> NHIS Sample Cohort, KOSTAT<br />
              <strong>Stack:</strong> React, FastAPI, BigQuery<br />
              <strong>Infra:</strong> Google App Engine, ECharts
            </p>
          </section>

          <section className="landing-section">
            <div style={sectionHeaderStyle}>
              <AlertTriangle size={20} color="#f59e0b" />
              <h2 style={sectionTitleStyle}>{t('landing_disclaimer_title')}</h2>
            </div>
            <ul style={listStyle}>
              <li>{t('landing_disclaimer_1')}</li>
              <li>{t('landing_disclaimer_2')}</li>
            </ul>
          </section>

          <section className="landing-section">
            <div style={sectionHeaderStyle}>
              <User size={20} color="#10b981" />
              <h2 style={sectionTitleStyle}>{t('landing_creator_title')}</h2>
            </div>
            <p style={textStyle}>
              <strong>Developer:</strong> mimir<br />
              <strong>Contact:</strong> Personal Project<br />
              <strong>Status:</strong> Active (2026)
            </p>
          </section>
        </div>

        <div style={footerStyle}>
          <p style={consentTextStyle}>{t('landing_consent')}</p>
          <button style={buttonStyle} onClick={onAccept}>
            {t('landing_accept_btn')} <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div style={bottomInfoStyle}>
        Developed by <strong>mimir</strong> | © 2026 Stroke-Insight Hub.
      </div>
    </div>
  );
};

// Styles (Rest of them kept as JS objects for simplicity where responsiveness isn't critical)
const iconBoxStyle = {
  width: '70px',
  height: '70px',
  background: '#eff6ff',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px'
};

const subtitleStyle = {
  fontSize: '1rem',
  color: '#64748b',
  fontWeight: 500
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '12px'
};

const sectionTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#334155',
  margin: 0
};

const textStyle = {
  fontSize: '0.85rem',
  color: '#475569',
  lineHeight: 1.6,
  margin: 0
};

const listStyle = {
  fontSize: '0.8125rem',
  color: '#475569',
  paddingLeft: '16px',
  margin: 0,
  lineHeight: 1.5
};

const footerStyle = {
  textAlign: 'center',
  borderTop: '1px solid #f1f5f9',
  paddingTop: '24px'
};

const consentTextStyle = {
  fontSize: '0.9rem',
  color: '#64748b',
  marginBottom: '16px'
};

const buttonStyle = {
  background: '#2563eb',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '12px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.2s',
  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
};

const bottomInfoStyle = {
  marginTop: '24px',
  fontSize: '0.8125rem',
  color: '#94a3b8'
};

export default Landing;
