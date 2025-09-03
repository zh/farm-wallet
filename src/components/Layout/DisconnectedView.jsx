import LoadScript from '../LoadScript';
import ECashWallet from '../ECashWallet';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useTranslation } from '../../hooks/useTranslation';
import { useAtom } from 'jotai';
import { scriptLoadedAtom, scriptErrorAtom } from '../../atoms';
import '../../styles/disconnected.css';

const DisconnectedView = () => {
  const { t } = useTranslation();
  const [scriptLoaded] = useAtom(scriptLoadedAtom);
  const [scriptError] = useAtom(scriptErrorAtom);

  return (
    <div className="disconnected-view">
      <LoadScript scriptSrc="/minimal-xec-wallet.min.js" />

      <div className="app-header">
        <div className="header-controls">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="app-title">
          {t('wallet.title')}
        </div>
      </div>

      <div className="wallet-setup">
        {scriptError && (
          <div className="error">
            <p>❌ {t('wallet.errorLoading')}</p>
            <div className="error-info">
              {scriptError}
              <br />
              {t('wallet.checkFile')}
            </div>
          </div>
        )}

        {!scriptLoaded && !scriptError && (
          <div className="loading">
            <p>
              <span className="loading-spinner"></span>
              {t('wallet.loadingLibrary')}
            </p>
            <div className="loading-info">
              {t('wallet.connecting')}
              {t('wallet.connectingInfo')}
            </div>
          </div>
        )}

        {scriptLoaded && (
          <ECashWallet />
        )}
      </div>
    </div>
  );
};

export default DisconnectedView;
