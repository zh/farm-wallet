import { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom,
  tokenIdAtom,
  notificationAtom,
  busyAtom,
  balanceRefreshTriggerAtom,
  tokenRefreshTriggerAtom,
  coinSelectionStrategyAtom,
  balanceBreakdownAtom
} from '../atoms';
import QrCodeScanner from './QrCodeScanner';
import XecFeeBalance from './XecFeeBalance';
import { useTranslation } from '../hooks/useTranslation';
import { useToken } from '../hooks/useToken';
import { sanitizeInput, isValidXECAddress, isValidAmount } from '../utils/validation';
import { handleError, safeAsyncOperation } from '../utils/errorHandler';
import '../styles/sendxec.css';

const TokenSend = () => {
  const { t } = useTranslation();
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const { token } = useToken();
  const [tokenId] = useAtom(tokenIdAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [busy, setBusy] = useAtom(busyAtom);
  const setBalanceRefreshTrigger = useSetAtom(balanceRefreshTriggerAtom);
  const setTokenRefreshTrigger = useSetAtom(tokenRefreshTriggerAtom);
  const [strategy] = useAtom(coinSelectionStrategyAtom);
  const [balanceBreakdown] = useAtom(balanceBreakdownAtom);

  const [sendForm, setSendForm] = useState({
    address: '',
    amount: ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const [lastTransactionTime, setLastTransactionTime] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // Update countdown timer for transaction cooldown
  useEffect(() => {
    if (lastTransactionTime === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastTx = now - lastTransactionTime;
      const minInterval = 5000; // 5 seconds
      const remaining = Math.max(0, Math.ceil((minInterval - timeSinceLastTx) / 1000));

      setCountdown(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        // Trigger token balance refresh after cooldown ends
        // Add a small delay to account for network propagation
        setTimeout(() => {
          setTokenRefreshTrigger(Date.now());
          setBalanceRefreshTrigger(Date.now());
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastTransactionTime, setTokenRefreshTrigger, setBalanceRefreshTrigger]);

  const handleInputChange = (field, value) => {
    setSendForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressDetected = (scannedData) => {
    if (!walletConnected) {
      setNotification({ type: 'error', message: t('token.walletNotConnected') });
      return;
    }

    try {
      if (Array.isArray(scannedData) && scannedData.length > 0) {
        const rawAddress = scannedData[0].rawValue;
        const sanitizedAddress = sanitizeInput(rawAddress, 'address');

        if (!isValidXECAddress(sanitizedAddress)) {
          setNotification({ type: 'error', message: t('token.invalidAddress') });
          return;
        }

        handleInputChange('address', sanitizedAddress);
        setNotification({ type: 'success', message: t('token.addressScanned') });
      } else {
        setNotification({ type: 'error', message: t('token.qrScanFailed') });
      }
    } catch (error) {
      const handledError = handleError(error, 'qr_scan');
      setNotification({ type: 'error', message: handledError.message });
    }
    setShowScanner(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!walletConnected) {
      setNotification({ type: 'error', message: t('token.walletNotConnected') });
      return;
    }

    // Prevent rapid consecutive transactions
    if (countdown > 0) {
      setNotification({
        type: 'error',
        message: t('token.transactionCooldown', { countdown })
      });
      return;
    }

    if (!tokenId) {
      setNotification({ type: 'error', message: t('token.tokenNotFound') });
      return;
    }

    try {
      // Validate and sanitize inputs
      const sanitizedRecipient = sanitizeInput(sendForm.address, 'address');
      const sanitizedAmount = sanitizeInput(sendForm.amount, 'amount');

      if (!sanitizedRecipient) {
        setNotification({ type: 'error', message: t('token.addressRequired') });
        return;
      }

      if (!isValidXECAddress(sanitizedRecipient)) {
        setNotification({ type: 'error', message: t('token.invalidAddress') });
        return;
      }

      if (!isValidAmount(sanitizedAmount, 'etoken')) {
        setNotification({ type: 'error', message: t('token.amountRequired') });
        return;
      }

      const amount = parseFloat(sanitizedAmount);
      if (amount <= 0) {
        setNotification({ type: 'error', message: t('token.amountPositive') });
        return;
      }

      // Check if we have enough balance
      if (!token) {
        setNotification({ type: 'error', message: t('token.tokenNotFound') });
        return;
      }

      const tokenBalance = typeof token.balance === 'object' ? token.balance.display : (token.balance || 0);

      // Check balance - using display amount for comparison
      if (amount > tokenBalance) {
        setNotification({
          type: 'error',
          message: t('token.insufficientBalance', {
            balance: tokenBalance,
            symbol: token.symbol || 'tokens'
          })
        });
        return;
      }

      // Check if we have enough spendable XEC for transaction fees and dust prevention
      const spendableXEC = balanceBreakdown?.spendableBalance || 0;
      const minimumXECRequired = 6; // Dust prevention + fee buffer

      // Ensure minimum XEC balance for dust prevention
      if (spendableXEC < minimumXECRequired) {
        setNotification({
          type: 'error',
          message: t('xec.validation.dustPreventionTokens', {
            required: minimumXECRequired,
            available: spendableXEC.toFixed(2)
          })
        });
        return;
      }

      setBusy(true);

      const result = await safeAsyncOperation(
        async () => {
          // Ensure wallet is initialized
          if (!wallet.isInitialized) {
            await wallet.initialize();
          }

          // Refresh wallet UTXOs before sending to avoid stale UTXO mempool conflicts
          await wallet.initialize();

          // Verify token balance after refresh
          const refreshedTokens = await wallet.listETokens();
          const refreshedToken = refreshedTokens.find(t => t.tokenId === tokenId);
          if (!refreshedToken) {
            throw new Error('Token not found after UTXO refresh. Please check your token balance.');
          }

          // Send tokens
          const outputs = [{
            address: sanitizedRecipient,
            amount: amount // Use display amount, not atoms
          }];

          // Try wallet.sendETokens with fee rate and strategy (primary method from CLI)
          let txid;
          try {
            const sendOptions = {
              feeRate: 2.0,
              coinSelectionStrategy: strategy
            };
            txid = await wallet.sendETokens(tokenId, outputs, sendOptions);
          } catch {
            // Fallback to hybridTokens.sendTokens with strategy (CLI pattern)
            const sendOptions = {
              feeRate: 2.0,
              coinSelectionStrategy: strategy
            };
            txid = await wallet.hybridTokens.sendTokens(
              tokenId,
              outputs,
              {
                mnemonic: wallet.walletInfo.mnemonic,
                xecAddress: wallet.walletInfo.xecAddress,
                hdPath: wallet.walletInfo.hdPath,
                privateKey: wallet.walletInfo.privateKey,
                publicKey: wallet.walletInfo.publicKey
              },
              wallet.utxos.utxoStore.xecUtxos,
              sendOptions.feeRate
            );
          }

          return txid;
        },
        'send_tokens'
      );

      // Record successful transaction time
      setLastTransactionTime(Date.now());

      // Trigger balance and token refresh after successful transaction
      setBalanceRefreshTrigger(Date.now());
      setTokenRefreshTrigger(Date.now());

      // Reset form and show success
      setSendForm({
        address: '',
        amount: ''
      });

      setNotification({
        type: 'success',
        message: t('token.sendSuccess', {
          amount,
          symbol: token.symbol || 'tokens',
          address: sanitizedRecipient.substring(0, 15),
          txid: result.substring(0, 8)
        })
      });

    } catch (error) {
      console.error('Token transaction failed:', error);

      // More specific error analysis for WASM-related issues
      if (error.message?.includes('wbindgen') ||
          error.message?.includes('WebAssembly') ||
          error.message?.includes('WASM') ||
          error.message?.includes('function import requires a callable')) {
        setNotification({
          message: t('errors.browserCompatibility'),
          type: 'error'
        });
        setBusy(false);
        return;
      }

      // Check for specific fee/balance related errors
      if (error.message?.includes('Insufficient XEC for transaction fees') ||
          error.message?.includes('insufficient funds') ||
          error.message?.includes('Not enough XEC')) {

        const spendableXEC = balanceBreakdown?.spendableBalance || 0;
        const tokenDustValue = balanceBreakdown?.tokenDustValue || 0;

        setNotification({
          message: t('fees.transactionFailed', {
            spendable: spendableXEC.toFixed(2),
            tokenDustInfo: tokenDustValue > 0 ? t('fees.withTokenDust', {
              tokenDust: tokenDustValue.toFixed(2)
            }) : ''
          }),
          type: 'error'
        });

        // Trigger balance refresh to get fresh UTXO data
        setBalanceRefreshTrigger(Date.now());
        setBusy(false);
        return;
      }

      // Check for specific crypto/signing failures that might be WASM-related
      if (error.message?.includes('signing') ||
          error.message?.includes('crypto') ||
          error.message?.includes('hash') ||
          error.message?.includes('Unable to sign')) {
        setNotification({
          message: t('errors.signingFailed'),
          type: 'error'
        });
        setBusy(false);
        return;
      }

      const handledError = handleError(error, 'send_tokens');

      // If error is related to mempool conflicts or UTXO issues, trigger balance refresh
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('txn-mempool-conflict') ||
          errorMessage.includes('mempool conflict') ||
          errorMessage.includes('missing inputs') ||
          errorMessage.includes('inputs-missingorspent')) {
        setBalanceRefreshTrigger(Date.now());
      }

      setNotification({ type: 'error', message: handledError.message });
    } finally {
      setBusy(false);
    }
  };

  const setMaxAmount = () => {
    if (token) {
      const balance = typeof token.balance === 'object' ? token.balance.display : (token.balance || 0);
      handleInputChange('amount', balance.toString());
    }
  };

  if (!walletConnected) {
    return (
      <div className="send-tokens-container">
        <h2>{t('token.send')}</h2>
        <div className="send-tokens-empty">
          <p>{t('token.walletNotConnected')}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="send-tokens-container">
        <h2>{t('token.send')}</h2>
        <div className="send-tokens-empty">
          <h3>{t('token.noTokensAvailable')}</h3>
          <p>{t('token.noTokensMessage')}</p>
          <p>{t('token.tokensWillAppear')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="send-tokens-container">
      <h2>{t('token.send')}</h2>

      {/* XEC Fee Balance Display */}
      <XecFeeBalance />

      <form onSubmit={handleSend}>
        {/* Recipient Address */}
        <div className="form-group">
          <label htmlFor="recipient-address" className="form-label">
            {t('token.recipient')}
          </label>
          <div className="form-input-group">
            <input
              id="recipient-address"
              type="text"
              value={sendForm.address}
              onChange={(e) => handleInputChange('address', sanitizeInput(e.target.value, 'address'))}
              placeholder={t('token.recipientPlaceholder')}
              disabled={busy}
              className="form-input"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="scan-button"
              disabled={busy}
            >
              {t('common.qrScan')}
            </button>
          </div>
          {sendForm.address && sendForm.address.length > 10 && !isValidXECAddress(sendForm.address) && (
            <div className="error-text">
              {t('token.invalidAddress')}
            </div>
          )}

          {/* QR Scanner Modal */}
          {showScanner && (
            <div className="qr-scanner-modal">
              <button
                type="button"
                disabled={busy}
                className="close-scanner-button"
                onClick={() => setShowScanner(false)}
              >
                {t('common.close')}
              </button>
              <QrCodeScanner onAddressDetected={handleAddressDetected} />
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="token-amount" className="form-label">
            {t('token.amount')}
          </label>
          <div className="form-input-group">
            <input
              id="token-amount"
              type="number"
              value={sendForm.amount}
              onChange={(e) => handleInputChange('amount', sanitizeInput(e.target.value, 'amount'))}
              placeholder={t('token.amountPlaceholder')}
              step="any"
              min="0"
              disabled={busy}
              className="form-input"
            />
            {token && (
              <button
                type="button"
                onClick={setMaxAmount}
                className="max-button"
                disabled={busy}
              >
                {t('common.max')}
              </button>
            )}
          </div>
          {token && (
            <div className="balance-info">
              {t('token.available')}: {typeof token.balance === 'object' ? token.balance.display : token.balance} {token.ticker || token.symbol}
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="send-button"
            disabled={
              busy ||
              !sendForm.amount ||
              !sendForm.address ||
              !walletConnected ||
              countdown > 0
            }
          >
            {busy ?
              t('token.sending') :
              countdown > 0 ?
                t('token.transactionCooldown', { countdown }) :
                t('token.sendTokens')
            }
          </button>

        </div>

      </form>
    </div>
  );
};

export default TokenSend;
