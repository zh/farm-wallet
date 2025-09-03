import MobileLayout from '../components/Layout/MobileLayout';
import WalletDetails from '../components/WalletDetails';
import Address from '../components/Address';
import Balance from '../components/Balance';
import SendXEC from '../components/SendXEC';
import { useTranslation } from '../hooks/useTranslation';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../atoms';
import { useState } from 'react';
import '../styles/fund.css';

const FundPage = () => {
  const { t } = useTranslation();
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [showEmptyWallet, setShowEmptyWallet] = useState(false);

  if (!walletConnected) {
    return (
      <MobileLayout title={t('fund.title')}>
        <div className="fund-page-content">
          <div className="fund-empty">
            <p>{t('token.walletNotConnected')}</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={t('fund.title')}>
      <div className="fund-page-content">
        {/* XEC Receiving Section */}
        <div className="fund-section">
          <h3>{t('fund.receiveXec')}</h3>
          <div className="xec-receive-container">
            {/* XEC Balance */}
            <div className="xec-balance-display">
              <Balance showValue={true} showSecondary={false} />
            </div>

            {/* XEC Address with QR */}
            <div className="xec-address-section">
              <Address
                addressFormat={'long'}
                showQR={true}
              />
            </div>
          </div>
        </div>

        {/* Empty Wallet Section - collapsible */}
        <div className="fund-section">
          <h3
            className="empty-wallet-title clickable"
            onClick={() => setShowEmptyWallet(!showEmptyWallet)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="toggle-icon">{showEmptyWallet ? '▼' : '▶'}</span>
            {t('xec.title')}
          </h3>
          {showEmptyWallet && <SendXEC />}
        </div>

        {/* Wallet Information Section - now collapsible */}
        <div className="fund-section">
          <h3
            className="wallet-info-title clickable"
            onClick={() => setShowWalletInfo(!showWalletInfo)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="toggle-icon">{showWalletInfo ? '▼' : '▶'}</span>
            {t('fund.walletInfo')}
          </h3>
          {showWalletInfo && <WalletDetails />}
        </div>
      </div>
    </MobileLayout>
  );
};

export default FundPage;