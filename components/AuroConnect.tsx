'use client'

import { Button } from '@/components/ui/button'
import { useAuroWallet } from '@/providers/AuroWalletProvider'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export function AuroConnectButton() {
  const { auroAddress, connect, disconnect, isConnected } = useAuroWallet()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      await connect()
    } catch (error) {
      console.error('Failed to connect:', error)
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Auro wallet",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    try {
      disconnect()
      toast({
        title: "Success",
        description: "Disconnected from Auro wallet"
      })
    } catch (error) {
      console.error('Failed to disconnect:', error)
      toast({
        title: "Error",
        description: "Failed to disconnect from Auro wallet",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <Button disabled className="min-w-[140px]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && auroAddress) {
    return (
      <Button
        onClick={handleDisconnect}
        variant="outline"
        className="min-w-[140px]"
      >
        {`${auroAddress.slice(0, 4)}...${auroAddress.slice(-4)}`}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      variant="outline"
      className="min-w-[140px]"
    >
      Connect Auro
    </Button>
  )
}