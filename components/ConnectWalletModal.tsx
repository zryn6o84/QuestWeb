'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { WalletConnection } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SiEthereum, SiSolana } from '@icons-pack/react-simple-icons';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { connectWallet } = useAuth();

  // EVM (Ethereum) wallet connection
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { connect: connectEvm, connectors: evmConnectors } = useConnect();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { signMessageAsync: signEvmMessage } = useSignMessage();

  // Solana wallet connection
  const { publicKey: solanaAddress, signMessage: signSolanaMessage } = useWallet();

  const handleConnectEvm = async () => {
    try {
      setIsLoading(true);

      // Connect EVM wallet if not connected
      if (!isEvmConnected) {
        const connector = evmConnectors[0]; // Usually MetaMask or first available
        await connectEvm({ connector });
      }

      if (!evmAddress) return;

      // Sign message for verification
      const message = `Connect wallet to QuestWeb\nAddress: ${evmAddress}`;
      const signature = await signEvmMessage({ message });

      // Connect wallet to account
      await connectWallet({
        type: 'evm',
        address: evmAddress,
        signature,
      });

      toast({
        title: "Success",
        description: "EVM wallet connected successfully",
      });
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectSolana = async () => {
    try {
      setIsLoading(true);

      if (!solanaAddress) return;

      // Sign message for verification
      const message = new TextEncoder().encode(
        `Connect wallet to QuestWeb\nAddress: ${solanaAddress.toString()}`
      );
      const signature = await signSolanaMessage?.(message);

      if (!signature) throw new Error('Failed to sign message');

      // Connect wallet to account
      await connectWallet({
        type: 'solana',
        address: solanaAddress.toString(),
        signature: Buffer.from(signature).toString('hex'),
      });

      toast({
        title: "Success",
        description: "Solana wallet connected successfully",
      });
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Button
            onClick={handleConnectEvm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <SiEthereum className="h-4 w-4" />
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting EVM Wallet...
              </>
            ) : (
              'Connect EVM Wallet'
            )}
          </Button>

          <Button
            onClick={handleConnectSolana}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <SiSolana className="h-4 w-4" />
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting Solana Wallet...
              </>
            ) : (
              'Connect Solana Wallet'
            )}
          </Button>

          {/* Add more wallet connections here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}