import NextAuth from "next-auth"
import { authOptions } from '@/app/api/auth/options'

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
  
  interface User {
    id: string
    domain?: string | null
    teamId?: string | null
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
