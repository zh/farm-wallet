// src/utils/wifUtils.js - Robust WIF operations using minimal-xec-wallet

/**
 * WIF operations using the robust minimal-xec-wallet implementation
 * This replaces the custom Base58 and WIF conversion code throughout the app
 */

/**
 * Validate WIF (Wallet Import Format) private key using cryptographic validation
 * @param {string} wif - WIF private key to validate
 * @returns {boolean} True if valid WIF format with correct checksum
 */
export const isValidWIF = (wif) => {
  try {
    if (!wif || typeof wif !== 'string') {
      return false;
    }

    // Use minimal-xec-wallet's robust validation
    const tempWallet = new window.MinimalXecWallet();
    return tempWallet.validateWIF(wif);
  } catch (error) {
    console.warn('WIF validation error:', error.message);
    return false;
  }
};

/**
 * Convert WIF to hex private key using robust conversion
 * @param {string} wif - WIF private key
 * @returns {string|null} Hex private key or null if conversion fails
 */
export const wifToHex = (wif) => {
  try {
    if (!wif || typeof wif !== 'string') {
      return null;
    }

    // Use minimal-xec-wallet's robust WIF to private key conversion
    const tempWallet = new window.MinimalXecWallet();
    const result = tempWallet.keyDerivation._wifToPrivateKey(wif);
    return result.privateKey.toString('hex');
  } catch (error) {
    console.warn('WIF to hex conversion failed:', error.message);
    return null;
  }
};

/**
 * Convert hex private key to WIF format using robust conversion
 * @param {string} hex - Hex private key (64 characters)
 * @param {boolean} compressed - Whether to create compressed WIF (default: true)
 * @param {boolean} testnet - Whether to create testnet WIF (default: false)
 * @returns {string|null} WIF private key or null if conversion fails
 */
export const hexToWIF = (hex, compressed = true, testnet = false) => {
  try {
    if (!hex || typeof hex !== 'string') {
      return null;
    }

    // Validate hex format
    if (hex.length !== 64 || !/^[a-fA-F0-9]+$/.test(hex)) {
      return null;
    }

    // Use minimal-xec-wallet's robust hex to WIF conversion
    const tempWallet = new window.MinimalXecWallet();
    return tempWallet.keyDerivation.exportToWif(hex, compressed, testnet);
  } catch (error) {
    console.warn('Hex to WIF conversion failed:', error.message);
    return null;
  }
};

/**
 * Get detailed information about a WIF key
 * @param {string} wif - WIF private key
 * @returns {object|null} WIF info object or null if invalid
 */
export const getWifInfo = (wif) => {
  try {
    if (!isValidWIF(wif)) {
      return null;
    }

    // Detect network and compression from WIF prefix
    const isTestnet = wif.startsWith('c') || wif.startsWith('9');
    const isCompressed = wif.length === 52 || wif.startsWith('c');

    return {
      network: isTestnet ? 'testnet' : 'mainnet',
      compressed: isCompressed,
      valid: true,
      format: isCompressed ? 'compressed' : 'uncompressed'
    };
  } catch (error) {
    console.warn('WIF info extraction failed:', error.message);
    return null;
  }
};

/**
 * Validate WIF and convert to hex in one operation
 * @param {string} wif - WIF private key
 * @returns {object|null} {hex, wifInfo} or null if invalid
 */
export const validateAndConvert = (wif) => {
  try {
    if (!isValidWIF(wif)) {
      return null;
    }

    const hex = wifToHex(wif);
    const wifInfo = getWifInfo(wif);

    if (!hex || !wifInfo) {
      return null;
    }

    return {
      hex,
      wifInfo
    };
  } catch (error) {
    console.warn('WIF validation and conversion failed:', error.message);
    return null;
  }
};

// Legacy compatibility exports for gradual migration
export const wifOperations = {
  isValidWIF,
  wifToHex,
  hexToWIF,
  getWifInfo,
  validateAndConvert
};

// Direct exports for backward compatibility
export default {
  isValidWIF,
  wifToHex,
  hexToWIF,
  getWifInfo,
  validateAndConvert
};
