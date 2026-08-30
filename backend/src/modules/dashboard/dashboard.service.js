// dashboard.service.js
import prisma from '../../utils/prisma.js'

export const getStats = async () => {
    const [
        totalProducts,
        totalProjects,
        newQuotes,
        newVisits,
        totalContactMessages,
        totalCustomers,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.project.count(),
        prisma.quoteRequest.count({ where: { OR: [{ status: 'pending' }, { status: 'PENDING' }] } }),
        prisma.visitRequest.count({ where: { OR: [{ status: 'pending' }, { status: 'PENDING' }] } }),
        prisma.contactMessage.count(),
        prisma.user.count({ where: { role: 'customer' } }),
    ])

    return {
        totalProducts,
        totalProjects,
        newQuotes,
        newVisits,
        totalContactMessages,
        totalCustomers,
    }
}