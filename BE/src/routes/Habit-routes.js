import express from 'express';
import {
  getUserHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  trackHabit,
  getHabitStats,
  getHabitCalendar,
  getHabitTemplates,
  getTodayOverview,
  getWeeklyReport,
  getHabitInsights,
  updateHabitsOrder
} from '../controllers/Habit_controller.js';
import authenticateToken from "../../middlewares/auth.js";

const router = express.Router();
router.use(authenticateToken); // Apply authentication middleware to all routes


// ==================== CRUD Operations ====================

// Get all habits for user
router.get('/', getUserHabits);

// Create new habit
router.post('/', createHabit);

// Update habit
router.put('/:habitId', updateHabit);

// Delete habit (soft delete)
router.delete('/:habitId', deleteHabit);

// ==================== Tracking Operations ====================

// Track habit completion
router.post('/:habitId/track', trackHabit);

// Get habit statistics
router.get('/:habitId/stats', getHabitStats);

// Get habit calendar (30 days tracking)
router.get('/:habitId/calendar', getHabitCalendar);

// ==================== Templates & Suggestions ====================

// Get habit templates (must be before /:habitId routes)
router.get('/templates/list', getHabitTemplates);

// ==================== Dashboard & Reports ====================

// Get today's habits overview
router.get('/overview/today', getTodayOverview);

// Get weekly report
router.get('/reports/weekly', getWeeklyReport);

// Get habit insights and recommendations
router.get('/insights/personal', getHabitInsights);

// ==================== Bulk Operations ====================

// Bulk update habits order
router.put('/bulk/reorder', updateHabitsOrder);

export default router;