import { z } from 'zod'

const BOQ_PROJECT_TYPES = [
    'industrial',
    'commercial',
    'residential',
    'infrastructure',
    'electrical',
    'other',
]

export const createBOQRequestSchema = z.object({
    name:             z.string().trim().min(2).max(100),
    company_name:     z.string().trim().min(2).max(200),
    email:            z.string().email().max(254),
    phone:            z.string().trim().min(10).max(30),

    project_name:     z.string().trim().min(2).max(200),
    project_location: z.string().trim().min(2).max(300),
    project_type:     z.enum(BOQ_PROJECT_TYPES),

    additional_requirements: z.string().trim().max(10000).optional(),
})

export const updateBOQRequestSchema = z.object({
    status: z.enum(['pending', 'contacted', 'in_progress', 'completed', 'closed', 'rejected']).optional(),
    name:             z.string().trim().min(2).max(100).optional(),
    company_name:     z.string().trim().min(2).max(200).optional(),
    email:            z.string().email().max(254).optional(),
    phone:            z.string().trim().min(10).max(30).optional(),
    project_name:     z.string().trim().min(2).max(200).optional(),
    project_location: z.string().trim().min(2).max(300).optional(),
    project_type:     z.enum(BOQ_PROJECT_TYPES).optional(),
    additional_requirements: z.string().trim().max(10000).optional(),
})

export { BOQ_PROJECT_TYPES }
