import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loadAllTranslations } from '../services/i18n';
import { Spinner } from '../components/icons/Spinner';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, replacements?: { [key: string]: string }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (translations: { [key: string]: { [key: string]: string } }): string => {
  const savedLang = localStorage.getItem('chatNovaLanguage');
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }
  const browserLang = navigator.language.split('-')[0];
  return translations[browserLang] ? browserLang : 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [translations, setTranslations] = useState<{ [key: string]: { [key: string]: string } } | null>(null);
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    loadAllTranslations().then(loadedTranslations => {
      setTranslations(loadedTranslations);
      setLanguageState(getInitialLanguage(loadedTranslations));
    }).catch(error => {
        console.error("Failed to load translations:", error);
    });
  }, []);

  useEffect(() => {
    if (translations) {
        localStorage.setItem('chatNovaLanguage', language);
    }
  }, [language, translations]);

  const setLanguage = (lang: string) => {
    if (translations && translations[lang]) {
      setLanguageState(lang);
    }
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string }): string => {
    if (!translations) return key;

    let translation = translations[language]?.[key] || translations['en']?.[key] || key;
    
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{{${placeholder}}}`, replacements[placeholder]);
        });
    }
    return translation;
  }, [language, translations]);

  if (!translations) {
    return (
      <div className="flex h-screen w-full bg-[#0f0f1a] items-center justify-center text-white">
        <Spinner />
        <span className="ml-4 text-lg">Loading App...</span>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};