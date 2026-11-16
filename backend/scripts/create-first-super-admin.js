import { emitKeypressEvents } from 'node:readline'
import { createInterface } from 'node:readline/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import {
    BCRYPT_SALT_ROUNDS,
    strongPasswordSchema,
} from '../src/utils/passwordPolicy.js'
import { withSuperAdminLock } from '../src/utils/superAdminLock.js'

const emailSchema = z.string().email().max(254)
const nameSchema = z.string().min(2).max(100)
const bootstrapPasswordSchema = strongPasswordSchema.min(12)

class BootstrapError extends Error {}

const refuse = (message) => {
    throw new BootstrapError(message)
}

const parseDatabaseTarget = (databaseUrl) => {
    if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
        refuse('DATABASE_URL is required.')
    }

    let url
    let databaseName
    try {
        url = new URL(databaseUrl)
        databaseName = decodeURIComponent(url.pathname.slice(1))
    } catch {
        refuse('DATABASE_URL must be a valid PostgreSQL connection string.')
    }

    if (
        !['postgres:', 'postgresql:'].includes(url.protocol)
        || !url.hostname
        || !databaseName
    ) {
        refuse('DATABASE_URL must identify a PostgreSQL host and database.')
    }

    return { url, host: url.hostname, databaseName }
}

const promptLine = async (label, { hidden = false, input, output = process.stdout } = {}) => {
    if (!input?.isTTY) {
        refuse(`${label} must be provided when stdin is not a TTY.`)
    }

    if (!hidden) {
        const interface_ = createInterface({ input, output })
        try {
            return await interface_.question(`${label}: `)
        } finally {
            interface_.close()
        }
    }

    emitKeypressEvents(input)
    const wasRaw = input.isRaw
    input.setRawMode(true)
    input.resume()
    output.write(`${label}: `)

    return new Promise((resolvePrompt, rejectPrompt) => {
        let value = ''
        const finish = (error) => {
            input.removeListener('keypress', onKeypress)
            input.setRawMode(Boolean(wasRaw))
            output.write('\n')
            if (error) rejectPrompt(error)
            else resolvePrompt(value)
        }
        const onKeypress = (character, key = {}) => {
            if (key.ctrl && key.name === 'c') {
                finish(new BootstrapError('Password prompt was cancelled.'))
            } else if (key.name === 'return' || key.name === 'enter') {
                finish()
            } else if (key.name === 'backspace') {
                value = value.slice(0, -1)
            } else if (!key.ctrl && typeof character === 'string') {
                value += character
            }
        }

        input.on('keypress', onKeypress)
    })
}

export const createPrismaClient = async (databaseUrl) => {
    const pool = new Pool({ connectionString: databaseUrl })
    try {
        return new PrismaClient({ adapter: new PrismaPg(pool) })
    } catch (error) {
        await pool.end()
        throw error
    }
}

const sanitizedFailure = (error) => {
    if (error instanceof BootstrapError) return error
    if (error?.code === 'P2002') {
        return new BootstrapError('Email already exists. No changes were made.')
    }
    return new BootstrapError('Bootstrap failed because of a database or internal error.')
}

export const bootstrapFirstSuperAdmin = async ({
    argv = [],
    env = process.env,
    input = process.stdin,
    prompt = promptLine,
    logger = console,
    createDatabase = createPrismaClient,
    hasher = bcrypt.hash,
    lock = withSuperAdminLock,
} = {}) => {
    let database
    let failure
    let createdUser

    try {
        if (argv.length > 2) {
            refuse('Only email and name may be supplied as arguments; password must not be passed in arguments.')
        }

        const target = parseDatabaseTarget(env.DATABASE_URL)
        logger.info(`Target database: host=${target.host} database=${target.databaseName}`)

        const emailInput = argv[0] ?? await prompt('Email', { input })
        const name = argv[1] ?? await prompt('Name', { input })
        const email = String(emailInput).trim().toLowerCase()
        if (!emailSchema.safeParse(email).success) {
            refuse('Email must be valid and no longer than 254 characters.')
        }
        if (typeof name !== 'string' || !nameSchema.safeParse(name).success) {
            refuse('Name must be between 2 and 100 characters.')
        }

        const confirmation = input.isTTY
            ? await prompt('Retype database name to confirm', { input })
            : env.BOOTSTRAP_CONFIRM_DB_NAME
        if (typeof confirmation !== 'string') {
            refuse('BOOTSTRAP_CONFIRM_DB_NAME must match the target database name when stdin is not a TTY.')
        }
        if (confirmation.trim() !== target.databaseName) {
            refuse('Database name confirmation does not match. No changes were made.')
        }

        const password = input.isTTY
            ? await prompt('Password', { hidden: true, input })
            : env.BOOTSTRAP_ADMIN_PASSWORD
        if (typeof password !== 'string') {
            refuse('BOOTSTRAP_ADMIN_PASSWORD is required when stdin is not a TTY.')
        }
        if (!bootstrapPasswordSchema.safeParse(password).success) {
            refuse('Password must be at least 12 characters and satisfy the application password rules.')
        }

        database = await createDatabase(target.url.href)
        createdUser = await lock(async ({ transaction, superAdminCount }) => {
            if (superAdminCount > 0) {
                refuse('A super_admin already exists. No changes were made.')
            }

            const existing = await transaction.user.findUnique({
                where: { email },
                select: { id: true },
            })
            if (existing) {
                refuse('Email already exists. No changes were made.')
            }

            const passwordHash = await hasher(password, BCRYPT_SALT_ROUNDS)
            const user = await transaction.user.create({
                data: {
                    name,
                    email,
                    password: passwordHash,
                    role: 'super_admin',
                    email_verified: true,
                },
                select: { id: true, email: true },
            })
            return { id: user.id, email: user.email }
        }, { database })
    } catch (error) {
        failure = sanitizedFailure(error)
    } finally {
        if (database) {
            try {
                await database.$disconnect()
            } catch {
                if (!failure) {
                    failure = new BootstrapError('Bootstrap completed, but the database client could not be disconnected.')
                }
            }
        }
    }

    if (failure) throw failure
    return createdUser
}

export const runBootstrapCli = async ({
    processControl = process,
    logger = console,
    flushOutput = () => Promise.all([process.stdout, process.stderr].map(
        (stream) => new Promise((resolveFlush) => stream.write('', resolveFlush)),
    )),
    ...dependencies
} = {}) => {
    let exitCode = 0
    try {
        const user = await bootstrapFirstSuperAdmin({ ...dependencies, logger })
        logger.info(`Created first super_admin: id=${user.id} email=${user.email}`)
        logger.info('Remove BOOTSTRAP_ADMIN_PASSWORD and BOOTSTRAP_CONFIRM_DB_NAME after this one-time operation.')
    } catch (error) {
        exitCode = 1
        logger.error(error instanceof BootstrapError
            ? error.message
            : 'Bootstrap failed because of a database or internal error.')
    }

    try {
        await flushOutput()
    } catch {
        exitCode = 1
    }
    processControl.exitCode = exitCode
    processControl.exit(exitCode)
    return exitCode
}

const invokedPath = process.argv[1]
if (invokedPath && pathToFileURL(resolve(invokedPath)).href === import.meta.url) {
    await runBootstrapCli()
}
