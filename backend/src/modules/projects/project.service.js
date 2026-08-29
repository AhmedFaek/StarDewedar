import * as repo from './project.repository.js'
import * as imageService from './submodules/images/image.service.js'

export const createProject = async (data, files) => {
    const project = await repo.create({
        title_en: data.title_en,
        title_ar: data.title_ar,
        description_en: data.description_en,
        description_ar: data.description_ar,
        category_id: data.category_id || null,
        client_name: data.client_name || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
        location_en: data.location_en || null,
        location_ar: data.location_ar || null,
    })

    await imageService.uploadImages(project.id, files)

    return project
}

export const getProjects = () => repo.findAll()

export const getProjectById = (id) => repo.findById(id)

export const updateProject = (id, data) => {
    const payload = {}
    if (data.title_en !== undefined) payload.title_en = data.title_en
    if (data.title_ar !== undefined) payload.title_ar = data.title_ar
    if (data.description_en !== undefined) payload.description_en = data.description_en
    if (data.description_ar !== undefined) payload.description_ar = data.description_ar
    if (data.category_id !== undefined) payload.category_id = data.category_id || null
    if (data.client_name !== undefined) payload.client_name = data.client_name || null
    if (data.budget !== undefined) payload.budget = data.budget ? parseFloat(data.budget) : null
    if (data.start_date !== undefined) payload.start_date = data.start_date ? new Date(data.start_date) : null
    if (data.end_date !== undefined) payload.end_date = data.end_date ? new Date(data.end_date) : null
    if (data.location_en !== undefined) payload.location_en = data.location_en || null
    if (data.location_ar !== undefined) payload.location_ar = data.location_ar || null

    return repo.update(id, payload)
}

export const deleteProject = (id) => {
    return repo.remove(id)
}