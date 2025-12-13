// services/pushNotificationService.js
// ✅ HỖ TRỢ CẢ 2: Expo Push Token + Native FCM Token

import fetch from 'node-fetch'; // npm install node-fetch
import admin from '../config/firebase.js'; // Firebase Admin SDK
import User from '../models/User.js';

class PushNotificationService {
  /**
   * Gửi notification cho 1 user (tự động phân loại token)
   */
  async sendToUser(userId, notification) {
    try {
      // Lấy tất cả tokens của user
      const user = await User.findById(userId);
      
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`⚠️  User ${userId}: No FCM tokens registered`);
        return { success: false, message: 'No devices registered' };
      }

      const allTokens = user.fcmTokens.map(t => t.token);
      
      // ✅ PHÂN LOẠI TOKENS
      const expoTokens = allTokens.filter(t => t.startsWith('ExponentPushToken['));
      const nativeTokens = allTokens.filter(t => !t.startsWith('ExponentPushToken['));

      console.log(`📤 Gửi đến ${allTokens.length} devices:`);
      console.log(`   - Expo tokens: ${expoTokens.length}`);
      console.log(`   - Native FCM tokens: ${nativeTokens.length}`);
      
      // ✅ DEBUG: Hiện token để kiểm tra
      if (nativeTokens.length > 0) {
        console.log(`   🔍 Native tokens:`);
        nativeTokens.forEach((token, i) => {
          console.log(`      ${i + 1}. ${token.substring(0, 50)}... (length: ${token.length})`);
        });
      }

      // ✅ GỬI QUA CẢ 2 KÊNH
      const [expoResult, fcmResult] = await Promise.all([
        this.sendViaExpoPush(expoTokens, notification),
        this.sendViaFirebase(nativeTokens, notification)
      ]);

      const totalSuccess = expoResult.successCount + fcmResult.successCount;
      const totalFailed = expoResult.failureCount + fcmResult.failureCount;

      console.log(`✅ Notification sent to user ${userId}: ${totalSuccess}/${allTokens.length} devices`);

      // ✅ Xóa tokens lỗi
      const failedTokens = [...expoResult.failedTokens, ...fcmResult.failedTokens];
      if (failedTokens.length > 0) {
        await this.cleanupInvalidTokens(userId, failedTokens);
      }

      return {
        success: totalSuccess > 0,
        successCount: totalSuccess,
        failureCount: totalFailed,
        total: allTokens.length
      };
      
    } catch (error) {
      console.error(`❌ Error sending notification to user ${userId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gửi qua EXPO PUSH API
   */
  async sendViaExpoPush(tokens, notification) {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    try {
      // Tạo messages
      const messages = tokens.map(token => ({
        to: token,
        sound: notification.soundEnabled ? 'default' : null,
        title: notification.title || 'Habit Reminder',
        body: notification.message || 'Time to complete your habit!',
        data: {
          type: notification.type || 'HABIT_REMINDER',
          habitId: notification.habitId?.toString() || '',
          reminderId: notification.reminderId?.toString() || '',
          habitIcon: notification.habitIcon || '',
          habitColor: notification.habitColor || '',
          timestamp: new Date().toISOString()
        },
        priority: 'high',
        channelId: 'habit_reminders',
      }));

      // Gửi request
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      // Đếm kết quả
      let successCount = 0;
      let failureCount = 0;
      const failedTokens = [];

      if (result.data) {
        result.data.forEach((receipt, index) => {
          if (receipt.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            console.log(`   ❌ Expo token ${index + 1} failed: ${receipt.message}`);
            
            if (receipt.details?.error === 'DeviceNotRegistered') {
              failedTokens.push(tokens[index]);
            }
          }
        });
      }

      return { successCount, failureCount, failedTokens };

    } catch (error) {
      console.error('❌ Expo Push API error:', error.message);
      return { successCount: 0, failureCount: tokens.length, failedTokens: [] };
    }
  }

  /**
   * Gửi qua FIREBASE ADMIN SDK
   */
  async sendViaFirebase(tokens, notification) {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    try {
      // ✅ Validate tokens (Native FCM token phải dài 140-180 chars)
      const validTokens = tokens.filter(token => {
        const isValid = token.length >= 140 && token.length <= 200 && !token.includes('[');
        if (!isValid) {
          console.log(`   ⚠️ Invalid FCM token format: ${token.substring(0, 50)}... (length: ${token.length})`);
        }
        return isValid;
      });

      if (validTokens.length === 0) {
        console.log('   ⚠️ No valid native FCM tokens after validation');
        return { 
          successCount: 0, 
          failureCount: tokens.length, 
          failedTokens: tokens.filter(t => !validTokens.includes(t))
        };
      }

      console.log(`   ✅ ${validTokens.length}/${tokens.length} tokens passed validation`);
      // Tạo message theo format Firebase
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
        tokens: validTokens  // ← Dùng validTokens thay vì tokens
      };

      // Gửi qua Firebase
      const response = await admin.messaging().sendEachForMulticast(message);
      
      const failedTokens = tokens.filter(t => !validTokens.includes(t)); // ← Thêm tokens invalid vào failed
      
      // Lọc tokens lỗi
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          console.log(`   ❌ Native FCM token ${idx + 1} failed: ${errorCode}`);
          console.log(`      Token: ${tokens[idx].substring(0, 50)}...`);
          
          // ✅ Xóa token lỗi (bao gồm cả invalid-argument)
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-argument'  // ← THÊM DÒNG NÀY
          ) {
            failedTokens.push(tokens[idx]);
            console.log(`      → Will be removed from DB`);
          }
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens
      };

    } catch (error) {
      console.error('❌ Firebase Admin SDK error:', error.message);
      return { successCount: 0, failureCount: tokens.length, failedTokens: [] };
    }
  }

  /**
   * Xóa tokens không hợp lệ
   */
  async cleanupInvalidTokens(userId, failedTokens) {
    if (failedTokens.length === 0) return;

    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: { $in: failedTokens } } }
      });
      
      console.log(`🧹 Cleaned ${failedTokens.length} invalid tokens for user ${userId}`);
    } catch (error) {
      console.error('❌ Error cleaning tokens:', error);
    }
  }

  /**
   * Gửi test notification
   */
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