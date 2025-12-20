
import UserAchievement from '../models/UserAchievement.js';
import User from '../models/User.js';
import { Habit } from '../models/Habit.js';
import { ACHIEVEMENTS } from '../config/achievements.js';
import pushService from './pushNotificationService.js';

class AchievementService {
  
  async checkAndUnlockAchievements(habitId, userId) {
    try {
      const habit = await Habit.findById(habitId);
      if (!habit) return [];

      const newAchievements = [];
      const existingAchievements = await UserAchievement.find({ userId })
        .select('achievementId habitId');

      const unlockedGlobalIds = new Set(
        existingAchievements.map(a => a.achievementId)
      );

      console.log(`🔒 User đã unlock ${unlockedGlobalIds.size} achievements (global)`);
      for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (unlockedGlobalIds.has(achievement.id)) {
          console.log(`⏭️  Skip "${achievement.title}" - Đã unlock trước đó`);
          continue;
        }
        if (!achievement.check(habit)) {
          continue;
        }

        console.log(`🎉 UNLOCK: "${achievement.title}" cho habit "${habit.name}"`);
        const newAch = await UserAchievement.create({
          userId,
          achievementId: achievement.id,
          habitId, 
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          rewards: achievement.rewards,
          unlockedAt: new Date()
        });

        if (achievement.rewards) {
          await this.addRewardsToInventory(userId, achievement.rewards);
        }

        await this.sendAchievementNotification(userId, habit, newAch);

        newAchievements.push(newAch);

        unlockedGlobalIds.add(achievement.id);
      }

      console.log(`✅ Unlocked ${newAchievements.length} new achievements`);
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

      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(
          userId,
          { $inc: updateFields },
          { new: true }
        );
        console.log('💰 Rewards added:', updateFields);
      }
      
    } catch (error) {
      console.error('❌ Add rewards error:', error);
    }
  }

  async sendAchievementNotification(userId, habit, achievement) {
    try {
      const rewardsText = [];
      if (achievement.rewards?.streakShields) {
        rewardsText.push(`${achievement.rewards.streakShields} Shield`);
      }
      if (achievement.rewards?.freezeTokens) {
        rewardsText.push(`${achievement.rewards.freezeTokens} Freeze Token`);
      }
      if (achievement.rewards?.reviveTokens) {
        rewardsText.push(`${achievement.rewards.reviveTokens} Revive Token`);
      }

      await pushService.sendToUser(userId, {
        title: `🎉 Achievement Unlocked!`,
        message: `${achievement.icon} ${achievement.title}${rewardsText.length > 0 ? ` - Rewards: ${rewardsText.join(', ')}` : ''}`,
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

  async getUserAchievements(userId, habitId = null) {
    try {
      const query = { userId };
      if (habitId) {
        query.habitId = habitId; 
      }
      
      const achievements = await UserAchievement.find(query)
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
        recentUnlocks: achievements.slice(0, 5),
        byHabit: this.groupAchievementsByHabit(achievements)
      };
      
    } catch (error) {
      console.error('Get user achievements error:', error);
      return { total: 0, achievements: {}, recentUnlocks: [], byHabit: {} };
    }
  }

  groupAchievementsByHabit(achievements) {
    const grouped = {};
    achievements.forEach(ach => {
      if (ach.habitId) {
        const habitKey = ach.habitId._id?.toString() || ach.habitId.toString();
        if (!grouped[habitKey]) {
          grouped[habitKey] = {
            habit: ach.habitId,
            achievements: []
          };
        }
        grouped[habitKey].achievements.push(ach);
      }
    });
    return grouped;
  }
  async getAvailableAchievements(userId, habitId = null) {
    try {
      // Lấy TẤT CẢ achievements đã unlock (global)
      const unlocked = await UserAchievement.find({ userId })
        .select('achievementId');
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
          progress: habit ? this.calculateProgress(ach, habit) : 0,
          isUnlockable: habit ? ach.check(habit) : false
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
    if (achievement.id === 'perfect_week') {
      return 0;
    }
    return 0;
  }
  async getAchievementStats(userId) {
    try {
      const unlocked = await UserAchievement.find({ userId });
      const total = Object.keys(ACHIEVEMENTS).length;

      const rarityCount = {
        legendary: unlocked.filter(a => a.rarity === 'legendary').length,
        epic: unlocked.filter(a => a.rarity === 'epic').length,
        rare: unlocked.filter(a => a.rarity === 'rare').length,
        common: unlocked.filter(a => a.rarity === 'common').length
      };

      return {
        totalUnlocked: unlocked.length,
        totalAvailable: total,
        percentage: Math.round((unlocked.length / total) * 100),
        byRarity: rarityCount,
        recentUnlocks: unlocked
          .sort((a, b) => b.unlockedAt - a.unlockedAt)
          .slice(0, 5)
      };
      
    } catch (error) {
      console.error('Get achievement stats error:', error);
      return null;
    }
  }
}

export default new AchievementService();