import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Connection pooling configuration for production with PM2 cluster mode
// Each worker gets its own connection pool, so we limit per-worker connections
const poolSize = process.env.NODE_ENV === 'production' 
  ? parseInt(process.env.DB_POOL_SIZE || '5') 
  : undefined;

// Connection timeout settings
const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'); // 10s default
const poolTimeout = parseInt(process.env.DB_POOL_TIMEOUT || '10000'); // 10s default

// Build Prisma log configuration based on environment
const logConfig = process.env.NODE_ENV === 'development' 
  ? ['query', 'warn', 'error'] as ('query' | 'warn' | 'error')[] 
  : ['error'] as ('query' | 'warn' | 'error')[];

/**
 * Create PrismaClient with robust connection pool settings
 * 
 * Connection pool params are set via DATABASE_URL query params:
 * - connection_limit: max connections per pool (set via DB_POOL_SIZE)
 * - pool_timeout: seconds to wait for available connection
 * - connect_timeout: seconds to wait for initial connection
 */
function buildDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/fahadcloud';
  
  // Only append params if using PostgreSQL
  if (!baseUrl.startsWith('postgresql://') && !baseUrl.startsWith('postgres://')) {
    return baseUrl;
  }

  // Parse existing URL to avoid duplicating params
  const url = new URL(baseUrl);
  
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', String(poolSize || 10));
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', String(Math.floor(poolTimeout / 1000)));
  }
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', String(Math.floor(connectionTimeout / 1000)));
  }
  
  return url.toString();
}

/**
 * Retry wrapper for database connection with exponential backoff
 */
async function connectWithRetry(prisma: PrismaClient, maxRetries: number = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s, max 10s
      
      console.error(
        `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}` +
        (isLastAttempt ? '' : `, retrying in ${delayMs}ms...`)
      );

      if (isLastAttempt) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Create the PrismaClient singleton with connection pool settings
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: logConfig,
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
})

// In development, store on global to survive HMR
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Connection retry on startup (non-blocking)
connectWithRetry(db).catch((error) => {
  console.error('Failed to establish initial database connection after retries:', error.message);
  // Don't crash the process - requests will fail with clear error until DB is available
})

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, disconnecting database...`);
  try {
    await db.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting database:', error);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Also handle beforeExit for normal termination
process.on('beforeExit', async () => {
  await db.$disconnect()
})
