// src/utils/errorHandler.js

/**
 * Comprehensive error handling and sanitization utilities for eCash wallet
 * Prevents sensitive information leakage and provides user-friendly messages
 */

/**
 * Sanitize error messages to remove sensitive information
 * @param {Error|string} error - Error to sanitize
 * @param {string} context - Context where error occurred
 * @returns {Object} Sanitized error object
 */
export const handleError = (error, context = '') => {
  const originalMessage = error?.message || error?.toString() || 'An error occurred';

  // Remove sensitive patterns
  let sanitizedMessage = originalMessage
    // Remove private keys (WIF format: L/K followed by 51 chars)
    .replace(/[LK][1-9A-HJ-NP-Za-km-z]{51}/g, '[PRIVATE_KEY_REMOVED]')
    // Remove potential mnemonics (12+ words)
    .replace(/\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/gi, '[MNEMONIC_REMOVED]')
    // Remove eCash addresses
    .replace(/ecash:[a-z0-9]{42,62}/gi, '[ECASH_ADDRESS_REMOVED]')
    .replace(/etoken:[a-z0-9]{42,62}/gi, '[ETOKEN_ADDRESS_REMOVED]')
    // Remove potential API keys/tokens (base64-like strings 32+ chars)
    .replace(/[A-Za-z0-9+/=]{32,}/g, '[TOKEN_REMOVED]')
    // Remove file paths
    // eslint-disable-next-line no-useless-escape
    .replace(/[A-Za-z]:[\\\/][^\s]*|\/[^\s]*/g, '[PATH_REMOVED]')
    // Remove URLs with sensitive info
    .replace(/https?:\/\/[^\s]*[?&](key|token|auth)=[^\s&]*/gi, '[URL_WITH_AUTH_REMOVED]');

  // Categorize errors for better user experience
  const errorCategories = {
    network: [
      'network error', 'connection failed', 'timeout', 'fetch failed',
      'cors', 'net::', 'enotfound', 'econnrefused', 'chronik', 'broadcast'
    ],
    wallet: [
      'insufficient funds', 'invalid mnemonic', 'wallet not initialized',
      'private key', 'derivation', 'signing failed', 'xec balance',
      'missing inputs', 'inputs-missingorspent'
    ],
    mempool: [
      'txn-mempool-conflict', 'mempool conflict', 'utxo conflict',
      'transaction rejected by mempool', 'already spent'
    ],
    validation: [
      'invalid address', 'invalid amount', 'validation failed',
      'invalid format', 'invalid token', 'ecash address', 'dust'
    ],
    api: [
      'api error', '401', '403', '429', '500', '502', '503', '504',
      'rate limit', 'unauthorized', 'forbidden', 'bad request'
    ]
  };

  let category = 'unknown';
  let userFriendlyMessage = 'An unexpected error occurred. Please try again.';

  const lowerMessage = sanitizedMessage.toLowerCase();

  // Determine error category and provide user-friendly message
  for (const [cat, keywords] of Object.entries(errorCategories)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      category = cat;
      break;
    }
  }

  // Generate user-friendly messages based on category
  switch (category) {
    case 'network':
      if (lowerMessage.includes('chronik')) {
        userFriendlyMessage = 'eCash network connection error. Please check your internet connection and try again.';
      } else {
        userFriendlyMessage = 'Network connection error. Please check your internet connection and try again.';
      }
      break;
    case 'wallet':
      if (lowerMessage.includes('insufficient')) {
        userFriendlyMessage = 'Insufficient XEC balance for this transaction.';
      } else if (lowerMessage.includes('mnemonic')) {
        userFriendlyMessage = 'Invalid recovery phrase. Please check and try again.';
      } else if (lowerMessage.includes('not initialized')) {
        userFriendlyMessage = 'Wallet not properly initialized. Please reconnect your wallet.';
      } else if (lowerMessage.includes('missing inputs') || lowerMessage.includes('inputs-missingorspent')) {
        userFriendlyMessage = 'Transaction failed due to outdated UTXOs. The wallet will automatically refresh and you can try again.';
      } else {
        userFriendlyMessage = 'Wallet operation failed. Please try again.';
      }
      break;
    case 'mempool':
      if (lowerMessage.includes('txn-mempool-conflict') || lowerMessage.includes('mempool conflict')) {
        userFriendlyMessage = 'Transaction conflict detected. UTXOs have been refreshed - please wait a few seconds and try again.';
      } else if (lowerMessage.includes('already spent')) {
        userFriendlyMessage = 'UTXOs already spent by another transaction. Wallet data refreshed - please try again.';
      } else {
        userFriendlyMessage = 'Transaction rejected by network. Please wait a moment and try again.';
      }
      break;
    case 'validation':
      if (lowerMessage.includes('address')) {
        userFriendlyMessage = 'Invalid eCash address format. Please verify the address.';
      } else if (lowerMessage.includes('amount')) {
        userFriendlyMessage = 'Invalid amount. Please enter a valid number.';
      } else {
        userFriendlyMessage = 'Input validation failed. Please check your entries.';
      }
      break;
    case 'api':
      if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
        userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
        userFriendlyMessage = 'Authentication failed. Please reconnect your wallet.';
      } else if (lowerMessage.includes('503') || lowerMessage.includes('502')) {
        userFriendlyMessage = 'Service temporarily unavailable. Please try again later.';
      } else {
        userFriendlyMessage = 'Server error. Please try again later.';
      }
      break;
  }

  return {
    category,
    message: userFriendlyMessage,
    originalMessage: sanitizedMessage,
    context: context || 'Unknown',
    timestamp: new Date().toISOString()
  };
};

/**
 * Validate input and throw user-friendly error if validation fails
 * @param {any} value - Value to validate
 * @param {string} errorMessage - Error message for validation failure
 * @param {Function} validator - Validation function (optional)
 */
export const validateOrThrow = (value, errorMessage, validator = (v) => !!v?.toString().trim()) => {
  if (!validator(value)) {
    const error = new Error(errorMessage);
    error.category = 'validation';
    throw error;
  }
};

/**
 * Safe async operation wrapper with error handling
 * @param {Function} operation - Async operation to execute
 * @param {string} context - Context for error reporting
 * @param {Function} fallback - Fallback function on error (optional)
 * @returns {Promise} Operation result or handled error
 */
export const safeAsyncOperation = async (operation, context = '', fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    const handledError = handleError(error, context);

    if (fallback && typeof fallback === 'function') {
      try {
        return await fallback(handledError);
      } catch (fallbackError) {
        throw handleError(fallbackError, `${context}_fallback`);
      }
    }

    throw handledError;
  }
};

/**
 * Log error securely (removes sensitive information)
 * @param {Error|string} error - Error to log
 * @param {string} context - Context where error occurred
 * @param {string} level - Log level ('error', 'warn', 'info')
 */
export const secureLog = (error, context = '', level = 'error') => {
  const handledError = handleError(error, context);

  // Only log in development or when explicitly enabled
  if (import.meta?.env?.DEV || globalThis?.DEBUG_LOGGING) {
    console[level](`[${context}] ${handledError.category}:`, {
      message: handledError.message,
      sanitized: handledError.originalMessage,
      timestamp: handledError.timestamp
    });
  }
};

/**
 * Create a retry wrapper for operations that might fail temporarily
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Operation result
 */
export const withRetry = async (operation, options = {}) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    context = 'operation'
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry on certain error types
      const handledError = handleError(error, context);
      if (['validation', 'wallet'].includes(handledError.category)) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, delay * Math.pow(backoff, attempt - 1))
      );
    }
  }

  throw handleError(lastError, `${context}_retry_failed`);
};

/**
 * Error boundary helper for React components
 * @param {Error} error - Error that occurred
 * @param {Object} errorInfo - Additional error information
 * @returns {Object} Error state for component
 */
export const handleComponentError = (error, errorInfo = {}) => {
  const handledError = handleError(error, 'component_error');

  secureLog(error, 'ComponentErrorBoundary', 'error');

  return {
    hasError: true,
    error: handledError,
    errorInfo,
    retry: () => window.location.reload()
  };
};

export default {
  handleError,
  validateOrThrow,
  safeAsyncOperation,
  secureLog,
  withRetry,
  handleComponentError
};
