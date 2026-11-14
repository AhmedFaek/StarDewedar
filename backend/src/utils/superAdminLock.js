import prisma from './prisma.js'
import { ROLES } from './constants.js'

// Reserved for transactions that change the set of super_admin users.
export const SUPER_ADMIN_ADVISORY_LOCK_KEY = 731946258104n

export const withSuperAdminLock = (operation, { database = prisma } = {}) => (
    database.$transaction(async (transaction) => {
        await transaction.$queryRaw`
            SELECT pg_advisory_xact_lock(${SUPER_ADMIN_ADVISORY_LOCK_KEY}) IS NULL AS lock_acquired
        `
        const superAdminCount = await transaction.user.count({
            where: { role: ROLES.SUPER_ADMIN },
        })

        return operation({ transaction, superAdminCount })
    }, {
        maxWait: 5000,
        timeout: 10000,
    })
)
