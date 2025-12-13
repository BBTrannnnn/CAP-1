// utils/notifications.js
// ✅ Dùng functions từ server/notifications.js (FILE RIÊNG)

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { registerFCMToken, unregisterFCMToken } from '../server/notifi.js'; // ✅ FILE RIÊNG

// Cấu hình notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Đăng ký FCM Token
 */
export async function registerForPushNotifications() {
  let token;

  // Android: Tạo notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit_reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Kiểm tra thiết bị thật
  if (!Device.isDevice) {
    console.warn('⚠️ Push notification chỉ hoạt động trên thiết bị thật!');
    return null;
  }

  // Xin quyền
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    Alert.alert('Cần quyền', 'Vui lòng cấp quyền thông báo trong Settings!');
    return null;
  }

  try {
    // ✅ Lấy Project ID từ app.json
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.warn('⚠️ Thiếu projectId trong app.json');
      console.warn('   → Chạy: eas build:configure');
    }

    // ✅ Lấy Expo Push Token (FCM)
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = tokenData.data;
    
    console.log('✅ FCM Token:', token);

    // ✅ Gửi token lên backend (dùng function từ notifications.js)
    const response = await registerFCMToken(
      token,
      Platform.OS,
      Constants.deviceId || 'unknown'
    );
    
    console.log('✅ Token đã đăng ký:', response);
    return token;

  } catch (error) {
    console.error('❌ Lỗi đăng ký token:', error.message);
    
    // Log chi tiết để debug
    if (error.message.includes('404')) {
      Alert.alert(
        'Lỗi Backend',
        'Route /api/fcm/register không tồn tại. Kiểm tra backend!'
      );
    } else if (error.message.includes('No auth token')) {
      console.log('⚠️ Chưa đăng nhập, bỏ qua đăng ký FCM');
    } else {
      Alert.alert('Lỗi', error.message);
    }
    
    return null;
  }
}

/**
 * Hủy đăng ký FCM Token khi logout
 */
export async function unregisterPushNotifications(authToken, fcmToken) {
  if (!fcmToken) return;

  try {
    // ✅ Dùng function từ notifications.js
    const response = await unregisterFCMToken(fcmToken);
    console.log('✅ Token đã hủy:', response);
  } catch (error) {
    console.error('❌ Lỗi hủy token:', error.message);
  }
}