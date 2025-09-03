import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom,
  balanceAtom,
  totalBalanceAtom,
  balanceBreakdownAtom,
  balanceRefreshTriggerAtom,
  tokenRefreshTriggerAtom,
} from '../atoms';

const useBalance = (refreshInterval = 10000) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [balance, setBalance] = useAtom(balanceAtom);
  const [totalBalance, setTotalBalance] = useAtom(totalBalanceAtom);
  const [balanceBreakdown, setBalanceBreakdown] = useAtom(balanceBreakdownAtom);
  const [triggerRefresh] = useAtom(balanceRefreshTriggerAtom);
  const [, setTokenRefreshTrigger] = useAtom(tokenRefreshTriggerAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize fetchBalance to avoid creating a new function on each render
  const fetchBalance = useCallback(async () => {
    // Always set loading true first, even if we return early
    setLoading(true);
    setError(null);

    if (!wallet || !walletConnected) {
      // Reset all balance atoms if wallet is not available
      setBalance(0);
      setTotalBalance(0);
      setBalanceBreakdown({
        spendableBalance: 0,
        totalBalance: 0,
        tokenDustValue: 0,
        pureXecUtxos: 0,
        tokenUtxos: 0
      });
      setLoading(false);
      return;
    }

    try {
      // Defensive check: ensure wallet is still valid before calling API
      if (!wallet.getDetailedBalance || typeof wallet.getDetailedBalance !== 'function') {
        throw new Error('Wallet getDetailedBalance method not available');
      }

      // Use CLI's working pattern - getDetailedBalance and proper UTXO filtering
      // First ensure wallet UTXOs are fresh
      await wallet.initialize();

      // Get detailed balance like CLI does (this works reliably)
      const balanceData = await wallet.getDetailedBalance();
      let spendableBalance = balanceData.total; // Start with total balance

      // Calculate both spendable and total balances with detailed breakdown
      if (wallet.utxos && wallet.utxos.utxoStore && wallet.utxos.utxoStore.xecUtxos) {
        const utxos = wallet.utxos.utxoStore.xecUtxos;
        let pureXecTotal = 0;
        let totalUtxoValue = 0;
        let tokenDustValue = 0;
        let pureXecCount = 0;
        let tokenUtxoCount = 0;

        // Process each UTXO to separate spendable XEC from token dust
        for (const utxo of utxos) {
          // Get XEC amount using CLI's method - prefer sats property
          let xecAmount = 0;
          if (utxo.sats !== undefined) {
            const satoshis = parseInt(utxo.sats) || 0;
            xecAmount = satoshis / 100; // Convert from satoshis to XEC
          } else if (utxo.value) {
            const satoshis = parseInt(utxo.value) || 0;
            xecAmount = satoshis / 100; // Convert from satoshis to XEC
          }

          // Add to total balance (includes all UTXOs)
          totalUtxoValue += xecAmount;

          // Separate pure XEC from token dust
          if (utxo.token && utxo.token.tokenId) {
            // This UTXO is locked with tokens (eToken dust)
            tokenDustValue += xecAmount;
            tokenUtxoCount++;
          } else {
            // This is pure XEC UTXO (spendable)
            pureXecTotal += xecAmount;
            pureXecCount++;
          }
        }

        // Use the calculated values
        spendableBalance = pureXecTotal;
        const totalBalance = totalUtxoValue;

        // Update balance breakdown atom
        setBalanceBreakdown({
          spendableBalance,
          totalBalance,
          tokenDustValue,
          pureXecUtxos: pureXecCount,
          tokenUtxos: tokenUtxoCount
        });

        // Update total balance atom
        setTotalBalance(totalBalance);
      }

      const xecBalance = spendableBalance;

      // Defensive check: ensure wallet is still connected after API call
      if (!wallet || !walletConnected) {
        console.warn('Wallet became disconnected during balance fetch');
        return;
      }

      setBalance(xecBalance || 0); // Update atom with XEC balance

      // Trigger token refresh after balance/UTXO update
      setTokenRefreshTrigger(Date.now());

      // Add minimum loading time to make it visible
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Failed to fetch XEC balance:', error);
      setError(error.message);

      // Reset all balance atoms in case of an error
      setBalance(0);
      setTotalBalance(0);
      setBalanceBreakdown({
        spendableBalance: 0,
        totalBalance: 0,
        tokenDustValue: 0,
        pureXecUtxos: 0,
        tokenUtxos: 0
      });

      // Don't disconnect wallet on balance fetch errors - just log and continue
    } finally {
      setLoading(false);
    }
  }, [wallet, walletConnected, setBalance, setTotalBalance, setBalanceBreakdown, setTokenRefreshTrigger]);

  useEffect(() => {
    if (walletConnected) {
      fetchBalance(); // Fetch balance when wallet connects
      const interval = setInterval(fetchBalance, refreshInterval); // Refresh every 10 seconds
      return () => clearInterval(interval); // Cleanup interval on unmount or disconnect
    }
  }, [walletConnected, fetchBalance, refreshInterval]);

  // Separate effect for manual refresh trigger
  useEffect(() => {
    if (walletConnected && triggerRefresh > 0) {
      fetchBalance(); // Only call fetchBalance, don't set up new interval
    }
  }, [triggerRefresh, walletConnected, fetchBalance]);

  return {
    balance,
    totalBalance,
    balanceBreakdown,
    loading,
    error,
    refreshBalance: fetchBalance
  };
};

export default useBalance;
