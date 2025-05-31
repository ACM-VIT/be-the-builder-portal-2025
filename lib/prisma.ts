import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL || ''
    }
  }
})

if (process.env.NODE_ENV !== 'development') {
  globalForPrisma.prisma = prisma
}


export async function checkConnectionHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection health check failed:', error)
    return false
  }
}

export async function resetPrismaConnection(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('Prisma connection reset initiated')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await prisma.$connect()
    console.log('Prisma connection reset completed successfully')
  } catch (error) {
    console.error('Failed to reset Prisma connection:', error)
    throw error
  }
}

export default prisma
