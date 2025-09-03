import { useAtom } from 'jotai';
import { walletConnectedAtom, walletAtom, balanceBreakdownAtom } from '../atoms';
import { useTranslation } from '../hooks/useTranslation';
import { useBalance } from '../hooks';
import '../styles/xec-fee-balance.css';

const XecFeeBalance = () => {
  const { t } = useTranslation();
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);
  const [balanceBreakdown] = useAtom(balanceBreakdownAtom);
  const { loading, error } = useBalance();

  if (!walletConnected || !wallet) {
    return null;
  }

  const spendableXEC = balanceBreakdown?.spendableBalance || 0;
  const totalBalance = balanceBreakdown?.totalBalance || 0;
  const estimatedFee = 0.02; // Conservative estimate for token transactions

  const isCriticallyLow = totalBalance < estimatedFee;

  return (
    <div className="xec-fee-balance">
      <div className="fee-balance-header">
        <span className="fee-balance-label">
          {t('fees.available')}
        </span>
      </div>

      {loading && (
        <div className="fee-balance-amount loading">
          {t('common.loading')}
        </div>
      )}

      {error && (
        <div className="fee-balance-error">
          {t('common.error')}: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="fee-balance-content">
          <div className={`fee-balance-amount ${isCriticallyLow ? 'critical' : ''}`}>
            {spendableXEC.toFixed(2)} XEC
          </div>

          {/* Only show critical insufficient balance error */}
          {isCriticallyLow && (
            <div className="fee-warning critical">
              {t('fees.insufficient')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XecFeeBalance;
