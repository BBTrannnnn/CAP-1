import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import requireAdmin from '../../middlewares/requireAdmin.js';
import { listSleepContent, getSleepContent, toggleFavorite, listFavorites, createSleepContent, updateSleepContent, deleteSleepContent, recordPlay } from '../controllers/SleepContent_controller.js';

const router = express.Router();

// Public list & detail
// Public list & detail
router.get('/', listSleepContent);
router.get('/favorites', authenticateToken, listFavorites);
router.get('/:idOrSlug', getSleepContent);
router.post('/:idOrSlug/favorite', authenticateToken, toggleFavorite);

// Record play (public, but increments counter; if logged in, updates history)
router.post('/:idOrSlug/play', authenticateToken, recordPlay);

// Admin management
router.post('/', authenticateToken, requireAdmin, createSleepContent);
router.put('/:id', authenticateToken, requireAdmin, updateSleepContent);
router.delete('/:id', authenticateToken, requireAdmin, deleteSleepContent);

export default router;
