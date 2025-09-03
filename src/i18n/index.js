import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'farm-wallet-language',
      caches: ['localStorage'],
      checkWhitelist: true
    },

    whitelist: ['en', 'fr'],

    interpolation: {
      escapeValue: false // React already does escaping
    },

    react: {
      useSuspense: false // We'll handle loading states manually
    }
  });

export default i18n;