import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import { listSleepContent, getSleepContent, toggleFavorite, listFavorites, recordPlay } from '../controllers/SleepContent_controller.js';

const router = express.Router();

router.get('/', listSleepContent);
router.get('/favorites', authenticateToken, listFavorites);
router.get('/:idOrSlug', getSleepContent);
router.post('/:idOrSlug/favorite', authenticateToken, toggleFavorite);

router.post('/:idOrSlug/play', authenticateToken, recordPlay);

export default router;
