import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { assignDomainToUser } from "@/lib/domainUtils"
import type { NextAuthOptions } from "next-auth"

// Parse admin emails from environment variable
const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

// Export the NextAuth options for use in other files
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
  debug: process.env.NEXTAUTH_DEBUG === "1",
  callbacks: {
    async signIn({ user }) {
      try {
        // If a user does not have a domain, assign one based on their email
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
          session.user.id = user.id;
          session.user.domain = user.domain;
          session.user.teamId = user.teamId;
          // Mark the user as admin if their email is included in the adminEmails list
          session.user.isAdmin = user.email 
            ? adminEmails.includes(user.email.toLowerCase())
            : false;
        }
      } catch (error) {
        console.error("Error in session callback:", error);
        // Return session even if there was an error
      }
      return session;
    },
  }
}; 