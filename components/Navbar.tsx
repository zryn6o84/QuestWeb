'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import { Menu, User2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Navigation from './Navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useUserStore } from '@/store/userStore';

export default function Navbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { data: session } = useSession();
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (session?.user) {
      // Fetch complete user profile when session exists
      fetch('/api/user/profile?id=' + session.user.id)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setUser(data);
          }
        })
        .catch(console.error);
    } else {
      clearUser();
    }
  }, [session, setUser, clearUser]);

  const handleSignOut = async () => {
    await signOut();
    clearUser();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/logo.svg" alt="Logo" width={32} height={32} />
            <span className="hidden font-bold sm:inline-block">
              QuestWeb
            </span>
          </Link>
          <div className="hidden md:flex">
            <Navigation isAuthenticated={!!user} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search functionality here if needed */}
          </div>
          <nav className="flex items-center">
            {user ? (
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
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User2 className="mr-2 h-4 w-4" />
                      {user.nickname || 'Profile'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth" passHref>
                <Button className="bg-primary/20 text-foreground hover:bg-primary/30 backdrop-blur-sm">
                  Login
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              className="ml-2 h-8 w-8 px-0 md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
      {showMobileMenu && (
        <div className="container md:hidden">
          <Navigation mobile onClose={() => setShowMobileMenu(false)} isAuthenticated={!!user} />
        </div>
      )}
    </header>
  );
}