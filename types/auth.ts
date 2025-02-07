export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nickname: string;
  avatar?: string;
}

export interface WalletConnection {
  type: 'evm' | 'solana' | 'sui' | 'auro';
  address: string;
  chainId?: number;
  signature?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    nickname: string;
    avatar?: string;
    wallets?: WalletConnection[];
  };
  token: string;
}

export interface AuthError {
  message: string;
  code?: string;
}