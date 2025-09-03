import { useAtom } from 'jotai';
import { walletConnectedAtom, walletAtom } from '../atoms';
import { useTranslation } from '../hooks/useTranslation';
import { useToken } from '../hooks';
import '../styles/balance.css';

const TokenBalance = () => {
  const { t } = useTranslation();
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);
  const { token, loading, error } = useToken();

  const formatTokenBalance = (balance, decimals = 0) => {
    if (!balance || balance === 0) return '0';

    const divisor = Math.pow(10, decimals);
    const formatted = (balance / divisor).toFixed(Math.min(decimals, 8));

    // Remove trailing zeros
    return formatted.replace(/\.?0+$/, '');
  };

  const getTokenBalance = (token) => {
    if (!token || !token.balance) return { value: 0, isDisplayValue: false };

    // Handle both number and object formats
    if (typeof token.balance === 'number') {
      return { value: token.balance, isDisplayValue: false };
    }

    // Prioritize display value (already formatted correctly)
    if (token.balance.display !== undefined) {
      return { value: token.balance.display, isDisplayValue: true };
    }

    // Fallback to atoms (needs decimal conversion)
    if (token.balance.atoms !== undefined) {
      return { value: Number(token.balance.atoms), isDisplayValue: false };
    }

    return { value: 0, isDisplayValue: false };
  };

  const tokenBalanceData = token ? getTokenBalance(token) : { value: 0, isDisplayValue: false };
  const isValidBalance = token && tokenBalanceData.value >= 0;

  if (!walletConnected || !wallet) {
    return null;
  }

  return (
    <div className="balance-display">
      {error && <p className="balance-error">{t('common.error')}: {error}</p>}

      {/* Loading state - maintain same structure as loaded state */}
      {loading && (
        <div className="balance-main">
          <div className="balance-amount">Loading...</div>
        </div>
      )}

      {/* Token Balance */}
      {!loading && (
        <div className="balance-main">
          {isValidBalance ? (
            <>
              <div className="balance-amount">
                {tokenBalanceData.isDisplayValue
                  ? tokenBalanceData.value
                  : formatTokenBalance(tokenBalanceData.value, token.decimals || 0)
                } {token.ticker || token.symbol || 'TOKEN'}
              </div>
              {token.name && token.name !== (token.ticker || token.symbol) && (
                <div className="balance-token-name">
                  {token.name}
                </div>
              )}
            </>
          ) : (
            <div className="balance-amount">0 {t('token.balance')}</div>
          )}
        </div>
      )}

    </div>
  );
};

export default TokenBalance;
