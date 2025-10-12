import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import { listSleepContent, getSleepContent, toggleFavorite, listFavorites } from '../controllers/SleepContent_controller.js';

const router = express.Router();

// Public list & detail
router.get('/', listSleepContent);
router.get('/favorites', authenticateToken, listFavorites);
router.get('/:idOrSlug', getSleepContent);
router.post('/:idOrSlug/favorite', authenticateToken, toggleFavorite);

export default router;
