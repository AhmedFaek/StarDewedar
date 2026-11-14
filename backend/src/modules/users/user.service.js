import * as userRepo from './user.repository.js'
import { ROLES } from '../../utils/constants.js'
import { withSuperAdminLock } from '../../utils/superAdminLock.js'

const createGovernanceError = (status, code, message) => {
    const error = new Error(message)
    error.status = status
    error.code = code
    return error
}

const userNotFound = () => createGovernanceError(
    404,
    'USER_NOT_FOUND',
    'User not found.'
)

const userDeleted = () => ({ message: 'User deleted successfully.' })

export const deleteUser = async (id, actor, {
    repository = userRepo,
    lock = withSuperAdminLock,
} = {}) => {
    if (id === actor?.userId) {
        throw createGovernanceError(
            400,
            'SELF_DELETE_NOT_ALLOWED',
            'You cannot delete your own account.'
        )
    }

    const user = await repository.findUserById(id)
    if (!user) throw userNotFound()

    const deleteWithSuperAdminLock = () => lock(async ({ transaction, superAdminCount }) => {
        const currentUser = await transaction.user.findUnique({
            where: { id },
            select: { id: true, role: true },
        })
        if (!currentUser) throw userNotFound()

        if (currentUser.role === ROLES.SUPER_ADMIN) {
            if (actor?.role !== ROLES.SUPER_ADMIN) {
                throw createGovernanceError(
                    403,
                    'SUPER_ADMIN_DELETE_FORBIDDEN',
                    'Only a super admin can delete a super admin account.'
                )
            }
            if (superAdminCount <= 1) {
                throw createGovernanceError(
                    409,
                    'LAST_SUPER_ADMIN',
                    'The last super admin cannot be deleted or demoted.'
                )
            }
        }

        await transaction.user.delete({ where: { id } })
        return userDeleted()
    })

    if (user.role === ROLES.SUPER_ADMIN) {
        if (actor?.role !== ROLES.SUPER_ADMIN) {
            throw createGovernanceError(
                403,
                'SUPER_ADMIN_DELETE_FORBIDDEN',
                'Only a super admin can delete a super admin account.'
            )
        }
        return deleteWithSuperAdminLock()
    }

    const result = await repository.deleteUserByIdUnlessSuperAdmin(id)
    if (result.count === 1) return userDeleted()

    const currentUser = await repository.findUserById(id)
    if (!currentUser) throw userNotFound()
    if (currentUser.role !== ROLES.SUPER_ADMIN) throw userNotFound()
    if (actor?.role !== ROLES.SUPER_ADMIN) {
        throw createGovernanceError(
            403,
            'SUPER_ADMIN_DELETE_FORBIDDEN',
            'Only a super admin can delete a super admin account.'
        )
    }

    return deleteWithSuperAdminLock()
}
