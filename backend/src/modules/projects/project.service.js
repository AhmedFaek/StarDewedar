import * as repo from './project.repository.js'
import * as imageService from './submodules/images/image.service.js'

export const createProject = async (data, files) => {
    const project = await repo.create({
        title: data.title,
        description: data.description,
        category_id: data.category_id || null,
        client_name: data.client_name || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
        location: data.location || null,
    })

    await imageService.uploadImages(project.id, files)

    return project
}

export const getProjects = () => repo.findAll()

export const getProjectById = (id) => repo.findById(id)

export const updateProject = (id, data) => {
    const { images, ...rest } = data // ✅ strip images out, it's not a scalar field

    return repo.update(id, {
        ...rest,
        budget: rest.budget ? parseFloat(rest.budget) : null,
        start_date: rest.start_date ? new Date(rest.start_date).toISOString() : null, // ✅ "2026-04-17" → full ISO
        end_date: rest.end_date ? new Date(rest.end_date).toISOString() : null,
        category_id: rest.category_id || null,
    })
}

export const deleteProject = (id) => {
    return repo.remove(id)
}