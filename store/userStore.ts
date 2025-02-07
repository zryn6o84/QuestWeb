import { create } from 'zustand';

interface SocialAccount {
  id: string;
  username: string;
  name?: string;
}

interface SocialAccounts {
  github: SocialAccount | null;
  discord: SocialAccount | null;
  twitter: SocialAccount | null;
  telegram: {
    id: string;
    username: string;
  } | null;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  auroAddress: string | null;
  socialAccounts: SocialAccounts;
  createdAt: Date;
}

interface UserStore {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUser: (data: Partial<UserProfile>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null
  })),
  clearUser: () => set({ user: null }),
}));
