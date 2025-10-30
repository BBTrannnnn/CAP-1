import express from 'express';
import {
  // Habit
  getUserHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  // Tracking
  trackHabit,

  // History & Stats
  getHabitStats,
  getHabitCalendar,
  getHabitTemplates,
  getTodayOverview,
  getWeeklyReport,
  getHabitInsights,
  updateHabitsOrder,
  getHabitHistory,

  // dashboard
  getAllHabitsHistory,

  // Templates & Suggestions
  createHabitFromTemplate,
  getSurveyQuestions,


  // Sub-tracking
  getHabitSubTrackings,
  updateHabitSubTracking,
  addHabitSubTracking,
  deleteHabitSubTracking,


   // Reminders
  addHabitReminder,
  updateHabitReminder,
  deleteHabitReminder,
  getHabitReminders,
  getTodayReminders,
  // Goals
  addHabitGoal,
  updateHabitGoal,
  completeHabitGoal,
  deleteHabitGoal,
  getHabitGoals,
  getUserGoalsOverview,
  syncHabitGoals
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
// Add sub-tracking entry for habits with quantity
router.post('/:habitId/subtrack', addHabitSubTracking);

// Get sub-tracking entries for a habit
router.get('/:habitId/subtrack', getHabitSubTrackings);
// Update sub-tracking entry
router.put('/:habitId/subtrack/:subId', updateHabitSubTracking);
// Delete sub-tracking entry
router.delete('/:habitId/subtrack/:subId', deleteHabitSubTracking);


// ==================== History & Stats ====================

// Get habit history
router.get('/:habitId/history', getHabitHistory);
// Get habit statistics
router.get('/:habitId/stats', getHabitStats);

// Get habit calendar (30 days tracking)
router.get('/:habitId/calendar', getHabitCalendar);

// ==================== Dashboard - All Habits History ====================
router.get('/history/all', getAllHabitsHistory);


// ==================== Reminders ====================
// Get all reminders for a habit
router.get('/:habitId/reminders', getHabitReminders);
// Add a reminder to a habit
router.post('/:habitId/reminders', addHabitReminder);
// Update a habit reminder
router.put('/:habitId/reminders/:reminderId', updateHabitReminder);
// Delete a habit reminder
router.delete('/:habitId/reminders/:reminderId', deleteHabitReminder);
// Get today's active reminders
router.get('/reminders/today', getTodayReminders);


// ==================== Goals ====================
// Get all goals for a habit
router.get('/:habitId/goals', getHabitGoals);
// Add a goal to a habit
router.post('/:habitId/goals', addHabitGoal);
// Update a habit goal
router.put('/:habitId/goals/:goalId', updateHabitGoal);
// Complete a habit goal
router.post('/:habitId/goals/:goalId/complete', completeHabitGoal);
// Delete a habit goal
router.delete('/:habitId/goals/:goalId', deleteHabitGoal);
// Get user's goals overview
router.get('/goals/overview', getUserGoalsOverview);
// Sync habit goals (e.g., after bulk updates)
router.post('/goals/sync', syncHabitGoals);


// ==================== Templates & Suggestions ====================

// Get habit templates (must be before /:habitId routes)
router.get('/templates', getHabitTemplates);
// Create habit from template
router.post('/templates/:templateId', createHabitFromTemplate);
// Get survey questions for personalized habit suggestions
router.get('/questions', getSurveyQuestions);

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