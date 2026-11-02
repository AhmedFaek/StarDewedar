import express from 'express'
import * as controller from './attachment.controller.js'
import auth from '../../middleware/auth.middleware.js'
import { validateUuidParam } from '../../middleware/validateUuid.middleware.js'

const router = express.Router()

router.get('/:id', auth, validateUuidParam(), controller.getAttachment)
router.get('/:id/download', auth, validateUuidParam(), controller.downloadAttachment)

export default router
