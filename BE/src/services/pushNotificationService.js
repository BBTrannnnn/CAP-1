import admin from '../config/firebase.js';
import User from '../models/User.js';

class PushNotificationService {
  // Hàm chính để gửi notification cho 1 user
  async sendToUser(userId, notification) {
    try {
      // Lấy tất cả FCM tokens của user
      const user = await User.findById(userId);
      
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`⚠️  User ${userId}: No FCM tokens registered`);
        return { success: false, message: 'No devices registered' };
      }

      const tokens = user.fcmTokens.map(t => t.token);
      
      // Tạo message theo format của Firebase
      const message = {
        notification: {
          title: notification.title || 'Habit Reminder',
          body: notification.message || 'Time to complete your habit!'
        },
        data: {
          type: notification.type || 'HABIT_REMINDER',
          habitId: notification.habitId?.toString() || '',
          reminderId: notification.reminderId?.toString() || '',
          habitIcon: notification.habitIcon || '',
          habitColor: notification.habitColor || '',
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: notification.soundEnabled ? 'default' : undefined,
            channelId: 'habit_reminders',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.soundEnabled ? 'default' : undefined,
              badge: 1
            }
          }
        },
        tokens: tokens
      };

      // Gửi notification qua Firebase
      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`✅ Notification sent to user ${userId}: ${response.successCount}/${tokens.length} devices`);

      // Xóa tokens không hợp lệ (nếu có)
      if (response.failureCount > 0) {
        await this.cleanupInvalidTokens(userId, response, tokens);
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
      
    } catch (error) {
      console.error(`❌ Error sending notification to user ${userId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Hàm để xóa các token không hợp lệ
  async cleanupInvalidTokens(userId, response, tokens) {
    const failedTokens = [];
    
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        
        // Chỉ xóa nếu token thật sự invalid
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          failedTokens.push(tokens[idx]);
        }
      }
    });

    if (failedTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: { $in: failedTokens } } }
      });
      
      console.log(`🧹 Cleaned ${failedTokens.length} invalid tokens for user ${userId}`);
    }
  }

  // Hàm test để gửi thử notification
  async sendTestNotification(userId) {
    return await this.sendToUser(userId, {
      title: '🎉 Test Notification',
      message: 'Push notification system is working perfectly!',
      soundEnabled: true,
      type: 'TEST'
    });
  }
}

export default new PushNotificationService();