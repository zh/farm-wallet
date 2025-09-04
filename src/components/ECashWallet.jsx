import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom, savedMnemonicAtom, mnemonicSetterAtom, mnemonicCollapsedAtom } from '../atoms';
import { validateMnemonic, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { useConnectWallet } from '../hooks';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/ecashwallet.css';

const ECashWallet = () => {
  const { t } = useTranslation();
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [savedMnemonic] = useAtom(savedMnemonicAtom);
  const [, setSavedMnemonic] = useAtom(mnemonicSetterAtom);
  const [mnemonicCollapsed, setMnemonicCollapsed] = useAtom(mnemonicCollapsedAtom);

  const { importWallet, clearWalletData } = useConnectWallet();

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editableMnemonic, setEditableMnemonic] = useState('');

  const generateNewMnemonic = () => {
    try {
      const newMnemonic = generateMnemonic(wordlist);
      setEditableMnemonic(newMnemonic);
      setSuccessMessage('');
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to generate mnemonic:', error);
      setSuccessMessage('');
      setErrorMessage('Failed to generate mnemonic. Please try again.');
    }
  };

  const handleConnectFromSaved = async () => {
    try {
      const mnemonicToUse = editableMnemonic || savedMnemonic;
      if (!mnemonicToUse.trim()) {
        setSuccessMessage('');
        setErrorMessage('No mnemonic available to connect.');
        return;
      }

      if (!validateMnemonic(mnemonicToUse.trim(), wordlist)) {
        setSuccessMessage('');
        setErrorMessage('Invalid mnemonic. Please check your input.');
        return;
      }

      setSuccessMessage('');
      setErrorMessage('');
      await importWallet(mnemonicToUse);
      setEditableMnemonic('');
    } catch (error) {
      console.error('Failed to connect from saved mnemonic:', error);
      setSuccessMessage('');
      setErrorMessage(error.message);
    }
  };

  const handleSaveMnemonic = () => {
    if (!editableMnemonic.trim()) {
      setSuccessMessage('');
      setErrorMessage('Mnemonic cannot be empty.');
      return;
    }

    if (!validateMnemonic(editableMnemonic.trim(), wordlist)) {
      setSuccessMessage('');
      setErrorMessage('Invalid mnemonic. Please check your input.');
      return;
    }

    setSavedMnemonic(editableMnemonic.trim());
    setErrorMessage('');
    setSuccessMessage('Mnemonic saved successfully to local storage!');

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleResetMnemonic = () => {
    if (window.confirm(t('wallet.resetConfirm'))) {
      clearWalletData();
      setEditableMnemonic('');
      setSuccessMessage('');
      setErrorMessage('');
      setMnemonicCollapsed(false);
    }
  };

  const toggleMnemonicCollapsed = () => {
    setMnemonicCollapsed(!mnemonicCollapsed);
  };

  // Initialize editable mnemonic from saved mnemonic when component mounts
  useEffect(() => {
    if (savedMnemonic && !editableMnemonic) {
      setEditableMnemonic(savedMnemonic);
    }
    // Always expand mnemonic section when mnemonic is empty (first access)
    if (!editableMnemonic && !savedMnemonic) {
      setMnemonicCollapsed(false);
    }
  }, [savedMnemonic, editableMnemonic, setMnemonicCollapsed]);

  if (walletConnected) {
    return null; // Wallet is connected, let MobileLayout handle the UI
  }

  return (
    <div className="ecash-wallet">

      <div className="mnemonic-section">
        <div
          className="mnemonic-header"
          onClick={toggleMnemonicCollapsed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMnemonicCollapsed();
            }
          }}
          tabIndex={0}
          role="button"
          aria-expanded={!mnemonicCollapsed}
          aria-controls="mnemonic-textarea"
        >
          <span className={`triangle ${mnemonicCollapsed ? 'collapsed' : 'expanded'}`}>
            ▼
          </span>
          <span className="mnemonic-title">
            {t('fund.mnemonic')} <span className="mnemonic-subtitle">(12 words)</span>
          </span>
        </div>

        {!mnemonicCollapsed && (
          <textarea
            id="mnemonic-textarea"
            value={editableMnemonic}
            onChange={(e) => setEditableMnemonic(e.target.value)}
            placeholder={editableMnemonic.trim()
              ? "Your 12-word mnemonic phrase"
              : "Your generated mnemonic will appear here"}
            rows="3"
            className="mnemonic-input"
          />
        )}

        <div className="mnemonic-buttons">
          {!editableMnemonic.trim() ? (
            <button onClick={generateNewMnemonic} className="generate-btn">
              {t('common.generate')}
            </button>
          ) : (
            <>
              <button onClick={handleConnectFromSaved}>
                {t('common.connect')}
              </button>
              <button onClick={handleSaveMnemonic}>
                {t('common.save')}
              </button>
              <button onClick={handleResetMnemonic}>
                {t('common.reset')}
              </button>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="connection-success">
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="connection-error">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ECashWallet;
