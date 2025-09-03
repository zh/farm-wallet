import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const BottomNavigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: t('navigation.home'), ariaLabel: t('navigation.home') + ' page' },
    { path: '/send', label: t('navigation.send'), ariaLabel: t('navigation.send') + ' tokens' },
    { path: '/fund', label: t('navigation.fund'), ariaLabel: t('navigation.fund') + ' wallet' }
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-navigation">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`nav-item accessible-focus ${currentPath === item.path ? 'active' : ''}`}
          aria-label={item.ariaLabel}
        >
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;
