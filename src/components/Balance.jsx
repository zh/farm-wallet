import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom, walletAtom } from '../atoms';
import { useBalance, useXecPrice } from '../hooks';
import '../styles/balance.css';

const Balance = ({ showValue = true }) => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);
  const { balance, error: balanceError, loading } = useBalance();
  const { price, error: priceError } = useXecPrice();

  // wallet.getXecBalance() already returns XEC units (not base units)
  const balanceInXec = useMemo(() => {
    if (balance !== null && typeof balance === 'number') {
      return balance; // Balance is already in XEC units from wallet API
    }
    return 0;
  }, [balance]);

  // Calculate base units from XEC (XEC * 100 = base units)
  const balanceInSats = useMemo(() => {
    if (balance !== null && typeof balance === 'number') {
      return Math.round(balance * 100); // Convert XEC to base units
    }
    return 0;
  }, [balance]);

  // Calculate USD value
  const balanceInUsd = useMemo(() => {
    if (price && price > 0 && balanceInXec > 0) {
      return (balanceInXec * price).toFixed(6);
    }
    return null;
  }, [balanceInXec, price]);

  const isValidBalance = balanceInXec !== null && typeof balanceInXec === 'number' && balanceInXec >= 0;

  // CONDITIONAL RENDERING MOVED AFTER ALL HOOKS
  if (!walletConnected || !wallet) {
    return null;
  }

  return (
    <div className="balance-display">
      {balanceError && <p className="balance-error">Error: {balanceError}</p>}

      {/* Loading state */}
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

      {/* Secondary info - Sats and USD */}
      {!loading && (
        <div className="balance-secondary">
          <div className="balance-sats">
            {isValidBalance ? `${balanceInSats.toLocaleString()} sat` : '0 sat'}
          </div>
          {showValue && (
            <>
              <div className="balance-separator">|</div>
              <div className="balance-usd">
                {balanceInUsd ? `$${balanceInUsd} USD` : (priceError ? 'USD unavailable' : 'Loading USD...')}
              </div>
            </>
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
