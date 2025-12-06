import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

// Detect user language from browser or localStorage
const getInitialLanguage = (): string => {
  // Check localStorage first
  const savedLanguage = localStorage.getItem('i18n-language');
  if (savedLanguage) {
    return savedLanguage;
  }

  // Fallback to browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // Map browser language to supported languages
  if (browserLang.startsWith('pt')) {
    return 'pt-BR';
  }
  
  return 'en-US';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        translation: ptBR,
      },
      'en-US': {
        translation: enUS,
      },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

