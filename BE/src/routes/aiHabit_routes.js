import { getHabitRecommendations } from "../controllers/aiHabit_controller.js";
import express from 'express';
import authenticateToken from "../../middlewares/auth.js";
const router = express.Router();
router.use(authenticateToken); 

// AI-based Habit Recommendations
router.post('/recommend', getHabitRecommendations);
export default router;