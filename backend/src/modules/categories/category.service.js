import * as repo from './category.repository.js'

export const createCategory = async (data) => {
  const existing = await repo.findByNameAndType(data.name, data.type)

  if (existing) {
    throw new Error('Category already exists')
  }

  return await repo.createCategory(data)
}

export const getAllCategories = async () => {
  return await repo.getAllCategories()
}

export const getCategoryById = async (id) => {
  const category = await repo.getCategoryById(id)

  if (!category) {
    throw new Error('Category not found')
  }

  return category
}

export const updateCategory = async (id, data) => {
  return await repo.updateCategory(id, data)
}

export const deleteCategory = async (id) => {
  return await repo.deleteCategory(id)
}