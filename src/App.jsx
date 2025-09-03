import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { scriptLoadedAtom, walletConnectedAtom, localeAtom } from './atoms';
import i18n from './i18n';

// Pages
import HomePage from './pages/HomePage';
import SendPage from './pages/SendPage';
import FundPage from './pages/FundPage';

// Layout & Components
import DisconnectedView from './components/Layout/DisconnectedView';
import ThemeProvider from './components/ThemeProvider';
import Notification from './components/Notification';

// i18n
import './i18n';

// Styles
import './App.css';
import './styles/themes.css';
import './styles/layout.css';

function App() {
  const [scriptLoaded] = useAtom(scriptLoadedAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [locale] = useAtom(localeAtom);

  useEffect(() => {
    // Initialize i18n on app load
    import('./i18n').then(() => {
      console.log('i18n initialized');
    });
  }, []);

  // Synchronize locale atom with i18n system
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  // Show disconnected view when script not loaded or wallet not connected
  if (!scriptLoaded || !walletConnected) {
    return (
      <ThemeProvider>
        <DisconnectedView />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <Notification />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/fund" element={<FundPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;