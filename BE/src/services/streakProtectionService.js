import {Habit , HabitTracking} from '../models/Habit.js';

import User from '../models/User.js';
import pushService from './pushNotificationService.js';
import { updateHabitStats } from'../controllers/Habit_controller.js';

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
          await this.autoProtectStreak(user, habit, today); // ✅ Truyền today
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
  
  // ✅ SỬA HÀM NÀY
  async autoProtectStreak(user, habit, today) {
    try {
      // ✅ Tìm hoặc tạo tracking cho hôm nay
      let tracking = await HabitTracking.findOne({
        userId: user._id,
        habitId: habit._id,
        date: today
      });

      if (!tracking) {
        tracking = new HabitTracking({
          userId: user._id,
          habitId: habit._id,
          date: today,
          status: 'failed',
          isProtected: true, // ✅ Đánh dấu được shield
          notes: 'Auto-protected by shield'
        });
      } else {
        tracking.isProtected = true; // ✅ Đánh dấu được shield
      }

      await tracking.save();

      // Trừ shield
      user.inventory.streakShields -= 1;
      user.itemUsageHistory.push({
        itemType: 'streakShield',
        habitId: habit._id,
        usedAt: new Date(),
        streakSaved: habit.currentStreak,
        autoUsed: true,
        protectedDate: today // ✅ Lưu ngày được bảo vệ
      });
      await user.save();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      habit.streakProtection.isProtected = true;
      habit.streakProtection.protectedUntil = tomorrow;
      habit.streakProtection.protectedBy = 'auto';
      await habit.save();

      // ✅ Tính lại streak
      await updateHabitStats(habit._id, user._id);
      
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
  
  // ✅ SỬA HÀM NÀY
  async useShieldManually(userId, habitId, date) {
    try {
      const user = await User.findById(userId);
      const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
      
      if (!habit) {
        return { success: false, message: 'Habit not found' };
      }
      
      if (user.inventory.streakShields < 1) {
        return { 
          success: false, 
          message: 'Không có Shield. Hoàn thành thêm goals để kiếm Shield!' 
        };
      }

      // ✅ Parse date (default = today)
      let targetDate;
      if (date) {
        const parts = date.split('-');
        targetDate = new Date(Date.UTC(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          0, 0, 0, 0
        ));
      } else {
        const now = new Date();
        targetDate = new Date(Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0, 0, 0, 0
        ));
      }

      // ✅ Kiểm tra không shield ngày tương lai
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (targetDate > today) {
        return { 
          success: false, 
          message: 'Không thể shield ngày trong tương lai' 
        };
      }

      // ✅ Tìm hoặc tạo tracking
      let tracking = await HabitTracking.findOne({
        userId,
        habitId,
        date: targetDate
      });

      if (!tracking) {
        tracking = new HabitTracking({
          userId,
          habitId,
          date: targetDate,
          status: 'failed',
          isProtected: true,
          notes: 'Protected by shield'
        });
      } else {
        if (tracking.status === 'completed') {
          return { 
            success: false, 
            message: 'Ngày này đã completed, không cần shield' 
          };
        }
        if (tracking.isProtected) {
          return { 
            success: false, 
            message: 'Ngày này đã được shield rồi' 
          };
        }
        tracking.isProtected = true;
      }

      await tracking.save();
      
      // Trừ shield
      user.inventory.streakShields -= 1;
      user.itemUsageHistory.push({
        itemType: 'streakShield',
        habitId: habit._id,
        usedAt: new Date(),
        streakSaved: habit.currentStreak,
        autoUsed: false,
        protectedDate: targetDate // ✅ Lưu ngày được bảo vệ
      });
      await user.save();
      
      const tomorrow = new Date(targetDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      habit.streakProtection.isProtected = true;
      habit.streakProtection.protectedUntil = tomorrow;
      habit.streakProtection.protectedBy = 'manual';
      habit.streakProtection.warningSent = false;
      await habit.save();

      // ✅ Tính lại streak
      await updateHabitStats(habitId, userId);
      
      return {
        success: true,
        message: `🛡️ Shield đã kích hoạt! Ngày ${targetDate.toISOString().split('T')[0]} được bảo vệ`,
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

  // ✅ THÊM HÀM TEST
  async testShieldScenario() {
    try {
      console.log('\n🧪 [TEST] Starting shield test scenario...\n');

      // Test data
      const testUserId = '673ad56e01e20c1479073be2'; // Thay bằng userId thật
      const testHabitId = '692a873582d5d5eddf1ab07d'; // Thay bằng habitId thật

      // Scenario: Tracking 24,25,26 -> Shield 27 -> Tracking 28,29
      console.log('📝 Scenario: Track 24,25,26 → Shield 27 → Track 28,29');
      console.log('Expected: Streak = 6\n');

      // Tìm user và habit
      const user = await User.findById(testUserId);
      const habit = await Habit.findById(testHabitId);

      if (!user || !habit) {
        console.log('❌ User or Habit not found');
        return;
      }

      console.log(`User: ${user.name}`);
      console.log(`Habit: ${habit.name}`);
      console.log(`Current shields: ${user.inventory.streakShields}\n`);

      // Test: Shield ngày 27
      console.log('🛡️  Testing shield for 2025-11-27...');
      const result = await this.useShieldManually(testUserId, testHabitId, '2025-11-27');
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`   Current streak: ${result.habit.currentStreak}`);
        console.log(`   Remaining shields: ${result.remainingShields}\n`);
      } else {
        console.log(`❌ ${result.message}\n`);
      }

      // Kiểm tra tracking
      const tracking = await HabitTracking.findOne({
        userId: testUserId,
        habitId: testHabitId,
        date: new Date('2025-11-27T00:00:00.000Z')
      });

      console.log('📊 Tracking status for 2025-11-27:');
      console.log(`   Status: ${tracking?.status || 'N/A'}`);
      console.log(`   isProtected: ${tracking?.isProtected || false}`);
      console.log(`   Notes: ${tracking?.notes || 'N/A'}\n`);

      // Tính lại stats
      console.log('🔄 Recalculating stats...');
      await updateHabitStats(testHabitId, testUserId);

      const updatedHabit = await Habit.findById(testHabitId);
      console.log(`✅ Final streak: ${updatedHabit.currentStreak}`);
      console.log(`   Longest streak: ${updatedHabit.longestStreak}\n`);

    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
}

export default new StreakProtectionService();