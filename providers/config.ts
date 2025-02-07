import { http, createConfig } from 'wagmi'
import { lineaSepolia, flowTestnet, opBNBTestnet, telosTestnet, telos, anvil } from 'wagmi/chains'
import monad from './monad'
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'

// accroding to the environment variable
const chains = process.env.NODE_ENV === 'development'
  ? [anvil, lineaSepolia, flowTestnet, opBNBTestnet, telosTestnet, monad] as const
  : [lineaSepolia, flowTestnet, opBNBTestnet, telosTestnet] as const

// configure wallets
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        trustWallet,
      ],
    },
  ],
  {
    appName: 'QuestWeb',
    projectId,
  }
)

// configure transports
const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http()])
) as Record<number, ReturnType<typeof http>>

export const config = createConfig({
  chains,
  transports,
  connectors,
})
