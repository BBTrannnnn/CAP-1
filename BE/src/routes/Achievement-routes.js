import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import {
  getMyAchievements,
  getAvailableAchievements,
  getHabitAchievements
} from '../controllers/Achievement_controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/',  getMyAchievements);
router.get('/habit/:habitId', getHabitAchievements);
router.get('/available',  getAvailableAchievements);

export default router;