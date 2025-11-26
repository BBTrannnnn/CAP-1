import UserAchievement from '../models/UserAchievement.js';
import User from '../models/User.js';
import {Habit} from '../models/Habit.js';
import { ACHIEVEMENTS } from '../config/achievements.js';
import pushService from './pushNotificationService.js';

class AchievementService {
  
// services/achievementService.js

async checkAndUnlockAchievements(habitId, userId) {
  try {
    const habit = await Habit.findById(habitId);
    if (!habit) return [];

    const newAchievements = [];

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!achievement.check(habit)) continue;

      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement.id,
        habitId
      });

      if (existing) continue;

      const newAch = await UserAchievement.create({
        userId,
        achievementId: achievement.id,
        habitId,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        rewards: achievement.rewards
      });

      if (achievement.rewards) {
        await this.addRewardsToInventory(userId, achievement.rewards);
      }

      await this.sendAchievementNotification(userId, habit, newAch);

      newAchievements.push(newAch);
    }

    return newAchievements;
    
  } catch (error) {
    console.error('❌ Check achievements error:', error);
    return [];
  }
}

async addRewardsToInventory(userId, rewards) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const updateFields = {};
    
    if (rewards.streakShields) {
      updateFields['inventory.streakShields'] = rewards.streakShields;
    }
    if (rewards.freezeTokens) {
      updateFields['inventory.freezeTokens'] = rewards.freezeTokens;
    }
    if (rewards.reviveTokens) {
      updateFields['inventory.reviveTokens'] = rewards.reviveTokens;
    }

    await User.findByIdAndUpdate(
      userId,
      { $inc: updateFields },
      { new: true }
    );
    
  } catch (error) {
    console.error('❌ Add rewards error:', error);
  }
}

  async sendAchievementNotification(userId, habit, achievement) {
    try {
      const rewardsText = [];
      if (achievement.rewards.streakShields) {
        rewardsText.push(`${achievement.rewards.streakShields} Shield`);
      }
      if (achievement.rewards.freezeTokens) {
        rewardsText.push(`${achievement.rewards.freezeTokens} Freeze Token`);
      }
      if (achievement.rewards.reviveTokens) {
        rewardsText.push(`${achievement.rewards.reviveTokens} Revive Token`);
      }

      await pushService.sendToUser(userId, {
        title: `🎉 Achievement Unlocked!`,
        message: `${achievement.icon} ${achievement.title} - Rewards: ${rewardsText.join(', ')}`,
        type: 'ACHIEVEMENT_UNLOCKED',
        soundEnabled: true,
        habitId: habit._id,
        data: {
          achievementId: achievement.achievementId,
          habitName: habit.name,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          rewards: achievement.rewards
        }
      });
      
    } catch (error) {
      console.error('Send achievement notification error:', error);
    }
  }

  async getUserAchievements(userId) {
    try {
      const achievements = await UserAchievement.find({ userId })
        .populate('habitId', 'name icon color')
        .sort({ unlockedAt: -1 });

      const grouped = {
        legendary: achievements.filter(a => a.rarity === 'legendary'),
        epic: achievements.filter(a => a.rarity === 'epic'),
        rare: achievements.filter(a => a.rarity === 'rare'),
        common: achievements.filter(a => a.rarity === 'common')
      };

      return {
        total: achievements.length,
        achievements: grouped,
        recentUnlocks: achievements.slice(0, 5)
      };
      
    } catch (error) {
      console.error('Get user achievements error:', error);
      return { total: 0, achievements: {}, recentUnlocks: [] };
    }
  }

  async getAvailableAchievements(userId, habitId = null) {
    try {
      const query = { userId };
      if (habitId) query.habitId = habitId;
      
      const unlocked = await UserAchievement.find(query).select('achievementId');
      const unlockedIds = new Set(unlocked.map(a => a.achievementId));

      const habit = habitId ? await Habit.findById(habitId) : null;

      const available = Object.values(ACHIEVEMENTS)
        .filter(ach => !unlockedIds.has(ach.id))
        .map(ach => ({
          id: ach.id,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          rarity: ach.rarity,
          rewards: ach.rewards,
          progress: habit ? this.calculateProgress(ach, habit) : 0
        }));

      return available;
      
    } catch (error) {
      console.error('Get available achievements error:', error);
      return [];
    }
  }

  calculateProgress(achievement, habit) {
    if (achievement.id.startsWith('streak_')) {
      const target = parseInt(achievement.id.split('_')[1]);
      return Math.min(100, Math.round((habit.currentStreak / target) * 100));
    }
    if (achievement.id.startsWith('total_')) {
      const target = parseInt(achievement.id.split('_')[1]);
      return Math.min(100, Math.round((habit.totalCompletions / target) * 100));
    }
    return 0;
  }
}

export default new AchievementService();