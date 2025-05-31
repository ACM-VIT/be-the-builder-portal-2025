import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { assignDomainToUser } from "@/lib/domainUtils"
import type { NextAuthOptions } from "next-auth"

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          hd: 'vitstudent.ac.in',
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
    newUser: "/",
  },
  debug: process.env.NEXTAUTH_DEBUG === "1",
  callbacks: {
    async signIn({ user }) {
      try {
        if (user.email && !user.domain) {
          await assignDomainToUser(user.id, user.email);
        }
      } catch (error) {
        console.error("Error in signIn callback:", error);
      }
      return true;
    },
    async session({ session, user }) {
      try {
        if (session.user && user) {
          session.user.id = user.id;
          session.user.domain = user.domain;
          session.user.teamId = user.teamId;
          session.user.isAdmin = user.email 
            ? adminEmails.includes(user.email.toLowerCase())
            : false;
        }
      } catch (error) {
        console.error("Error in session callback:", error);
      }
      return session;
    },
  }
}; 