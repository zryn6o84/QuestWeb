'use client';

import './globals.css';
import { ReactNode } from 'react';
import Web3Providers from "@/providers/Web3Providers";
import { Toaster } from "@/components/ui/toaster";
import Link from 'next/link';
import Image from 'next/image';
import { SessionProvider } from "next-auth/react";
import Navigation from '@/components/Navigation';
import { TelegramAuthProvider } from '@/providers/TelegramAuthContext';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Inter } from "next/font/google";
import AuthModal from '@/components/AuthModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import Navbar from '@/components/Navbar';
import SolanaProvider from '@/providers/SolanaProvider';

require('@solana/wallet-adapter-react-ui/styles.css');

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>QuestWeb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <SolanaProvider>
          <Web3Providers>
            <SessionProvider>
              <TelegramAuthProvider>
                <Navbar />
                <main className="min-h-[calc(100vh-4rem)]">
                  {children}
                </main>
              </TelegramAuthProvider>
            </SessionProvider>
          </Web3Providers>
        </SolanaProvider>
        <Toaster />
      </body>
    </html>
  );
}