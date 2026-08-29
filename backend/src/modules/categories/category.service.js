import * as repo from './category.repository.js'

export const createCategory = async (data) => {
  const existing = await repo.findByNameAndType(data.name_en, data.name_ar, data.type)

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
  const payload = {}
  if (data.name_en !== undefined) payload.name_en = data.name_en
  if (data.name_ar !== undefined) payload.name_ar = data.name_ar
  if (data.type !== undefined) payload.type = data.type

  return await repo.updateCategory(id, payload)
}

export const deleteCategory = async (id) => {
  return await repo.deleteCategory(id)
}