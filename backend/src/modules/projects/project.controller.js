import * as service from './project.service.js'
import { getPaginationParams } from '../../utils/pagination.js'

export const createProject = async (req, res) => {
    try {
        const data = req.body
        const files = req.files

        const project = await service.createProject(data, files)

        return res.status(201).json(project)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Server error' })
    }
}
// Public: budget is stripped from the response
export const getProjects = async (req, res, next) => {
    try {
        const { take, skip } = getPaginationParams(req.query)
        const projects = await service.getProjects({ take, skip })
        const sanitized = projects.map(({ budget, ...rest }) => rest)
        res.json(sanitized)
    } catch (err) {
        next(err)
    }
}

// Public: budget is stripped from the response
export const getProjectById = async (req, res, next) => {
    try {
        const project = await service.getProjectById(req.params.id)
        if (!project) return res.status(404).json({ message: 'Project not found' })
        const { budget, ...rest } = project
        res.json(rest)
    } catch (err) {
        next(err)
    }
}

// Admin-only: returns the real budget
export const getProjectsAdmin = async (req, res, next) => {
    try {
        const { take, skip } = getPaginationParams(req.query)
        const projects = await service.getProjects({ take, skip })
        res.json(projects)
    } catch (err) {
        next(err)
    }
}

// Admin-only: returns the real budget
export const getProjectByIdAdmin = async (req, res, next) => {
    try {
        const project = await service.getProjectById(req.params.id)
        if (!project) return res.status(404).json({ message: 'Project not found' })
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