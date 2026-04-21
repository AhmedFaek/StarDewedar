import * as service from './project.service.js'

export const createProject = async (req, res, next) => {
    try {
        const project = await service.createProject(req.body, req.files)
        res.status(201).json(project)
    } catch (err) {
        next(err)
    }
}

export const getProjects = async (req, res, next) => {
    try {
        const projects = await service.getProjects()
        res.json(projects)
    } catch (err) {
        next(err)
    }
}

export const getProjectById = async (req, res, next) => {
    try {
        const project = await service.getProjectById(req.params.id)
        res.json(project)
    } catch (err) {
        next(err)
    }
}

export const updateProject = async (req, res, next) => {
    try {
        const project = await service.updateProject(req.params.id, req.body)
        res.json(project)
    } catch (err) {
        next(err)
    }
}

export const deleteProject = async (req, res, next) => {
    try {
        await service.deleteProject(req.params.id)
        res.json({ message: 'Project deleted successfully' })
    } catch (err) {
        next(err)
    }
}