import { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  notificationAtom,
  busyAtom,
  walletAtom,
  walletConnectedAtom,
  balanceRefreshTriggerAtom
} from '../atoms';
import QrCodeScanner from './QrCodeScanner';
import { useTranslation } from '../hooks/useTranslation';
import useBalance from '../hooks/useBalance';
import { sanitizeInput, isValidXECAddress, isValidAmount } from '../utils/validation';
import '../styles/sendxec.css';

const SendXEC = () => {
  const { t } = useTranslation();
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [busy, setBusy] = useAtom(busyAtom);
  const setBalanceRefreshTrigger = useSetAtom(balanceRefreshTriggerAtom);
  const { balanceBreakdown } = useBalance();

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
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastTransactionTime]);

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
          setNotification({ type: 'error', message: t('xec.validation.invalidAddress') });
          return;
        }

        handleInputChange('address', sanitizedAddress);
        setNotification({ type: 'success', message: t('token.addressScanned') });
      } else {
        setNotification({ type: 'error', message: t('token.qrScanFailed') });
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    }
    setShowScanner(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!walletConnected) {
      setNotification({ type: 'error', message: t('token.walletNotConnected') });
      return;
    }

    // Prevent rapid consecutive transactions (minimum 5 seconds between sends)
    if (countdown > 0) {
      setNotification({
        type: 'error',
        message: t('xec.transactionCooldown', { countdown })
      });
      return;
    }

    try {
      // Validate and sanitize inputs
      const sanitizedRecipient = sanitizeInput(sendForm.address, 'address');
      const sanitizedAmount = sanitizeInput(sendForm.amount, 'amount');

      if (!sanitizedRecipient) {
        setNotification({ type: 'error', message: t('xec.validation.addressRequired') });
        return;
      }

      if (!isValidXECAddress(sanitizedRecipient)) {
        setNotification({ type: 'error', message: t('xec.validation.invalidAddress') });
        return;
      }

      if (!sanitizedAmount) {
        setNotification({ type: 'error', message: t('xec.validation.amountRequired') });
        return;
      }

      if (!isValidAmount(sanitizedAmount, 'xec')) {
        setNotification({ type: 'error', message: t('xec.validation.invalidAmount') });
        return;
      }

      const amount = parseFloat(sanitizedAmount);
      if (amount <= 0) {
        setNotification({ type: 'error', message: t('xec.validation.amountPositive') });
        return;
      }

      // Check if we have enough spendable balance
      const spendableXEC = balanceBreakdown?.spendableBalance || 0;
      if (amount > spendableXEC) {
        setNotification({
          type: 'error',
          message: t('xec.validation.insufficientBalance', {
            balance: spendableXEC.toFixed(2),
            amount: amount.toFixed(2)
          })
        });
        return;
      }

      // Check dust prevention - ensure at least 6 XEC remains after send
      const remainingAfterSend = spendableXEC - amount;
      if (remainingAfterSend < 6 && spendableXEC >= 6) {
        setNotification({
          type: 'error',
          message: t('xec.validation.dustPrevention')
        });
        return;
      }

      setBusy(true);

      try {
        console.log(`Sending ${amount} XEC to:`, sanitizedRecipient);

        // Convert XEC amount to satoshis (1 XEC = 100 satoshis)
        const amountSats = Math.round(amount * 100);

        // Pre-send validation
        if (!amountSats || isNaN(amountSats) || amountSats <= 0) {
          throw new Error(`Invalid amount calculation: ${amountSats} (from ${amount} XEC)`);
        }

        // Create outputs with correct property name (amountSat, not amountSats)
        const outputs = [{ address: sanitizedRecipient, amountSat: amountSats }];

        console.log('Broadcasting transaction...');

        const txid = await wallet.sendXec(outputs);

        console.log('Send successful, txid:', txid);

        // Record successful transaction time
        setLastTransactionTime(Date.now());

        // Trigger balance refresh after successful transaction
        setBalanceRefreshTrigger(Date.now());

        // Reset form and show success
        setSendForm({
          address: '',
          amount: ''
        });

        setNotification({
          type: 'success',
          message: t('xec.sendSuccess', {
            amount: amount.toFixed(2),
            address: sanitizedRecipient.substring(0, 15),
            txid: txid.substring(0, 8)
          })
        });
      } catch (error) {
        console.error('=== SEND XEC FAILED ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // If error is related to missing inputs, trigger balance refresh
        if (error.message?.toLowerCase().includes('missing inputs') ||
            error.message?.toLowerCase().includes('inputs-missingorspent')) {
          console.log('Triggering balance refresh due to UTXO-related error');
          setBalanceRefreshTrigger(Date.now());
        }

        // Enhanced error handling with specific debugging
        let errorMessage = error.message || t('errors.generic');

        if (error.message?.includes('Invalid amount') || error.message?.includes('undefined')) {
          errorMessage = 'Transaction failed: Invalid amount format. Please check the amount and try again.';
        } else if (error.message?.includes('browser') || error.message?.includes('compatibility')) {
          errorMessage = t('errors.browserCompatibility');
        } else if (error.message?.includes('signing') || error.message?.includes('transaction signing')) {
          errorMessage = t('errors.signingFailed');
        } else if (error.message?.includes('mempool') || error.message?.includes('conflict')) {
          errorMessage = t('errors.mempoolConflict');
        } else if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
          errorMessage = 'Insufficient balance for transaction including fees.';
        }

        setNotification({
          type: 'error',
          message: `Send XEC failed: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('XEC send validation error:', error);
      setNotification({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };

  const setMaxAmount = () => {
    if (balanceBreakdown) {
      const spendableXEC = balanceBreakdown.spendableBalance || 0;
      // Leave 6 XEC minimum to prevent dust UTXOs
      const maxSendable = Math.max(0, spendableXEC - 6);
      handleInputChange('amount', maxSendable.toString());
    }
  };


  return (
    <div className="sendxec-container">
      <form onSubmit={handleSend}>
        {/* Address Input with QR Scanner */}
        <div className="send-group">
          <div className="form-input-group">
            <input
              type="text"
              value={sendForm.address}
              onChange={(e) => handleInputChange('address', sanitizeInput(e.target.value, 'address'))}
              placeholder={t('xec.recipientPlaceholder')}
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
              {t('xec.validation.invalidAddress')}
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
                {t('common.close')} {t('common.qrScan')}
              </button>
              <QrCodeScanner onAddressDetected={handleAddressDetected} />
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="send-group">
          <label htmlFor="xec-amount" className="form-label">
            {t('xec.amount')}
          </label>
          <div className="form-input-group">
            <input
              id="xec-amount"
              type="number"
              value={sendForm.amount}
              onChange={(e) => handleInputChange('amount', sanitizeInput(e.target.value, 'amount'))}
              placeholder={t('xec.amountPlaceholder')}
              step="0.01"
              min="0"
              disabled={busy}
              className="form-input"
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="max-button"
              disabled={busy}
            >
              {t('common.max')}
            </button>
          </div>
          {sendForm.amount && !isValidAmount(sendForm.amount, 'xec') && (
            <div className="error-text">
              {t('xec.validation.invalidAmount')}
            </div>
          )}
          {balanceBreakdown && (
            <div className="balance-info">
              {t('xec.available')}: {balanceBreakdown.spendableBalance?.toFixed(2) || 0} XEC
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="send-actions">
          <button
            type="submit"
            className="send-button"
            disabled={busy || !sendForm.address || !sendForm.amount || !walletConnected || countdown > 0}
          >
            {busy ? t('xec.sending') : countdown > 0 ? t('xec.waitCountdown', { countdown }) : t('common.send')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendXEC;
