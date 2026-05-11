import express from 'express'
import * as controller from './user.controller.js'
import auth from '../../middleware/auth.middleware.js'

const router = express.Router()

// All routes require a valid access token
router.use(auth)

// ── Profile ──────────────────────────────────────────────────────────────────

// GET  /api/users/me  → return the authenticated user's profile (safe fields)
router.get('/me', controller.getMe)

// ── Saved Products (Favourites) ───────────────────────────────────────────────

// GET  /api/users/me/saved-products              → list all saved products
router.get('/me/saved-products', controller.getMySavedProducts)

// GET  /api/users/me/saved-products/:productId/check → is this product saved?
router.get('/me/saved-products/:productId/check', controller.checkSaved)

// POST /api/users/me/saved-products/:productId   → save a product
router.post('/me/saved-products/:productId', controller.saveProduct)

// DELETE /api/users/me/saved-products/:productId → unsave a product
router.delete('/me/saved-products/:productId', controller.unsaveProduct)

// ── My Requests ───────────────────────────────────────────────────────────────

// GET  /api/users/me/quotes  → list all quote requests submitted by this user's email
router.get('/me/quotes', controller.getMyQuotes)

// GET  /api/users/me/visits  → list all visit requests submitted by this user's email
router.get('/me/visits', controller.getMyVisits)

export default router
