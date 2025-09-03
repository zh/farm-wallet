// DEPRECATED: This hook is deprecated and maintained only for backward compatibility
// The main app should use useConnectWallet instead, which properly manages MinimalXecWallet instances
// This hook previously managed Chronik client connections, but minimal-xec-wallet handles this internally

import { useAtom } from 'jotai';
import { walletAtom } from '../atoms';

// Simplified useWallet hook - just returns the current wallet from the atom
// The actual wallet connection is handled by useConnectWallet
const useWallet = () => {
  const [wallet] = useAtom(walletAtom);

  return { wallet };
};

export default useWallet;
