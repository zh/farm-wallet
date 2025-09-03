import { useTranslation } from '../hooks/useTranslation';
import '../styles/language-toggle.css';

const LanguageToggle = () => {
  const { locale, changeLanguage, languages } = useTranslation();

  return (
    <div className="language-toggle">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          className={`language-button ${locale === lang ? 'active' : ''}`}
          type="button"
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
