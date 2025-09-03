import MobileLayout from '../components/Layout/MobileLayout';
import TokenBalance from '../components/TokenBalance';
import Address from '../components/Address';
import { useConnectWallet } from '../hooks';
import { useTranslation } from '../hooks/useTranslation';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../atoms';
import '../styles/home.css';

const HomePage = () => {
  const { t } = useTranslation();
  const { disconnectWallet } = useConnectWallet();
  const [walletConnected] = useAtom(walletConnectedAtom);

  const handleDisconnect = () => {
    if (window.confirm(t('wallet.disconnectConfirm'))) {
      disconnectWallet();
    }
  };

  return (
    <MobileLayout title={t('wallet.title')}>
      <div className="home-content">
        {/* Disconnect button at top */}
        {walletConnected && (
          <div className="wallet-actions-top">
            <button
              onClick={handleDisconnect}
              className="disconnect-button-top"
            >
              {t('common.disconnect')}
            </button>
          </div>
        )}

        {/* Address component (QR + address) for token receiving */}
        {walletConnected && (
          <div className="address-section">
            <Address
              addressFormat={'long'}
              showQR={true}
            />
          </div>
        )}

        {/* Token Balance component */}
        <div className="wallet-overview">
          <TokenBalance />
        </div>
      </div>
    </MobileLayout>
  );
};

export default HomePage;
