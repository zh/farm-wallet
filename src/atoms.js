import { atom } from 'jotai';
import { loadMnemonic, saveMnemonic } from './utils/mnemonicStorage';

// Language/Locale atom with localStorage persistence
const getInitialLocale = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('farm-wallet-language');
    return saved || 'en';
  }
  return 'en';
};

const _localeAtom = atom(getInitialLocale());

export const localeAtom = atom(
  (get) => get(_localeAtom),
  (get, set, newLocale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('farm-wallet-language', newLocale);
    }
    set(_localeAtom, newLocale);
  }
);
localeAtom.debugLabel = 'localeAtom';

// Token ID atom - gets from environment variable
export const tokenIdAtom = atom(() => {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_TOKEN_ID || '';
  }
  return '';
});
tokenIdAtom.debugLabel = 'tokenIdAtom';

// Fixed HD derivation path - always Cashtab type (1899)
export const hdPathAtom = atom("m/44'/1899'/0'/0/0");
hdPathAtom.debugLabel = 'hdPathAtom';

// XEC wallet options - simplified, no analytics
export const optionsAtom = atom((get) => {
  const hdPath = get(hdPathAtom);

  return {
    hdPath,
    // minimal-xec-wallet handles Chronik connection internally
    noUpdate: true,
  };
});
optionsAtom.debugLabel = 'optionsAtom';

// Wallet connection and instance atoms
export const walletConnectedAtom = atom(false);
walletConnectedAtom.debugLabel = 'walletConnectedAtom';

export const walletAtom = atom(null);
walletAtom.debugLabel = 'walletAtom';

// Single token state (instead of eTokens array)
export const tokenAtom = atom(null);
tokenAtom.debugLabel = 'tokenAtom';

// XEC price in USD
export const priceAtom = atom(0);
priceAtom.debugLabel = 'priceAtom';

// XEC balance (in XEC units - from wallet.getXecBalance())
export const balanceAtom = atom(0);
balanceAtom.debugLabel = 'balanceAtom';

// Total balance (all UTXOs including token dust)
export const totalBalanceAtom = atom(0);
totalBalanceAtom.debugLabel = 'totalBalanceAtom';

// Balance breakdown for detailed display
export const balanceBreakdownAtom = atom({
  spendableBalance: 0,
  totalBalance: 0,
  tokenDustValue: 0,
  pureXecUtxos: 0,
  tokenUtxos: 0
});
balanceBreakdownAtom.debugLabel = 'balanceBreakdownAtom';

// Refresh trigger atoms
export const balanceRefreshTriggerAtom = atom(0);
balanceRefreshTriggerAtom.debugLabel = 'balanceRefreshTriggerAtom';

export const tokenRefreshTriggerAtom = atom(0);
tokenRefreshTriggerAtom.debugLabel = 'tokenRefreshTriggerAtom';

// UI state atoms
export const busyAtom = atom(false);
busyAtom.debugLabel = 'busyAtom';

export const notificationAtom = atom(null);
notificationAtom.debugLabel = 'notificationAtom';

// Script loading state atoms
export const scriptLoadedAtom = atom(false);
scriptLoadedAtom.debugLabel = 'scriptLoadedAtom';

export const scriptErrorAtom = atom(null);
scriptErrorAtom.debugLabel = 'scriptErrorAtom';


// Theme management atom with localStorage persistence
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('farm-wallet-theme');
    return savedTheme || 'light'; // Default to light theme
  }
  return 'light';
};

export const themeAtom = atom(getInitialTheme());
themeAtom.debugLabel = 'themeAtom';

// Theme setter atom that also persists to localStorage
export const themeSetterAtom = atom(null, (get, set, newTheme) => {
  set(themeAtom, newTheme);
  if (typeof window !== 'undefined') {
    localStorage.setItem('farm-wallet-theme', newTheme);
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', newTheme);
  }
});
themeSetterAtom.debugLabel = 'themeSetterAtom';

// Mnemonic UI state management with localStorage persistence
const getInitialMnemonicCollapsed = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('farm-wallet-mnemonic-collapsed');
    return saved === 'true'; // Convert string to boolean, default false (expanded)
  }
  return false;
};

const _mnemonicCollapsedAtom = atom(getInitialMnemonicCollapsed());

export const mnemonicCollapsedAtom = atom(
  (get) => get(_mnemonicCollapsedAtom),
  (get, set, collapsed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('farm-wallet-mnemonic-collapsed', collapsed.toString());
    }
    set(_mnemonicCollapsedAtom, collapsed);
  }
);
mnemonicCollapsedAtom.debugLabel = 'mnemonicCollapsedAtom';

// Simplified coin selection strategy - always 'efficient'
export const coinSelectionStrategyAtom = atom('efficient');
coinSelectionStrategyAtom.debugLabel = 'coinSelectionStrategyAtom';

// Saved mnemonic atom with localStorage persistence for wallet restoration
const getInitialMnemonic = () => {
  return loadMnemonic();
};

export const savedMnemonicAtom = atom(getInitialMnemonic());
savedMnemonicAtom.debugLabel = 'savedMnemonicAtom';

// Mnemonic setter atom that also persists to localStorage
export const mnemonicSetterAtom = atom(null, (get, set, newMnemonic) => {
  set(savedMnemonicAtom, newMnemonic);
  saveMnemonic(newMnemonic);
});
mnemonicSetterAtom.debugLabel = 'mnemonicSetterAtom';