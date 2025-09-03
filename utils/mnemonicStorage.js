// Basic mnemonic storage utilities with simple obfuscation
// NOTE: This provides minimal protection - users should still backup mnemonics securely

const STORAGE_KEY = 'ecash-wallet-mnemonic';

// Simple XOR-based obfuscation (not encryption - just basic protection)
const obfuscate = (text) => {
  const key = 'ecash-jotai-wallet-2024';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode the result
};

const deobfuscate = (obfuscatedText) => {
  try {
    const decoded = atob(obfuscatedText); // Base64 decode
    const key = 'ecash-jotai-wallet-2024';
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    console.error('Failed to deobfuscate mnemonic:', error);
    return '';
  }
};

export const saveMnemonic = (mnemonic) => {
  if (typeof window === 'undefined') return;

  if (!mnemonic || !mnemonic.trim()) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    const obfuscated = obfuscate(mnemonic.trim());
    localStorage.setItem(STORAGE_KEY, obfuscated);
  } catch (error) {
    console.error('Failed to save mnemonic:', error);
  }
};

export const loadMnemonic = () => {
  if (typeof window === 'undefined') return '';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return '';

    return deobfuscate(stored);
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