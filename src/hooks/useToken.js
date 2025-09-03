import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom,
  tokenAtom,
  tokenIdAtom,
  tokenRefreshTriggerAtom
} from '../atoms';
import { useTranslation } from './useTranslation';

export const useToken = () => {
  const { t } = useTranslation();
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [tokenId] = useAtom(tokenIdAtom);
  const [refreshTrigger] = useAtom(tokenRefreshTriggerAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!walletConnected || !wallet || !tokenId) {
      setToken(null);
      return;
    }

    const fetchToken = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ensure wallet UTXOs are fresh before listing tokens
        await wallet.initialize();

        // Get all tokens and find our specific one
        const tokens = await wallet.listETokens();
        const targetToken = tokens.find(t => t.tokenId === tokenId);

        if (targetToken) {
          setToken(targetToken);
        } else {
          // Token not found in wallet - set empty token with basic info
          setToken({
            tokenId,
            name: t('token.unknownToken'),
            symbol: t('token.defaultSymbol'),
            balance: 0,
            decimals: 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch token:', err);
        setError(err.message || 'Failed to load token data');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [walletConnected, wallet, tokenId, refreshTrigger, setToken, t]);

  return {
    token,
    loading,
    error,
    tokenId
  };
};
