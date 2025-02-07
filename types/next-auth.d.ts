import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"
import { Wallet } from '@prisma/client';
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      nickname?: string | null
      avatar?: string | null
      evmAddress?: string | null
      solanaAddress?: string | null
      auroAddress?: string | null
      twitterId?: string | null
      twitterUsername?: string | null
      twitterName?: string | null
      discordId?: string | null
      discordUsername?: string | null
      discordName?: string | null
      githubId?: string | null
      githubUsername?: string | null
      githubName?: string | null
      telegramId?: string | null
      telegramUsername?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    nickname?: string | null
    avatar?: string | null
    evmAddress?: string | null
    solanaAddress?: string | null
    auroAddress?: string | null
    twitterId?: string | null
    twitterUsername?: string | null
    twitterName?: string | null
    discordId?: string | null
    discordUsername?: string | null
    discordName?: string | null
    githubId?: string | null
    githubUsername?: string | null
    githubName?: string | null
    telegramId?: string | null
    telegramUsername?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    email: string
    name?: string | null
    nickname?: string | null
    avatar?: string | null
    evmAddress?: string | null
    solanaAddress?: string | null
    auroAddress?: string | null
    twitterId?: string | null
    twitterUsername?: string | null
    twitterName?: string | null
    discordId?: string | null
    discordUsername?: string | null
    discordName?: string | null
    githubId?: string | null
    githubUsername?: string | null
    githubName?: string | null
    telegramId?: string | null
    telegramUsername?: string | null
  }
}