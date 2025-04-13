// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from '@/app/api/auth/options'

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
  
  // Extend the User type for custom fields
  interface User {
    id: string
    domain?: string | null
    teamId?: string | null
  }
}

// Initialize NextAuth handler using our options
const handler = NextAuth(authOptions);

// Export only the GET and POST methods for the route as required by Next.js 15
export { handler as GET, handler as POST };
