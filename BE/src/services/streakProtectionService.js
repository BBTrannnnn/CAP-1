import {Habit , HabitTracking} from '../models/Habit.js';

import User from '../models/User.js';
import pushService from './pushNotificationService.js';

class StreakProtectionService {
  
  async checkAllHabitsStreakRisk() {
    try {
      console.log('\n🛡️  [STREAK PROTECTION] Starting daily check...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const users = await User.find({
        'streakProtectionSettings.enabled': true
      }).select('_id inventory streakProtectionSettings');
      
      console.log(`   Found ${users.length} users with protection enabled`);
      
      let totalWarnings = 0;
      let totalAutoProtected = 0;
      
      for (const user of users) {
        const result = await this.checkUserHabits(user, today);
        totalWarnings += result.warnings;
        totalAutoProtected += result.autoProtected;
      }
      
      console.log(`   ✅ Check complete:`);
      console.log(`      - ${totalWarnings} warnings sent`);
      console.log(`      - ${totalAutoProtected} auto-protected\n`);
      
    } catch (error) {
      console.error('❌ Streak protection check error:', error);
    }
  }
  
  async checkUserHabits(user, today) {
    let warnings = 0;
    let autoProtected = 0;
    
    try {
      const habits = await Habit.find({
        userId: user._id,
        isActive: true,
        currentStreak: { $gt: 0 }
      });
      
      if (habits.length === 0) return { warnings, autoProtected };
      
      for (const habit of habits) {
        const todayTracking = await HabitTracking.findOne({
          habitId: habit._id,
          userId: user._id,
          date: today
        });
        
        const isCompleted = todayTracking && todayTracking.status === 'completed';
        
        if (isCompleted) {
          if (habit.streakProtection.warningSent) {
            habit.streakProtection.warningSent = false;
            await habit.save();
          }
          continue;
        }
        
        const alreadyWarned = 
          habit.streakProtection.warningDate?.getTime() === today.getTime() &&
          habit.streakProtection.warningSent;
        
        if (alreadyWarned) continue;
        
        const now = new Date();
        const isProtected = 
          habit.streakProtection.isProtected &&
          habit.streakProtection.protectedUntil > now;
        
        const isFrozen = 
          habit.streakProtection.isFrozen &&
          habit.streakProtection.frozenEndDate > now;
        
        if (isProtected || isFrozen) {
          console.log(`   Habit "${habit.name}" already protected/frozen`);
          continue;
        }
        
        if (
          user.streakProtectionSettings.autoUseShield &&
          habit.currentStreak >= user.streakProtectionSettings.minStreakToAutoProtect &&
          user.inventory.streakShields > 0
        ) {
          await this.autoProtectStreak(user, habit);
          autoProtected++;
          continue;
        }
        
        await this.sendStreakWarning(user, habit);
        warnings++;
        
        habit.streakProtection.warningDate = today;
        habit.streakProtection.warningSent = true;
        await habit.save();
      }
      
    } catch (error) {
      console.error(`Error checking habits for user ${user._id}:`, error);
    }
    
    return { warnings, autoProtected };
  }
  
  async autoProtectStreak(user, habit) {
    try {
      user.inventory.streakShields -= 1;
      user.itemUsageHistory.push({
        itemType: 'streakShield',
        habitId: habit._id,
        usedAt: new Date(),
        streakSaved: habit.currentStreak,
        autoUsed: true
      });
      await user.save();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      habit.streakProtection.isProtected = true;
      habit.streakProtection.protectedUntil = tomorrow;
      habit.streakProtection.protectedBy = 'auto';
      await habit.save();
      
      await pushService.sendToUser(user._id, {
        title: '🛡️ Streak được tự động bảo vệ',
        message: `Habit "${habit.name}" (${habit.currentStreak} ngày) đã được Shield cứu!`,
        type: 'STREAK_AUTO_PROTECTED',
        soundEnabled: true,
        habitId: habit._id,
        data: {
          habitName: habit.name,
          streakSaved: habit.currentStreak,
          remainingShields: user.inventory.streakShields
        }
      });
      
      console.log(`   ✅ Auto-protected: "${habit.name}" (${habit.currentStreak} days)`);
      
    } catch (error) {
      console.error('Auto protect error:', error);
    }
  }
  
  async sendStreakWarning(user, habit) {
    try {
      const hasShield = user.inventory.streakShields > 0;
      
      await pushService.sendToUser(user._id, {
        title: `⚠️ Streak ${habit.currentStreak} ngày sắp mất!`,
        message: `"${habit.name}" chưa hoàn thành hôm nay${hasShield ? '. Dùng Shield để bảo vệ?' : '!'}`,
        type: 'STREAK_BREAK_WARNING',
        soundEnabled: true,
        habitId: habit._id,
        data: {
          habitName: habit.name,
          currentStreak: habit.currentStreak,
          hasShield,
          remainingShields: user.inventory.streakShields,
          actions: hasShield ? [
            { type: 'use_shield', label: 'Dùng Shield 🛡️' },
            { type: 'complete_now', label: 'Hoàn thành ngay' }
          ] : [
            { type: 'complete_now', label: 'Hoàn thành ngay' }
          ]
        }
      });
      
      console.log(`   ⚠️  Warning sent: "${habit.name}" (${habit.currentStreak} days)`);
      
    } catch (error) {
      console.error('Send warning error:', error);
    }
  }
  
  async useShieldManually(userId, habitId) {
    try {
      const user = await User.findById(userId);
      const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
      
      if (!habit) {
        return { success: false, message: 'Habit not found' };
      }
      
      if (habit.currentStreak === 0) {
        return { success: false, message: 'No streak to protect' };
      }
      
      if (user.inventory.streakShields < 1) {
        return { 
          success: false, 
          message: 'Không có Shield. Hoàn thành thêm goals để kiếm Shield!' 
        };
      }
      
      const now = new Date();
      if (habit.streakProtection.isProtected && habit.streakProtection.protectedUntil > now) {
        return { 
          success: false, 
          message: 'Habit này đã được bảo vệ rồi',
          protectedUntil: habit.streakProtection.protectedUntil
        };
      }
      
      user.inventory.streakShields -= 1;
      user.itemUsageHistory.push({
        itemType: 'streakShield',
        habitId: habit._id,
        usedAt: new Date(),
        streakSaved: habit.currentStreak,
        autoUsed: false
      });
      await user.save();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      habit.streakProtection.isProtected = true;
      habit.streakProtection.protectedUntil = tomorrow;
      habit.streakProtection.protectedBy = 'manual';
      habit.streakProtection.warningSent = false;
      await habit.save();
      
      return {
        success: true,
        message: `🛡️ Shield đã kích hoạt! Streak ${habit.currentStreak} ngày được bảo vệ`,
        habit: {
          id: habit._id,
          name: habit.name,
          currentStreak: habit.currentStreak,
          protectedUntil: habit.streakProtection.protectedUntil
        },
        remainingShields: user.inventory.streakShields
      };
      
    } catch (error) {
      console.error('Use shield error:', error);
      return { success: false, message: error.message };
    }
  }
  
  async useFreezeToken(userId, habitId, days) {
    try {
      const user = await User.findById(userId);
      const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
      
      if (!habit) {
        return { success: false, message: 'Habit not found' };
      }
      
      if (habit.currentStreak === 0) {
        return { success: false, message: 'No streak to freeze' };
      }
      
      if (!days || days < 1 || days > 30) {
        return { 
          success: false, 
          message: 'Days must be between 1 and 30' 
        };
      }
      
      if (user.inventory.freezeTokens < 1) {
        return { 
          success: false, 
          message: 'Không có Freeze Token. Hoàn thành thêm goals để kiếm!' 
        };
      }
      
      if (habit.streakProtection.isFrozen) {
        return { 
          success: false, 
          message: 'Habit này đang được đóng băng rồi',
          frozenUntil: habit.streakProtection.frozenEndDate
        };
      }
      
      user.inventory.freezeTokens -= 1;
      user.itemUsageHistory.push({
        itemType: 'freezeToken',
        habitId: habit._id,
        usedAt: new Date(),
        streakSaved: habit.currentStreak,
        autoUsed: false
      });
      await user.save();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);
      endDate.setHours(23, 59, 59, 999);
      
      habit.streakProtection.isFrozen = true;
      habit.streakProtection.frozenStartDate = today;
      habit.streakProtection.frozenEndDate = endDate;
      habit.streakProtection.frozenDaysRemaining = days;
      await habit.save();
      
      return {
        success: true,
        message: `❄️ Streak đã đóng băng ${days} ngày! Không cần track trong thời gian này.`,
        habit: {
          id: habit._id,
          name: habit.name,
          currentStreak: habit.currentStreak,
          frozenUntil: endDate,
          frozenDays: days
        },
        remainingFreezeTokens: user.inventory.freezeTokens
      };
      
    } catch (error) {
      console.error('Use freeze token error:', error);
      return { success: false, message: error.message };
    }
  }
  
  async useReviveToken(userId, habitId) {
    try {
      const user = await User.findById(userId);
      const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
      
      if (!habit) {
        return { success: false, message: 'Habit not found' };
      }
      
      if (habit.currentStreak > 0) {
        return { 
          success: false, 
          message: 'Streak vẫn còn, không cần revive!',
          currentStreak: habit.currentStreak
        };
      }
      
      if (habit.longestStreak === 0) {
        return { 
          success: false, 
          message: 'Chưa có streak nào để revive' 
        };
      }
      
      if (user.inventory.reviveTokens < 1) {
        return { 
          success: false, 
          message: 'Không có Revive Token. Item này rất hiếm, unlock achievements epic để có!' 
        };
      }
      
      const revivedStreak = habit.longestStreak;
      
      user.inventory.reviveTokens -= 1;
      user.itemUsageHistory.push({
        itemType: 'reviveToken',
        habitId: habit._id,
        usedAt: new Date(),
        streakSaved: revivedStreak,
        autoUsed: false
      });
      await user.save();
      
      habit.currentStreak = revivedStreak;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      habit.lastCompletedDate = yesterday;
      
      await habit.save();
      
      await pushService.sendToUser(user._id, {
        title: '💫 Streak đã được hồi sinh!',
        message: `Habit "${habit.name}" - Streak ${revivedStreak} ngày đã quay lại!`,
        type: 'STREAK_REVIVED',
        soundEnabled: true,
        habitId: habit._id,
        data: {
          habitName: habit.name,
          revivedStreak: revivedStreak
        }
      });
      
      return {
        success: true,
        message: `💫 Streak ${revivedStreak} ngày đã được hồi sinh! Tiếp tục cố gắng nào!`,
        habit: {
          id: habit._id,
          name: habit.name,
          currentStreak: revivedStreak,
          longestStreak: habit.longestStreak
        },
        remainingReviveTokens: user.inventory.reviveTokens
      };
      
    } catch (error) {
      console.error('Use revive token error:', error);
      return { success: false, message: error.message };
    }
  }
  
  async checkAndUnfreeze() {
    try {
      const now = new Date();
      const frozenHabits = await Habit.find({
        'streakProtection.isFrozen': true,
        'streakProtection.frozenEndDate': { $lt: now }
      });
      
      for (const habit of frozenHabits) {
        habit.streakProtection.isFrozen = false;
        habit.streakProtection.frozenStartDate = null;
        habit.streakProtection.frozenEndDate = null;
        habit.streakProtection.frozenDaysRemaining = 0;
        await habit.save();
        
        console.log(`✅ Unfroze habit: "${habit.name}"`);
      }
      
      if (frozenHabits.length > 0) {
        console.log(`🔓 Unfroze ${frozenHabits.length} habits`);
      }
      
    } catch (error) {
      console.error('Check unfreeze error:', error);
    }
  }
}

export default new StreakProtectionService();