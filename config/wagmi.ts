import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, lineaTestnet, linea } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

export const config = createConfig({
  chains: [mainnet, sepolia, lineaTestnet, linea],
  connectors: [
    injected(),
    metaMask(),
    safe(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [lineaTestnet.id]: http(),
    [linea.id]: http(),
  },
})