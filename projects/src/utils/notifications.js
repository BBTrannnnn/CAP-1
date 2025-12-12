import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// ✅ 1. Cấu hình notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ 2. Đăng ký FCM Token (QUAN TRỌNG!)
export async function registerForPushNotifications(authToken) {
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
    Alert.alert('Lỗi', 'Push notification chỉ hoạt động trên thiết bị thật!');
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
    // ✅ LẤY EXPO PUSH TOKEN (FCM)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('❌ Thiếu projectId trong app.json!');
      Alert.alert('Lỗi cấu hình', 'Vui lòng chạy: eas build --configure');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('✅ FCM Token:', token);

    // ✅ GỬI TOKEN LÊN BACKEND
    const response = await fetch('https://your-api.onrender.com/api/fcm/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token: token,
        device: Platform.OS,
        deviceId: Constants.deviceId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Token đã đăng ký:', data);
    
    return token;

  } catch (error) {
    console.error('❌ Lỗi đăng ký token:', error);
    Alert.alert('Lỗi', `Không thể đăng ký thông báo: ${error.message}`);
    return null;
  }
}

// ✅ 3. Hủy đăng ký khi logout
export async function unregisterPushNotifications(authToken, fcmToken) {
  if (!fcmToken) return;

  try {
    await fetch('https://your-api.onrender.com/api/fcm/unregister', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: fcmToken })
    });
    console.log('✅ Token đã hủy');
  } catch (error) {
    console.error('❌ Lỗi hủy token:', error);
  }
}

// ✅ 4. Hủy tất cả local notifications
export async function cancelAllLocalNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('✅ Đã hủy tất cả local notifications');
}