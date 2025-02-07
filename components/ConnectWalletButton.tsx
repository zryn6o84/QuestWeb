'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { User2, LogOut, Wallet } from "lucide-react";
import AuthModal from './AuthModal';
import ConnectWalletModal from './ConnectWalletModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ConnectWalletButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar || undefined}
                  alt={user.nickname || undefined}
                />
                <AvatarFallback>
                  <User2 className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowWalletModal(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ConnectWalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowAuthModal(true)}
        className="bg-primary/20 text-foreground hover:bg-primary/30 backdrop-blur-sm"
      >
        Login
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
