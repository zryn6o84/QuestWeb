'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SolanaWalletButton() {
  const { connected, publicKey, select, disconnect, wallets } = useWallet();

  const handleConnect = async (walletName: WalletName) => {
    try {
      await select(walletName);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={connected ? 'outline' : 'default'}
          className="glass-button w-full h-10"
        >
          {connected && publicKey ? (
            <>
              Connected: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-6)}
            </>
          ) : (
            'Connect Solana Wallet'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[200px]">
        {connected ? (
          <DropdownMenuItem onClick={handleDisconnect}>
            Disconnect
          </DropdownMenuItem>
        ) : (
          wallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.adapter.name}
              onClick={() => handleConnect(wallet.adapter.name)}
            >
              {wallet.adapter.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}