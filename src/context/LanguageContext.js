import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
  if (typeof window === "undefined") return 'fr';
  return localStorage.getItem("lang") || 'fr';
});
const toggleLanguage = () => {
  setLang((prev) => {
    const next = prev === 'fr' ? 'en' : 'fr';
    localStorage.setItem("lang", next);
    return next;
  });
};

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);