import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Connection pooling configuration for production with PM2 cluster mode
// Each worker gets its own connection pool, so we limit per-worker connections
const poolSize = process.env.NODE_ENV === 'production' 
  ? parseInt(process.env.DB_POOL_SIZE || '5') 
  : undefined;

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})
