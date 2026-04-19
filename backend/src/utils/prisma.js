import { PrismaClient } from '@prisma/client';
import { adapter } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import env from '../config/env.js';

// Create a connection pool for PostgreSQL
const pool = new Pool({
    connectionString: env.databaseUrl,
});

// Initialize PrismaClient with the adapter for direct database connection
const globalForPrisma = global;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter: adapter(pool),
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
