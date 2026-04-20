import * as service from './category.service.js'

export const createCategory = async (req, res, next) => {
  try {
    const category = await service.createCategory(req.body)
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

export const getAllCategories = async (req, res, next) => {
  try {
    const data = await service.getAllCategories()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getCategoryById = async (req, res, next) => {
  try {
    const data = await service.getCategoryById(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateCategory = async (req, res, next) => {
  try {
    const data = await service.updateCategory(
      req.params.id,
      req.body
    )
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const deleteCategory = async (req, res, next) => {
  try {
    await service.deleteCategory(req.params.id)
    res.json({ message: 'Category deleted successfully' })
  } catch (err) {
    next(err)
  }
}