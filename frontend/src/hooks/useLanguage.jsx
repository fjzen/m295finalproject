import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredLang, setStoredLang, t as tRaw } from '@/lib/translations';

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  useEffect(() => {
    setStoredLang(lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next === 'de' ? 'de' : 'en');
  }, []);

  const t = useCallback((key) => tRaw(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? { lang: 'en', setLang: () => {}, t: (k) => k };
}
