import { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { walletAtom, notificationAtom } from '../atoms';
import { hexToWIF } from '../utils/wifUtils';
import '../styles/walletdetails.css';

const WalletDetails = () => {
  const [wallet] = useAtom(walletAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [wifPrivateKey, setWifPrivateKey] = useState('Converting...');

  // Convert hex to WIF asynchronously using robust conversion
  useEffect(() => {
    const convertHexToWIF = async () => {
      const hexPrivateKey = wallet?.walletInfo?.privateKey;

      // If wallet already has WIF format, use it
      if (wallet?.walletInfo?.privateKeyWif) {
        setWifPrivateKey(wallet.walletInfo.privateKeyWif);
        return;
      }

      // If wallet stores WIF in privateKey field (starts with K, L, 5, c, or 9)
      if (hexPrivateKey && /^[KL5c9]/.test(hexPrivateKey)) {
        setWifPrivateKey(hexPrivateKey);
        return;
      }

      // Convert hex format to WIF using robust minimal-xec-wallet implementation
      if (hexPrivateKey && hexPrivateKey.length === 64 && /^[a-fA-F0-9]+$/.test(hexPrivateKey)) {
        try {
          // Use the robust WIF conversion utility
          const wif = hexToWIF(hexPrivateKey, true, false); // compressed, mainnet
          if (wif) {
            setWifPrivateKey(wif);
            return;
          }
          setWifPrivateKey(hexPrivateKey);
        } catch (error) {
          console.error('🔧 Failed to convert hex to WIF:', error);
          setWifPrivateKey(hexPrivateKey);
        }
      } else {
        setWifPrivateKey(hexPrivateKey || 'N/A');
      }
    };

    if (wallet?.walletInfo?.privateKey) {
      convertHexToWIF();
    }
  }, [wallet?.walletInfo?.privateKey, wallet?.walletInfo?.privateKeyWif]);

  const getWIFFromHex = () => {
    return wifPrivateKey;
  };

  const handleCopyClick = (text, label) => {
    // Prevent event bubbling that might interfere with wallet state
    if (!text || text === 'N/A') return;

    try {
      // Use the older document.execCommand as fallback to avoid async issues
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setNotification({ type: 'success', message: `${label} copied!` });
        }).catch(() => {
          fallbackCopy(text, label);
        });
      } else {
        fallbackCopy(text, label);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      setNotification({ type: 'error', message: 'Copy failed' });
    }
  };

  const fallbackCopy = (text, label) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setNotification({ type: 'success', message: `${label} copied!` });
    } catch (error) {
      console.error('Fallback copy failed:', error);
      setNotification({ type: 'error', message: 'Copy failed' });
    }
  };

  // Wallet data - only essential fields
  const walletData = {
    mnemonic: wallet?.walletInfo?.mnemonic || 'N/A',
    xecAddress: wallet?.walletInfo?.xecAddress || wallet?.walletInfo?.address || 'N/A',
    privateKeyWIF: getWIFFromHex(),
    hdPath: wallet?.walletInfo?.hdPath || "m/44'/1899'/0'/0/0"
  };

  return (
    <div className="walletdetails-info">
      <div className="wallet-detail-item">
        <span className="wallet-detail-label">Mnemonic:</span>
        <div className="wallet-detail-value-group">
          <span className="wallet-detail-value">{walletData.mnemonic}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopyClick(walletData.mnemonic, 'Mnemonic');
            }}
            className="wallet-action-button small"
            title="Copy to clipboard"
            disabled={walletData.mnemonic === 'N/A'}
          >
            📋
          </button>
        </div>
      </div>

      <div className="wallet-detail-item">
        <span className="wallet-detail-label">Private Key (WIF):</span>
        <div className="wallet-detail-value-group">
          <span className="wallet-detail-value">{walletData.privateKeyWIF}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopyClick(walletData.privateKeyWIF, 'Private Key');
            }}
            className="wallet-action-button small"
            title="Copy to clipboard"
            disabled={walletData.privateKeyWIF === 'N/A'}
          >
            📋
          </button>
        </div>
      </div>

      <div className="wallet-detail-item">
        <span className="wallet-detail-label">HD Path:</span>
        <div className="wallet-detail-value-group">
          <span className="wallet-detail-value">{walletData.hdPath}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopyClick(walletData.hdPath, 'HD Path');
            }}
            className="wallet-action-button small"
            title="Copy to clipboard"
            disabled={walletData.hdPath === 'N/A'}
          >
            📋
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletDetails;
