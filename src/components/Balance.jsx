import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom, walletAtom } from '../atoms';
import { useBalance } from '../hooks';
import '../styles/balance.css';

const Balance = () => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);
  const { balance, error: balanceError, loading } = useBalance();

  // wallet.getXecBalance() already returns XEC units (not base units)
  const balanceInXec = useMemo(() => {
    if (balance !== null && typeof balance === 'number') {
      return balance; // Balance is already in XEC units from wallet API
    }
    return 0;
  }, [balance]);

  const isValidBalance = balanceInXec !== null && typeof balanceInXec === 'number' && balanceInXec >= 0;

  // CONDITIONAL RENDERING MOVED AFTER ALL HOOKS
  if (!walletConnected || !wallet) {
    return null;
  }

  return (
    <div className="balance-display">
      {balanceError && <p className="balance-error">Error: {balanceError}</p>}

      {/* Loading state - maintain consistent structure */}
      {loading && (
        <div className="balance-main">
          <div className="balance-amount">Loading...</div>
        </div>
      )}

      {/* Main Balance in XEC */}
      {!loading && (
        <div className="balance-main">
          {isValidBalance ? (
            <div className="balance-amount">{balanceInXec.toLocaleString(undefined, { maximumFractionDigits: 2 })} XEC</div>
          ) : (
            <div className="balance-amount">0.00 XEC</div>
          )}
        </div>
      )}
    </div>
  );
};

Balance.propTypes = {
  showValue: PropTypes.bool, // Whether to display value in USD
};

export default Balance;
