import React from 'react';
import { Target, Database, BrainCircuit, Code2, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SystemInfo = () => {
  const { t } = useLanguage();

  return (
    <div className="landing-wrapper" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 20px', background: 'transparent' }}>
      <style>{`
        .landing-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', 'Pretendard', sans-serif;
          position: relative;
        }
        .landing-card {
          width: 100%;
          max-width: 1000px;
          background: #ffffff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
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
              <Target size={20} color="#ef4444" />
              <h2 style={sectionTitleStyle}>{t('landing_purpose_title')}</h2>
            </div>
            <p style={textStyle}>
              {t('landing_purpose_text')}
            </p>
          </section>

          <section className="landing-section">
            <div style={sectionHeaderStyle}>
              <Code2 size={20} color="#8b5cf6" />
              <h2 style={sectionTitleStyle}>{t('landing_tech_title')}</h2>
            </div>
            <ul style={listStyle}>
              <li><strong>Frontend:</strong> {t('landing_tech_frontend')}</li>
              <li><strong>Backend:</strong> {t('landing_tech_backend')}</li>
              <li><strong>Database:</strong> {t('landing_tech_db')}</li>
              <li><strong>Infra:</strong> {t('landing_tech_infra')}</li>
            </ul>
          </section>

          <section className="landing-section" style={{ gridColumn: '1 / -1' }}>
            <div style={sectionHeaderStyle}>
              <Database size={20} color="#3b82f6" />
              <h2 style={sectionTitleStyle}>{t('landing_data_title')}</h2>
            </div>
            <div style={{ ...textStyle, marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                {t('landing_data_spec_source')}
              </div>
              <div style={{ paddingLeft: '8px' }}>
                <div style={{ marginBottom: '4px' }}>o <strong>{t('landing_data_spec_pop_title')}:</strong> {t('landing_data_spec_pop')}</div>
                <div style={{ marginBottom: '4px' }}>o <strong>{t('landing_data_spec_content_title')}:</strong> {t('landing_data_spec_content')}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#475569', background: '#e2e8f0', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>o {t('landing_data_spec_epi_title')}</div>
              <div style={{ paddingLeft: '16px' }}>
                <div style={{ marginBottom: '8px' }}>- {t('landing_data_spec_epi_1')}</div>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: '#334155' }}>- {t('landing_data_spec_sel_title')}</div>
                <div style={{ paddingLeft: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>{t('landing_data_spec_sel_1')}</div>
                  <div style={{ marginBottom: '4px' }}>{t('landing_data_spec_sel_2')}</div>
                  <div style={{ marginBottom: '12px' }}>{t('landing_data_spec_sel_3')}</div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: '#334155' }}>
                {t('landing_data_spec_note')}
              </div>
            </div>
          </section>

          <section className="landing-section">
            <div style={sectionHeaderStyle}>
              <User size={20} color="#10b981" />
              <h2 style={sectionTitleStyle}>{t('landing_creator_title')}</h2>
            </div>
            <p style={textStyle}>
              <strong>Developer:</strong> {t('landing_creator_dev')}<br />
              <strong>Project:</strong> {t('landing_creator_type')}<br />
              <strong>Status:</strong> {t('landing_creator_status')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

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

export default SystemInfo;
