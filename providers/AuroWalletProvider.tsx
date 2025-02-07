'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ProviderError } from '@aurowallet/mina-provider'
import { useToast } from '@/components/ui/use-toast'

export interface AuroWalletContextType {
  connected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

declare global {
  interface Window {
    mina?: {
      requestAccounts: () => Promise<string[]>
      getAccounts: () => Promise<string[]>
      on: (event: string, callback: (accounts: string[]) => void) => void
      removeListener: (event: string, callback: (accounts: string[]) => void) => void
    }
  }
}

export const AuroWalletContext = createContext<AuroWalletContextType>({
  connected: false,
  address: null,
  connect: async () => {},
  disconnect: async () => {},
});

export function AuroWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  // Handle account changes
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      setConnected(true);
    } else {
      setAddress(null);
      setConnected(false);
    }
  };

  useEffect(() => {
    // Check if Auro Wallet is installed
    if (typeof window.mina === 'undefined') {
      console.warn('Auro Wallet is not installed');
      return;
    }

    // Check for existing connection
    window.mina.getAccounts().then((accounts) => {
      handleAccountsChanged(accounts);
    }).catch((error: ProviderError) => {
      console.error('Failed to get accounts:', error);
      if (error.code === 1001) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Auro wallet",
          variant: "destructive"
        });
      }
    });

    // Listen for account changes
    window.mina.on('accountsChanged', handleAccountsChanged);

    // Cleanup listener on unmount
    return () => {
      if (window.mina) {
        window.mina.removeListener('accountsChanged', handleAccountsChanged);
      }
    }
  }, []);

  const connect = async () => {
    try {
      if (typeof window.mina === 'undefined') {
        toast({
          title: "Wallet Not Found",
          description: "Please install Auro Wallet",
          variant: "destructive"
        });
        throw new Error('Auro Wallet is not installed');
      }

      const accounts = await window.mina.requestAccounts();
      handleAccountsChanged(accounts);

      if (accounts.length > 0) {
        toast({
          title: "Success",
          description: "Wallet connected successfully"
        });
      }
    } catch (error) {
      console.error('Auro wallet connection error:', error);
      if (error instanceof Error) {
        toast({
          title: "Connection Failed",
          description: error.message,
          variant: "destructive"
        });
      }
      throw error;
    }
  };

  const disconnect = async () => {
    setAddress(null);
    setConnected(false);
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully"
    });
  };

  return (
    <AuroWalletContext.Provider value={{ connected, address, connect, disconnect }}>
      {children}
    </AuroWalletContext.Provider>
  );
}

export function useAuroWallet() {
  const context = useContext(AuroWalletContext);
  if (!context) {
    throw new Error('useAuroWallet must be used within a AuroWalletProvider');
  }
  return context;
}