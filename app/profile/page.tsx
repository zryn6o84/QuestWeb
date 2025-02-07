'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SolanaWalletButton from '@/components/SolanaWalletButton';
import { useAuroWallet } from '@/providers/AuroWalletProvider';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { SiGithub, SiX, SiDiscord, SiTelegram } from "@icons-pack/react-simple-icons";
import ImageUpload from '@/components/ImageUpload';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, User, Wallet, Share2 } from "lucide-react";
import { useTelegramAuth } from "@/providers/TelegramAuthContext";
import { useUserStore } from '@/store/userStore';
import { SocialAccount } from '@/types/profile';
import { encryptData } from '@/utils/encryption';

// Add saveFormData function
const saveFormData = (data: any) => {
  localStorage.setItem("profileFormData", JSON.stringify(data));
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const { connected: solanaConnected, publicKey, signMessage: signSolanaMessage } = useWallet();
  const { connected: auroConnected, address: auroAddress, connect: connectAuro } = useAuroWallet();
  const { address: evmAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { isInitialized, username: telegramUsername, userID: telegramUserId } = useTelegramAuth();
  const { user, setUser } = useUserStore();

  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load user profile data when session is available
  useEffect(() => {
    const loadUserProfile = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/user/profile?id=${session.user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }
          const userData = await response.json();

          // Update local state
          setNickname(userData.nickname || '');
          setAvatar(userData.avatar || '');

          // Update user store
          setUser({
            id: userData.id,
            email: userData.email,
            nickname: userData.nickname,
            avatar: userData.avatar,
            evmAddress: userData.evmAddress,
            solanaAddress: userData.solanaAddress,
            auroAddress: userData.auroAddress,
            socialAccounts: userData.socialAccounts,
            createdAt: new Date(userData.createdAt)
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to load user profile',
            variant: 'destructive',
          });
        }
      }
    };

    loadUserProfile();
  }, [session?.user?.id, setUser, toast]);

  // Handle Telegram account auto-fill
  useEffect(() => {
    if (isInitialized && telegramUsername && telegramUserId && user) {
      const updatedUser = {
        ...user,
        socialAccounts: {
          ...user.socialAccounts,
          telegram: {
            id: String(telegramUserId),
            username: telegramUsername
          }
        }
      };
      setUser(updatedUser);
    }
  }, [isInitialized, telegramUsername, telegramUserId, user, setUser]);

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname || null,
          avatar: avatar || null,
          solanaAddress: publicKey?.toString() || null,
          auroAddress: auroConnected ? auroAddress : null,
          evmAddress: evmAddress || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      const { user: updatedUser } = await response.json();

      // Update user store with the response
      setUser({
        ...updatedUser,
        createdAt: new Date(updatedUser.createdAt)
      });

      await update();
      toast({
        title: 'Profile updated successfully',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to update profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle social account verification
  const handleSocialVerification = async (provider: "twitter" | "discord" | "github") => {
    try {
      setIsVerifying(true);
      localStorage.setItem("profileModalShouldOpen", "true");

      await signIn(provider, {
        redirect: true,
        callbackUrl: `${window.location.origin}/profile`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to verify ${provider} account`,
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  // Handle Telegram authentication
  const handleTelegramVerification = () => {
    if (!telegramUsername) {
      toast({
        title: "Info",
        description: "To link your Telegram account, please use this dApp in Telegram Mini App.",
      });
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information, connected wallets and social accounts
        </p>
      </div>

      <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="profile" className="text-base">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </div>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-base">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallets
              </div>
            </TabsTrigger>
            <TabsTrigger value="social" className="text-base">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Social
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 p-4 border rounded-lg bg-background/50">
              <div className="flex flex-col items-center gap-6">
                <ImageUpload
                  value={avatar}
                  onChange={(url) => setAvatar(url)}
                  label="Avatar"
                  variant="avatar"
                />

                <div className="w-full space-y-2">
                  <Label htmlFor="nickname" className="text-base">Nickname</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter your nickname"
                    className="glass-input"
                  />
                </div>
              </div>

              <Button
                className="w-full neon-button-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid gap-6 p-4 border rounded-lg bg-background/50">
              <div className="space-y-2">
                <Label className="text-base">EVM Wallet</Label>
                <div className="w-full">
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      mounted,
                    }) => {
                      const ready = mounted;
                      const connected = ready && account && chain;

                      return (
                        <Button
                          onClick={connected ? openAccountModal : openConnectModal}
                          variant={connected ? 'outline' : 'default'}
                          className="glass-button w-full h-10"
                          disabled={loading}
                        >
                          {connected ? (
                            <>
                              Connected: {account.address.slice(0, 6)}...{account.address.slice(-6)}
                            </>
                          ) : (
                            'Connect EVM Wallet'
                          )}
                        </Button>
                      );
                    }}
                  </ConnectButton.Custom>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Solana Wallet</Label>
                <div className="w-full">
                  <SolanaWalletButton />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Auro Wallet</Label>
                <div className="w-full">
                  <Button
                    variant={auroConnected ? 'outline' : 'default'}
                    onClick={connectAuro}
                    disabled={loading}
                    className="glass-button w-full h-10"
                  >
                    {auroConnected ? (
                      <>
                        Connected: {auroAddress?.slice(0, 6)}...{auroAddress?.slice(-6)}
                      </>
                    ) : (
                      'Connect Auro Wallet'
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full neon-button-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid gap-6 p-4 border rounded-lg bg-background/50">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialVerification("twitter")}
                  className="glass-button h-16"
                  disabled={isVerifying}
                >
                  <SiX className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      {session?.user?.twitterName || "Verify X"}
                    </div>
                    {session?.user?.twitterUsername && (
                      <div className="text-xs text-muted-foreground">@{session.user.twitterUsername}</div>
                    )}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialVerification("discord")}
                  className="glass-button h-16"
                  disabled={isVerifying}
                >
                  <SiDiscord className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      {session?.user?.discordName || "Verify Discord"}
                    </div>
                    {session?.user?.discordUsername && (
                      <div className="text-xs text-muted-foreground">@{session.user.discordUsername}</div>
                    )}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSocialVerification("github")}
                  className="glass-button h-16"
                  disabled={isVerifying}
                >
                  <SiGithub className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      {session?.user?.githubName || "Verify GitHub"}
                    </div>
                    {session?.user?.githubUsername && (
                      <div className="text-xs text-muted-foreground">@{session.user.githubUsername}</div>
                    )}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleTelegramVerification}
                  disabled={!isInitialized}
                  className="glass-button h-16"
                >
                  <SiTelegram className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      {session?.user?.telegramUsername || "Verify Telegram"}
                    </div>
                    {session?.user?.telegramUsername && (
                      <div className="text-xs text-muted-foreground">@{session.user.telegramUsername}</div>
                    )}
                  </div>
                </Button>
              </div>

              {/* Telegram Mini App Prompt */}
              {!isInitialized && (
                <Alert variant="warning" className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200 text-sm">
                    To link your Telegram account, please use this dApp in Telegram Mini App.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full neon-button-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}