import prisma from '../../utils/prisma.js';

export const createCategory = (data) => {
  return prisma.category.create({ data })
}

export const getAllCategories = () => {
  return prisma.category.findMany({
    orderBy: { created_at: 'desc' },
  })
}

export const getCategoryById = (id) => {
  return prisma.category.findUnique({
    where: { id },
  })
}

export const findByNameAndType = (name, type) => {
  return prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      type,
    },
  })
}

export const updateCategory = (id, data) => {
  return prisma.category.update({
    where: { id },
    data,
  })
}

export const deleteCategory = (id) => {
  return prisma.category.delete({
    where: { id },
  })
}