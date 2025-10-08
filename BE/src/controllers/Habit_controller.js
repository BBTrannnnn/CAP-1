import asyncHandler from 'express-async-handler';
import { Habit, HabitTracking, HabitTemplate } from '../models/Habit.js';
import { UserAnalysis } from '../models/Survey.js';

// ==================== CRUD Operations ====================

// @desc    Get all habits for user
// @route   GET /api/habits
// @access  Private
const getUserHabits = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const habits = await Habit.find({ userId, isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .populate('suggestionId');
  
  // Calculate today's progress for each habit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const habitsWithProgress = await Promise.all(habits.map(async (habit) => {
    const todayTracking = await HabitTracking.findOne({
      userId,
      habitId: habit._id,
      date: today
    });
    
    return {
      ...habit.toObject(),
      todayStatus: todayTracking ? todayTracking.status : 'pending',
      todayCompleted: todayTracking ? todayTracking.status === 'completed' : false
    };
  }));
  
  res.json({
    success: true,
    habits: habitsWithProgress
  });
});

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
const createHabit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    description,
    icon,
    color,
    frequency,
    customFrequency,
    specificDays,
    category,
    habitType,
    targetDays,
    reminders,
    motivation,
    reward,
    isFromSuggestion,
    suggestionId
  } = req.body;

  // Validate required fields
  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name and category are required'
    });
  }

  // Get user's habit count for ordering
  const habitCount = await Habit.countDocuments({ userId, isActive: true });

  const newHabit = new Habit({
    userId,
    name,
    description,
    icon: icon || '🎯',
    color: color || '#3B82F6',
    frequency: frequency || 'daily',
    customFrequency,
    specificDays,
    category,
    habitType: habitType || 'build',
    targetDays: targetDays || 21,
    reminders: reminders || [],
    motivation,
    reward,
    isFromSuggestion: isFromSuggestion || false,
    suggestionId,
    order: habitCount
  });

  await newHabit.save();

  // If created from template, increment usage count
  if (suggestionId) {
    await HabitTemplate.findByIdAndUpdate(suggestionId, {
      $inc: { usageCount: 1 }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Habit created successfully',
    habit: newHabit
  });
});

// @desc    Update habit
// @route   PUT /api/habits/:habitId
// @access  Private
const updateHabit = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  const allowedUpdates = [
    'name', 'description', 'icon', 'color', 'frequency', 'customFrequency',
    'specificDays', 'category', 'habitType', 'targetDays', 'reminders',
    'motivation', 'reward', 'isActive', 'order'
  ];

  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedHabit = await Habit.findByIdAndUpdate(
    habitId,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Habit updated successfully',
    habit: updatedHabit
  });
});

// @desc    Delete habit (soft delete)
// @route   DELETE /api/habits/:habitId
// @access  Private
const deleteHabit = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  await Habit.findByIdAndUpdate(habitId, { isActive: false });

  res.json({
    success: true,
    message: 'Habit deleted successfully'
  });
});

// ==================== Tracking Operations ====================

// @desc    Track habit completion
// @route   POST /api/habits/:habitId/track
// @access  Private
const trackHabit = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { status, date, notes, mood } = req.body; // status: 'completed', 'skipped', 'failed'

  // Validate habit exists and belongs to user
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Parse date or use today
  const trackingDate = date ? new Date(date) : new Date();
  trackingDate.setHours(0, 0, 0, 0);

  try {
    // Upsert tracking record
    const tracking = await HabitTracking.findOneAndUpdate(
      { userId, habitId, date: trackingDate },
      {
        status,
        completedAt: status === 'completed' ? new Date() : null,
        notes: notes || '',
        mood
      },
      { upsert: true, new: true }
    );

    // Update habit statistics
    await updateHabitStats(habitId, userId);

    res.json({
      success: true,
      message: `Habit ${status} successfully`,
      tracking
    });

  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - try to update existing record
      const existingTracking = await HabitTracking.findOneAndUpdate(
        { userId, habitId, date: trackingDate },
        { status, notes, mood, completedAt: status === 'completed' ? new Date() : null },
        { new: true }
      );

      await updateHabitStats(habitId, userId);

      return res.json({
        success: true,
        message: `Habit ${status} updated successfully`,
        tracking: existingTracking
      });
    }
    throw error;
  }
});

// @desc    Get habit statistics
// @route   GET /api/habits/:habitId/stats
// @access  Private
const getHabitStats = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Get tracking history
  const trackingHistory = await HabitTracking.find({ userId, habitId })
    .sort({ date: -1 })
    .limit(30);

  // Calculate weekly completion rate
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyTracking = await HabitTracking.find({
    userId,
    habitId,
    date: { $gte: weekAgo }
  });

  const weeklyCompletions = weeklyTracking.filter(t => t.status === 'completed').length;
  const weeklyCompletionRate = weeklyTracking.length > 0 ? (weeklyCompletions / weeklyTracking.length) * 100 : 0;

  res.json({
    success: true,
    habit: {
      ...habit.toObject(),
      weeklyCompletionRate: Math.round(weeklyCompletionRate)
    },
    trackingHistory
  });
});

// @desc    Get habit calendar (30 days tracking)
// @route   GET /api/habits/:habitId/calendar
// @access  Private
const getHabitCalendar = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { days = 30 } = req.query;
  
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }
  
  // Get tracking data for specified days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);
  
  const trackingData = await HabitTracking.find({
    userId,
    habitId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
  
  // Generate calendar array
  const calendar = [];
  for (let i = parseInt(days) - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayTracking = trackingData.find(t => 
      t.date.getTime() === date.getTime()
    );
    
    calendar.push({
      date: date.toISOString().split('T')[0],
      status: dayTracking ? dayTracking.status : 'pending',
      notes: dayTracking?.notes || '',
      mood: dayTracking?.mood || null,
      completedAt: dayTracking?.completedAt || null
    });
  }
  
  res.json({
    success: true,
    habit: {
      id: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color
    },
    calendar
  });
});

// ==================== Templates & Suggestions ====================

// @desc    Get habit templates
// @route   GET /api/habits/templates/list
// @access  Private
const getHabitTemplates = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { category, difficulty } = req.query;

  // Get user analysis to suggest relevant templates
  const userAnalysis = await UserAnalysis.findOne({ userId });
  
  let query = {};
  
  if (category) {
    query.category = category;
  } else if (userAnalysis) {
    // Suggest templates based on user's top categories
    const topCategories = Object.entries(userAnalysis.categoryScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    query.category = { $in: topCategories };
  }
  
  if (difficulty) {
    query.difficulty = difficulty;
  }

  const templates = await HabitTemplate.find(query)
    .sort({ isPopular: -1, usageCount: -1 })
    .limit(20);

  res.json({
    success: true,
    templates,
    userAnalysis: userAnalysis ? {
      topCategories: Object.entries(userAnalysis.categoryScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => ({ category, score }))
    } : null
  });
});

// ==================== Dashboard & Reports ====================

// @desc    Get today's habits overview
// @route   GET /api/habits/overview/today
// @access  Private
const getTodayOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get active habits
  const habits = await Habit.find({ userId, isActive: true });
  
  // Get today's tracking
  const todayTracking = await HabitTracking.find({
    userId,
    date: today
  });

  const completedHabits = todayTracking.filter(t => t.status === 'completed').length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Get current streaks
  const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
    const todayStatus = todayTracking.find(t => t.habitId.equals(habit._id));
    return {
      id: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      currentStreak: habit.currentStreak,
      todayCompleted: todayStatus ? todayStatus.status === 'completed' : false
    };
  }));

  res.json({
    success: true,
    overview: {
      totalHabits,
      completedToday: completedHabits,
      completionRate,
      habitsWithStreaks
    }
  });
});

// @desc    Get weekly report
// @route   GET /api/habits/reports/weekly
// @access  Private
const getWeeklyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { weekOffset = 0 } = req.query; // 0 = current week, 1 = last week, etc.
  
  // Calculate week range
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Get active habits
  const habits = await Habit.find({ userId, isActive: true });
  
  // Get tracking data for the week
  const weeklyTracking = await HabitTracking.find({
    userId,
    date: { $gte: startOfWeek, $lte: endOfWeek }
  });
  
  // Calculate stats for each habit
  const habitStats = habits.map(habit => {
    const habitTrackings = weeklyTracking.filter(t => 
      t.habitId.equals(habit._id)
    );
    
    const completed = habitTrackings.filter(t => t.status === 'completed').length;
    const total = 7; // days in week
    const completionRate = Math.round((completed / total) * 100);
    
    return {
      habitId: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      completed,
      total,
      completionRate,
      trackings: habitTrackings.map(t => ({
        date: t.date.toISOString().split('T')[0],
        status: t.status,
        mood: t.mood
      }))
    };
  });
  
  // Overall week stats
  const totalCompletions = weeklyTracking.filter(t => t.status === 'completed').length;
  const totalPossible = habits.length * 7;
  const overallCompletionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
  
  res.json({
    success: true,
    report: {
      week: {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
      },
      overallStats: {
        totalCompletions,
        totalPossible,
        completionRate: overallCompletionRate,
        activeHabits: habits.length
      },
      habitStats
    }
  });
});

// @desc    Get habit insights and recommendations
// @route   GET /api/habits/insights/personal
// @access  Private
const getHabitInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    const habits = await Habit.find({ userId, isActive: true });
    
    // Get recent tracking data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTracking = await HabitTracking.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });
    
    const insights = [];
    
    for (const habit of habits) {
      const habitTrackings = recentTracking.filter(t => 
        t.habitId.equals(habit._id)
      );
      
      // Calculate streaks
      const completedDays = habitTrackings
        .filter(t => t.status === 'completed')
        .sort((a, b) => b.date - a.date);
      
      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      for (const tracking of completedDays) {
        const trackingDate = new Date(tracking.date);
        trackingDate.setHours(0, 0, 0, 0);
        
        if (trackingDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      // Generate insights
      let insight = '';
      let type = 'info';
      
      if (currentStreak >= 7) {
        insight = `Tuyệt vời! Bạn đã duy trì thói quen "${habit.name}" được ${currentStreak} ngày liên tiếp.`;
        type = 'celebration';
      } else if (habit.completionRate < 50) {
        insight = `Thói quen "${habit.name}" cần được chú ý hơn. Hãy thử giảm mục tiêu hoặc thay đổi thời gian thực hiện.`;
        type = 'improvement';
      } else if (habit.completionRate >= 80) {
        insight = `Bạn đang làm rất tốt với thói quen "${habit.name}". Có thể thử thách thức bản thân hơn!`;
        type = 'encouragement';
      }
      
      if (insight) {
        insights.push({
          habitId: habit._id,
          habitName: habit.name,
          type,
          message: insight,
          data: {
            currentStreak,
            completionRate: habit.completionRate,
            totalCompletions: habit.totalCompletions
          }
        });
      }
    }
    
    res.json({
      success: true,
      insights
    });
    
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get habit insights'
    });
  }
});

// @desc    Bulk update habits order
// @route   PUT /api/habits/bulk/reorder
// @access  Private
const updateHabitsOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitOrders } = req.body; // [{ habitId, order }, ...]
  
  if (!Array.isArray(habitOrders)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid habit orders format'
    });
  }
  
  try {
    // Update each habit's order
    const updatePromises = habitOrders.map(({ habitId, order }) =>
      Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { order },
        { new: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Habits order updated successfully'
    });
  } catch (error) {
    console.error('Update habits order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update habits order'
    });
  }
});

// ==================== Helper Functions ====================

// Helper function to update habit statistics
async function updateHabitStats(habitId, userId) {
  const habit = await Habit.findById(habitId);
  if (!habit) return;

  // Get all tracking records for this habit
  const allTracking = await HabitTracking.find({ habitId, userId }).sort({ date: 1 });
  
  const completedDays = allTracking.filter(t => t.status === 'completed');
  const totalCompletions = completedDays.length;
  
  // Calculate current streak
  let currentStreak = 0;
  const sortedTracking = allTracking.sort((a, b) => b.date - a.date);
  
  for (const tracking of sortedTracking) {
    if (tracking.status === 'completed') {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  for (const tracking of allTracking) {
    if (tracking.status === 'completed') {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Calculate completion rate
  const totalDays = allTracking.length;
  const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;
  
  // Update habit
  await Habit.findByIdAndUpdate(habitId, {
    totalCompletions,
    currentStreak,
    longestStreak,
    completionRate,
    lastCompletedDate: completedDays.length > 0 ? completedDays[completedDays.length - 1].date : null
  });
}

export {
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
};