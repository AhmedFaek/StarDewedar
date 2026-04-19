const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const env = require('../config/env');

// Create a connection pool for PostgreSQL
const pool = new Pool({
    connectionString: env.databaseUrl,
});

// Initialize PrismaClient with the adapter for direct database connection
const globalForPrisma = global;

const adapter = new PrismaPg(pool);

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
