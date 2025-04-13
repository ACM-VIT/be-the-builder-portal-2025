import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { assignDomainToUser } from "@/lib/domainUtils"
import type { NextAuthOptions } from "next-auth"
import type { AdapterUser } from "next-auth/adapters"

// Extend the Session type to include custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      domain?: string | null
      teamId?: string | null
      isAdmin?: boolean
    }
  }
  
  // We need to extend the User type to allow for our custom fields
  interface User {
    id: string
    domain?: string | null
    teamId?: string | null
  }
}

// Parse admin emails from environment variable
const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

// Create Next Auth handler with more relaxed options
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/auth/error",
    newUser: "/",
  },
  // Turn on debug mode if needed
  debug: process.env.NEXTAUTH_DEBUG === "1",
  callbacks: {
    async signIn({ user }) {
      try {
        // The User type now has domain declared in it
        if (user.email && !user.domain) {
          await assignDomainToUser(user.id, user.email);
        }
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Continue even if domain assignment fails
      }
      return true;
    },
    async session({ session, user }) {
      try {
        if (session.user && user) {
          // Using the extended User type
          session.user.id = user.id;
          session.user.domain = user.domain;
          session.user.teamId = user.teamId;
          
          // Check if the user is an admin
          session.user.isAdmin = user.email ? 
            adminEmails.includes(user.email.toLowerCase()) : 
            false;
        }
      } catch (error) {
        console.error("Error in session callback:", error);
        // Return session even if there was an error
      }
      return session;
    },
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

