// dashboard.service.js
import prisma from '../../utils/prisma.js'

export const getStats = async () => {
    const [
        totalProducts,
        totalProjects,
        newQuotes,
        newVisits,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.project.count(),
        prisma.quoteRequest.count({ where: { status: 'pending' } }),
        prisma.visitRequest.count({ where: { status: 'pending' } }),
    ])

    return {
        totalProducts,
        totalProjects,
        newQuotes,
        newVisits,
    }
}