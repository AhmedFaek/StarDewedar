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

export const findByNameAndType = (name_en, name_ar, type) => {
  return prisma.category.findFirst({
    where: {
      OR: [
        {
          name_en: {
            equals: name_en,
            mode: 'insensitive',
          },
        },
        {
          name_ar: {
            equals: name_ar,
            mode: 'insensitive',
          },
        },
      ],
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