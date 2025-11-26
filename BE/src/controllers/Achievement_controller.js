import achievementService from '../services/achievementService.js';
import asyncHandler from 'express-async-handler';
import UserAchievement from '../models/UserAchievement.js';


const getMyAchievements = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await achievementService.getUserAchievements(userId);
  
  res.json({
    success: true,
    ...result
  });
});

const getAvailableAchievements = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitId } = req.query;
  
  const available = await achievementService.getAvailableAchievements(userId, habitId);
  
  res.json({
    success: true,
    available,
    total: available.length
  });
});

const getHabitAchievements = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitId } = req.params;
  
  if (!habitId) {
    return res.status(400).json({
      success: false,
      message: 'habitId is required'
    });
  }
  
  const achievements = await UserAchievement.find({ userId, habitId })
    .sort({ unlockedAt: -1 });
  
  res.json({
    success: true,
    achievements,
    total: achievements.length
  });
});

export { getMyAchievements, getAvailableAchievements, getHabitAchievements };