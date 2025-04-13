import { PrismaClient } from "@prisma/client"

// Using global to avoid multiple instances during development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For Supabase + PgBouncer, we need to use the DIRECT_URL for auth flows
// to avoid the "prepared statement already exists" error
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      // CRITICAL: Use the DIRECT_URL instead of DATABASE_URL
      // This bypasses connection pooling and avoids prepared statement conflicts
      url: process.env.DIRECT_URL || process.env.DATABASE_URL || ''
    }
  }
})

// In development, keep the same Prisma instance across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Check if the database connection is healthy
 * @returns {Promise<boolean>} True if connection is healthy, false otherwise
 */
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    // Simple query to check if the connection is working
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection health check failed:', error)
    return false
  }
}

/**
 * Reset the Prisma client in case of severe connection issues
 * Note: Use this with caution as it can disrupt ongoing operations
 */
export async function resetPrismaConnection(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('Prisma connection reset initiated')
    
    // Allow time for disconnection to complete
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Force a reconnection with the next query
    await prisma.$connect()
    console.log('Prisma connection reset completed successfully')
  } catch (error) {
    console.error('Failed to reset Prisma connection:', error)
    throw error
  }
}

export default prisma
