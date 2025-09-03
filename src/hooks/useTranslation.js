import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { localeAtom } from '../atoms';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  const [locale, setLocale] = useAtom(localeAtom);

  const changeLanguage = (lang) => {
    setLocale(lang);
    i18n.changeLanguage(lang);
  };

  return {
    t,
    locale,
    changeLanguage,
    languages: ['en', 'fr'],
    languageNames: {
      en: 'English',
      fr: 'Français'
    }
  };
};
