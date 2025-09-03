import { useState, useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom,
  eTokensAtom,
  notificationAtom,
  busyAtom,
  balanceRefreshTriggerAtom
} from '../atoms';
import { handleError, safeAsyncOperation } from '../utils/errorHandler';

const useTokens = (autoRefresh = true, refreshInterval = 30000) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [eTokens, setETokens] = useAtom(eTokensAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [, setBusy] = useAtom(busyAtom);
  const setBalanceRefreshTrigger = useSetAtom(balanceRefreshTriggerAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(0);

  // Token metadata cache
  const [tokenCache, setTokenCache] = useState(new Map());

  // Format token balance with proper decimal handling
  const formatTokenBalance = useCallback((balance, decimals = 0) => {
    if (!balance || balance === 0) return '0';

    const divisor = Math.pow(10, decimals);
    const formatted = (balance / divisor).toFixed(Math.min(decimals, 8));

    // Remove trailing zeros
    return formatted.replace(/\.?0+$/, '');
  }, []);

  // Get token from cache or fetch from wallet
  const getTokenData = useCallback(async (tokenId) => {
    if (!wallet || !walletConnected) {
      throw new Error('Wallet not connected');
    }

    // Check cache first
    if (tokenCache.has(tokenId)) {
      const cached = tokenCache.get(tokenId);
      // Cache for 10 minutes
      if (Date.now() - cached.timestamp < 600000) {
        return cached.data;
      }
    }

    try {
      // Try multiple methods to get token metadata (CLI pattern)
      let tokenData = null;

      try {
        // Method 1: Try wallet.getETokenData (most reliable for metadata)
        tokenData = await wallet.getETokenData(tokenId);
      } catch (err) {
        console.warn(`getETokenData failed for ${tokenId}, trying fallback:`, err.message);

        // Method 2: Try hybridTokens.getTokenData as fallback
        try {
          const hybridData = await wallet.hybridTokens.getTokenData(tokenId);
          if (hybridData && hybridData.genesisData) {
            tokenData = {
              ticker: hybridData.genesisData.ticker,
              symbol: hybridData.genesisData.ticker,
              name: hybridData.genesisData.name,
              decimals: hybridData.genesisData.decimals,
              totalSupply: hybridData.genesisData.totalSupply,
              documentUri: hybridData.genesisData.documentUri,
              protocol: hybridData.protocol || 'SLP'
            };
          }
        } catch (err2) {
          console.warn(`hybridTokens.getTokenData also failed for ${tokenId}:`, err2.message);
          throw new Error(`Both token data methods failed: ${err.message}`);
        }
      }

      if (!tokenData) {
        throw new Error('No token data retrieved');
      }

      // Cache the result
      setTokenCache(prev => new Map(prev.set(tokenId, {
        data: tokenData,
        timestamp: Date.now()
      })));

      return tokenData;
    } catch (error) {
      console.warn(`Failed to get token data for ${tokenId}:`, error.message);
      throw error;
    }
  }, [wallet, walletConnected, tokenCache]);

  // Get token balance by scanning UTXOs
  const getTokenBalance = useCallback(async (tokenId) => {
    if (!wallet || !walletConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Ensure wallet is initialized
      if (!wallet.isInitialized) {
        await wallet.initialize();
      }

      let totalBalance = 0;

      if (wallet.utxos && wallet.utxos.utxoStore && wallet.utxos.utxoStore.xecUtxos) {
        for (const utxo of wallet.utxos.utxoStore.xecUtxos) {
          if (utxo.token && utxo.token.tokenId === tokenId && !utxo.token.isMintBaton) {
            const atoms = utxo.token.atoms || 0;
            let balance = 0;
            if (typeof atoms === 'bigint') {
              balance = Number(atoms);
            } else if (typeof atoms === 'string') {
              balance = parseFloat(atoms);
            } else {
              balance = parseFloat(atoms) || 0;
            }
            totalBalance += balance;
          }
        }
      }

      return totalBalance;
    } catch (error) {
      console.warn(`Failed to get balance for token ${tokenId}:`, error.message);
      throw error;
    }
  }, [wallet, walletConnected]);

  // Fetch all tokens from wallet
  const fetchTokens = useCallback(async (showNotification = false) => {
    if (!wallet || !walletConnected) {
      setETokens([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const tokens = await safeAsyncOperation(
        async () => {
          // Wait for wallet initialization if needed
          if (!wallet.isInitialized) {
            await wallet.initialize();
          }

          // Use the official listETokens API
          const tokenList = await wallet.listETokens();

          return tokenList;
        },
        'fetch_tokens'
      );

      // Process tokens from listETokens() - they already have all metadata
      const enhancedTokens = tokens.map((token) => {
        return {
          id: token.tokenId,
          tokenId: token.tokenId,
          balance: typeof token.balance === 'object' ?
            (typeof token.balance.atoms === 'string' ?
              parseInt(token.balance.atoms) :
              token.balance.atoms) :
            token.balance,
          name: token.name || `Token ${token.tokenId.slice(0, 8).toUpperCase()}`,
          symbol: token.ticker || token.tokenId.slice(0, 8).toUpperCase(),
          decimals: token.decimals || 0,
          totalSupply: null, // Not provided by listETokens
          documentUri: token.url || null,
          type: token.protocol || 'SLP',
          protocol: token.protocol || 'SLP',
          utxoCount: token.utxoCount || 0,
          displayBalance: token.balance?.display || 0
        };
      });

      setETokens(enhancedTokens);
      setLastRefresh(Date.now());

      if (showNotification) {
        setNotification({
          type: 'success',
          message: `Found ${enhancedTokens.length} tokens`
        });
      }

      return enhancedTokens;

    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      const handledError = handleError(error, 'fetch_tokens');
      setError(handledError.message);

      if (showNotification) {
        setNotification({ type: 'error', message: handledError.message });
      }

      setETokens([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [wallet, walletConnected, setETokens, setNotification]);

  // Send tokens
  const sendTokens = useCallback(async (tokenId, outputs, satsPerByte) => {
    if (!wallet || !walletConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setBusy(true);

      const result = await safeAsyncOperation(
        async () => {
          // Ensure wallet is initialized
          if (!wallet.isInitialized) {
            await wallet.initialize();
          }

          const txid = await wallet.sendETokens(tokenId, outputs, satsPerByte);
          return txid;
        },
        'send_tokens'
      );

      // Refresh token balances after successful send
      setTimeout(() => {
        fetchTokens();
        setBalanceRefreshTrigger(Date.now());
      }, 2000);

      return result;

    } catch (error) {
      console.error('Token send failed:', error);
      throw error;
    } finally {
      setBusy(false);
    }
  }, [wallet, walletConnected, setBusy, fetchTokens, setBalanceRefreshTrigger]);

  // Burn tokens
  const burnTokens = useCallback(async (tokenId, amount, satsPerByte) => {
    if (!wallet || !walletConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setBusy(true);

      const result = await safeAsyncOperation(
        async () => {
          // Ensure wallet is initialized
          if (!wallet.isInitialized) {
            await wallet.initialize();
          }

          const txid = await wallet.burnETokens(tokenId, amount, satsPerByte);
          return txid;
        },
        'burn_tokens'
      );

      // Refresh token balances after successful burn
      setTimeout(() => {
        fetchTokens();
        setBalanceRefreshTrigger(Date.now());
      }, 2000);

      return result;

    } catch (error) {
      console.error('Token burn failed:', error);
      throw error;
    } finally {
      setBusy(false);
    }
  }, [wallet, walletConnected, setBusy, fetchTokens, setBalanceRefreshTrigger]);

  // Burn all tokens
  const burnAllTokens = useCallback(async (tokenId, satsPerByte) => {
    if (!wallet || !walletConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setBusy(true);

      const result = await safeAsyncOperation(
        async () => {
          // Ensure wallet is initialized
          if (!wallet.isInitialized) {
            await wallet.initialize();
          }

          const txid = await wallet.burnAllETokens(tokenId, satsPerByte);
          return txid;
        },
        'burn_all_tokens'
      );

      // Refresh token balances after successful burn
      setTimeout(() => {
        fetchTokens();
        setBalanceRefreshTrigger(Date.now());
      }, 2000);

      return result;

    } catch (error) {
      console.error('Burn all tokens failed:', error);
      throw error;
    } finally {
      setBusy(false);
    }
  }, [wallet, walletConnected, setBusy, fetchTokens, setBalanceRefreshTrigger]);

  // Find token by ID
  const findToken = useCallback((tokenId) => {
    return eTokens.find(token => token.tokenId === tokenId) || null;
  }, [eTokens]);

  // Get tokens by type
  const getTokensByType = useCallback((type) => {
    return eTokens.filter(token => token.type === type);
  }, [eTokens]);

  // Manual refresh
  const refreshTokens = useCallback(async () => {
    return await fetchTokens(true);
  }, [fetchTokens]);

  // Clear cache
  const clearCache = useCallback(() => {
    setTokenCache(new Map());
  }, []);

  // Auto-fetch tokens when wallet connects
  useEffect(() => {
    if (walletConnected && autoRefresh) {
      fetchTokens();
    } else if (!walletConnected) {
      setETokens([]);
      setError(null);
      clearCache();
    }
  }, [walletConnected, autoRefresh, fetchTokens, setETokens, clearCache]);

  // Auto-refresh tokens periodically
  useEffect(() => {
    if (!walletConnected || !autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading and last refresh was more than refreshInterval ago
      if (!loading && Date.now() - lastRefresh > refreshInterval) {
        fetchTokens();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [walletConnected, autoRefresh, refreshInterval, loading, lastRefresh, fetchTokens]);

  return {
    // State
    tokens: eTokens,
    loading,
    error,
    lastRefresh,

    // Actions
    fetchTokens: refreshTokens,
    sendTokens,
    burnTokens,
    burnAllTokens,

    // Queries
    findToken,
    getTokensByType,
    getTokenData,
    getTokenBalance,

    // Utilities
    formatTokenBalance,
    clearCache,

    // Computed
    hasTokens: eTokens.length > 0,
    tokenCount: eTokens.length,
    slpTokens: getTokensByType('SLP'),
    alpTokens: getTokensByType('ALP'),
    unknownTokens: getTokensByType('Unknown')
  };
};

export default useTokens;