import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('stroke_insight_lang') || 'ko';
  });

  useEffect(() => {
    localStorage.setItem('stroke_insight_lang', lang);
  }, [lang]);

  const t = (key, params = {}) => {
    let text = translations[lang][key] || key;
    
    // 파라미터 치환 (예: {count})
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ko' ? 'en' : 'ko'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
