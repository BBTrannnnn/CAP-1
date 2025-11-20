import cron from 'node-cron';
import {HabitReminder} from '../models/Habit.js';
import pushService from './pushNotificationService.js';

class ReminderScheduler {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  // Khởi động scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️  Reminder Scheduler already running');
      return;
    }

    console.log('🔔 Starting Reminder Scheduler...');
    this.isRunning = true;
    
    // Chạy mỗi phút để check reminders
    // Format: '* * * * *' = phút giờ ngày tháng thứ
    this.job = cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh" // Đổi timezone phù hợp với bạn
    });

    console.log('✅ Reminder Scheduler started successfully (runs every minute)');
    
    // Chạy ngay 1 lần khi start (sau 2 giây)
    setTimeout(() => this.checkAndSendReminders(), 2000);
  }

  // Dừng scheduler
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log('🛑 Reminder Scheduler stopped');
    }
  }

  // Hàm chính: Kiểm tra và gửi reminders
  async checkAndSendReminders() {
    try {
      const now = new Date();
      
      // Lấy thời gian hiện tại theo format HH:MM
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Lấy ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
      const currentDay = now.getDay();

      console.log(`\n⏰ [${new Date().toISOString()}]`);
      console.log(`   Checking reminders for: ${currentTime} (Day ${currentDay})`);

      // Tìm tất cả reminders phù hợp với thời điểm hiện tại
      const reminders = await HabitReminder.find({
        isActive: true,
        time: currentTime,
        $or: [
          { days: { $size: 0 } },           // days = [] => mọi ngày
          { days: { $in: [currentDay] } }   // days chứa ngày hôm nay
        ]
      }).populate('habitId', 'name icon color');

      if (reminders.length === 0) {
        console.log('   📭 No reminders scheduled for this time');
        return;
      }

      console.log(`   📨 Found ${reminders.length} reminder(s) to send:`);
      
      let sentCount = 0;
      let failedCount = 0;

      // Gửi từng reminder
      for (const reminder of reminders) {
        // Kiểm tra habit còn tồn tại không
        if (!reminder.habitId) {
          console.log(`      ⚠️  Reminder ${reminder._id}: Habit not found (may be deleted)`);
          failedCount++;
          continue;
        }

        console.log(`      📤 Sending to user ${reminder.userId}:`);
        console.log(`         Habit: ${reminder.habitId.name}`);
        console.log(`         Message: ${reminder.message}`);
        
        // Gửi push notification
        const result = await pushService.sendToUser(reminder.userId, {
          title: reminder.habitId.name,
          message: reminder.message,
          soundEnabled: reminder.soundEnabled,
          vibrationEnabled: reminder.vibrationEnabled,
          type: 'HABIT_REMINDER',
          habitId: reminder.habitId._id,
          reminderId: reminder._id,
          habitIcon: reminder.habitId.icon,
          habitColor: reminder.habitId.color
        });

        if (result.success) {
          sentCount++;
          console.log(`         ✅ Sent successfully`);
        } else {
          failedCount++;
          console.log(`         ❌ Failed: ${result.error || result.message}`);
        }
      }

      console.log(`   ✅ Batch complete: ${sentCount} sent, ${failedCount} failed\n`);
      
    } catch (error) {
      console.error('   ❌ Scheduler error:', error);
    }
  }

  // Hàm để check status của scheduler
  getStatus() {
    return {
      isRunning: this.isRunning,
      timezone: 'Asia/Ho_Chi_Minh',
      schedule: 'Every minute (* * * * *)'
    };
  }
}

export default new ReminderScheduler();