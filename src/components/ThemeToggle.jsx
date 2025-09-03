import { useAtom } from 'jotai';
import { themeAtom, themeSetterAtom } from '../atoms';
import PropTypes from 'prop-types';

const ThemeToggle = ({ compact = false, className = '' }) => {
  const [theme] = useAtom(themeAtom);
  const [, setTheme] = useAtom(themeSetterAtom);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''} ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        // Sun icon for switching to light theme
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
        </svg>
      ) : (
        // Moon icon for switching to dark theme
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
};

ThemeToggle.propTypes = {
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default ThemeToggle;
