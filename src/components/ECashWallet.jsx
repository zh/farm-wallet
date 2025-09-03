import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom, savedMnemonicAtom, mnemonicSetterAtom } from '../atoms';
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
    clearWalletData();
    setEditableMnemonic('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Initialize editable mnemonic from saved mnemonic when component mounts
  useEffect(() => {
    if (savedMnemonic && !editableMnemonic) {
      setEditableMnemonic(savedMnemonic);
    }
  }, [savedMnemonic, editableMnemonic]);

  if (walletConnected) {
    return null; // Wallet is connected, let MobileLayout handle the UI
  }

  return (
    <div className="ecash-wallet">

      <div className="mnemonic-section">
        <label htmlFor="mnemonic-input">
          {t('fund.mnemonic')} (12 words):
        </label>
        <textarea
          id="mnemonic-input"
          value={editableMnemonic}
          onChange={(e) => setEditableMnemonic(e.target.value)}
          placeholder={editableMnemonic.trim()
            ? "Your 12-word mnemonic phrase"
            : "Your generated mnemonic will appear here"}
          rows="3"
          className="mnemonic-input"
        />
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
