import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { userApi } from '@/services/api';
import { generateRandomUsername } from '@/utils/username';

export function useAutoCreateProfile(address: string | undefined) {
  const { data: session } = useSession();

  useEffect(() => {
    const createProfile = async () => {
      if (!address) return;

      try {
        // Check if profile exists
        const profile = await userApi.getProfile(address);

        // If profile doesn't exist, create one with random username
        if (!profile) {
          const randomUsername = generateRandomUsername();
          const defaultAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`;

          await userApi.updateProfile({
            evmAddress: address,
            nickname: randomUsername,
            avatar: defaultAvatar,
          });
        }
      } catch (error) {
        console.error('Failed to create profile:', error);
      }
    };

    createProfile();
  }, [address, session]);
}