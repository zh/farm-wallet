// Basic mnemonic storage utilities

const STORAGE_KEY = 'farm-wallet-mnemonic';

export const saveMnemonic = (mnemonic) => {
  if (typeof window === 'undefined') return;

  if (!mnemonic || !mnemonic.trim()) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, mnemonic.trim());
  } catch (error) {
    console.error('Failed to save mnemonic:', error);
  }
};

export const loadMnemonic = () => {
  if (typeof window === 'undefined') return '';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return '';

    return stored;
  } catch (error) {
    console.error('Failed to load mnemonic:', error);
    return '';
  }
};

export const clearMnemonic = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export const hasSavedMnemonic = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEY);
};
