// src/hooks/useConnectWallet.js
import { useAtom } from 'jotai';
import { optionsAtom, walletConnectedAtom, walletAtom, mnemonicSetterAtom } from '../atoms';

const useConnectWallet = () => {
  const [options] = useAtom(optionsAtom);
  const [walletConnected, setWalletConnected] = useAtom(walletConnectedAtom);
  const [, setWallet] = useAtom(walletAtom);
  const [, setSavedMnemonic] = useAtom(mnemonicSetterAtom);

  // Create new wallet (let library generate mnemonic internally)
  const createWallet = async () => {
    try {
      if (!window.MinimalXecWallet) {
        throw new Error('XEC wallet library is not available.');
      }

      const XecLibrary = window.MinimalXecWallet;
      // Pass null as first parameter to let library generate mnemonic
      const xecWallet = new XecLibrary(null, options);

      // Initialize the wallet
      await xecWallet.initialize();

      // Save the generated mnemonic for backup
      const mnemonic = xecWallet.walletInfo?.mnemonic;
      if (mnemonic) {
        setSavedMnemonic(mnemonic);
      }

      setWallet(xecWallet);
      setWalletConnected(true);
    } catch (error) {
      setWallet(null);
      setWalletConnected(false);
      throw new Error(error.message);
    }
  };

  // Import existing wallet from mnemonic
  const importWallet = async (mnemonic) => {
    try {
      if (!mnemonic.trim()) {
        throw new Error('Mnemonic is required to import wallet.');
      }

      if (!window.MinimalXecWallet) {
        throw new Error('XEC wallet library is not available.');
      }

      const XecLibrary = window.MinimalXecWallet;
      const xecWallet = new XecLibrary(mnemonic.trim(), options);

      // Initialize the wallet
      await xecWallet.initialize();

      // Save the imported mnemonic
      setSavedMnemonic(mnemonic.trim());

      setWallet(xecWallet);
      setWalletConnected(true);
    } catch (error) {
      setWallet(null);
      setWalletConnected(false);
      throw new Error(error.message);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setWalletConnected(false);
    // Note: We keep the mnemonic saved for easy reconnection
    // Users can explicitly clear it using the Reset button in the UI
  };

  const clearWalletData = () => {
    setWallet(null);
    setWalletConnected(false);
    setSavedMnemonic(''); // This will clear the localStorage via the utility

    // Clear any other wallet-related localStorage data but preserve user preferences
    const keysToPreserve = ['farm-wallet-language', 'farm-wallet-theme', 'farm-wallet-mnemonic'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('farm-wallet-') && !keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  };

  return {
    createWallet,
    importWallet,
    disconnectWallet,
    clearWalletData,
    walletConnected,
  };
};

export default useConnectWallet;
