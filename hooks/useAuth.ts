import { useState, useCallback } from 'react';
import { LoginCredentials, RegisterCredentials, AuthResponse, WalletConnection } from '@/types/auth';
import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      // Auto login after registration
      return login(credentials);
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const connectWallet = useCallback(async (wallet: WalletConnection) => {
    if (!session?.user) {
      throw new Error('Must be logged in to connect wallet');
    }

    const response = await fetch('/api/user/connect-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wallet),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to connect wallet');
    }

    // Update session with new wallet info
    await update();
  }, [session, update]);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isLoading,
    login,
    register,
    logout,
    connectWallet,
  };
}