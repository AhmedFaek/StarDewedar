import { Router } from 'express';
import { getSitemap } from './sitemap.controller.js';

const router = Router();

router.get('/', getSitemap);

export default router;
