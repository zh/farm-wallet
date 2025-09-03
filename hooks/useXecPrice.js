import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { walletAtom, priceAtom } from '../atoms';

const useXecPrice = (refreshInterval = 300000) => { // 5 minutes default
  const [wallet] = useAtom(walletAtom);
  const [price, setPrice] = useAtom(priceAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch XEC price using wallet's built-in method with API fallback
  const fetchPrice = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let xecUsdPrice = 0;

      // Try wallet's getXecUsd method first (from minimal-xec-wallet)
      if (wallet && typeof wallet.getXecUsd === 'function') {
        try {
          xecUsdPrice = await wallet.getXecUsd();
        } catch (walletError) {
          console.warn('Wallet price method failed, trying external API:', walletError.message);

          // Fallback to CoinGecko API if wallet method fails
          try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd', {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              xecUsdPrice = data?.ecash?.usd || 0;
            }
          } catch (apiError) {
            console.warn('CoinGecko API also failed:', apiError.message);
          }
        }
      } else {
        // Wallet not available or doesn't have getXecUsd method, use API directly
        try {
          const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            xecUsdPrice = data?.ecash?.usd || 0;
          }
        } catch (apiError) {
          console.warn('CoinGecko API failed:', apiError.message);
        }
      }

      setPrice(xecUsdPrice || 0);
    } catch (error) {
      console.error('Failed to fetch XEC price:', error);
      setError(error.message);
      setPrice(0); // Reset to 0 on error
    } finally {
      setLoading(false);
    }
  }, [wallet, setPrice]);

  useEffect(() => {
    // Always fetch price, regardless of wallet connection status
    fetchPrice();

    // Set up interval for periodic price updates
    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval]);

  // Manual refresh function
  const refreshPrice = useCallback(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    loading,
    error,
    refreshPrice
  };
};

export default useXecPrice;