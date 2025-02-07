import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import TwitterProvider from "next-auth/providers/twitter";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.nickname = user.nickname
        token.avatar = user.avatar
        token.evmAddress = user.evmAddress
        token.solanaAddress = user.solanaAddress
        token.auroAddress = user.auroAddress
        token.twitterId = user.twitterId
        token.twitterUsername = user.twitterUsername
        token.twitterName = user.twitterName
        token.discordId = user.discordId
        token.discordUsername = user.discordUsername
        token.discordName = user.discordName
        token.githubId = user.githubId
        token.githubUsername = user.githubUsername
        token.githubName = user.githubName
        token.telegramId = user.telegramId
        token.telegramUsername = user.telegramUsername
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.nickname = token.nickname
        session.user.avatar = token.avatar
        session.user.evmAddress = token.evmAddress
        session.user.solanaAddress = token.solanaAddress
        session.user.auroAddress = token.auroAddress
        session.user.twitterId = token.twitterId
        session.user.twitterUsername = token.twitterUsername
        session.user.twitterName = token.twitterName
        session.user.discordId = token.discordId
        session.user.discordUsername = token.discordUsername
        session.user.discordName = token.discordName
        session.user.githubId = token.githubId
        session.user.githubUsername = token.githubUsername
        session.user.githubName = token.githubName
        session.user.telegramId = token.telegramId
        session.user.telegramUsername = token.telegramUsername
      }
      return session
    }
  },
};