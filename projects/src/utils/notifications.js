// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// 👉 NÊU CÓ env EXPO_PUBLIC_API_BASE_URL thì ưu tiên dùng, không thì fallback về URL cố định
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:5000'; // ⬅️ sửa thành URL Render / IP BE của bạn

// Cấu hình cách hiện notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Hàm đăng ký FCM/Expo Push Token
export async function registerForPushNotifications(authToken) {
  let token;

  // Android: tạo notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit_reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Thông báo',
        'App cần quyền thông báo để gửi nhắc nhở thói quen.',
      );
      return;
    }

    // ⚠️ Cần có projectId trong app.json → expo.extra.eas.projectId
    const projectId =
      // SDK mới
      (Constants).expoConfig?.extra?.eas?.projectId ??
      // Một số SDK cũ
      (Constants).easConfig?.projectId;

    if (!projectId) {
      console.warn(
        '[notifications] Không tìm thấy projectId trong app.json (expo.extra.eas.projectId)',
      );
    }

    const expoToken = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    token = expoToken.data;
    console.log('Expo Push Token:', token);

    try {
      const response = await fetch(`${API_BASE}/api/fcm/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          device: Platform.OS,
          deviceId: (Constant).deviceId,
        }),
      });

      const data = await response.json();
      console.log('Token registered:', data);
    } catch (error) {
      console.error('Error registering token:', error);
    }
  } else {
    Alert.alert(
      'Thông báo',
      'Push notification chỉ hoạt động trên thiết bị thật.',
    );
  }

  return token;
}

// Hàm xoá token khi logout
export async function unregisterPushNotifications(
  authToken,
  fcmToke,
) {
  try {
    await fetch(`${API_BASE}/api/fcm/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token: fcmToken,
      }),
    });
    console.log('Token unregistered');
  } catch (error) {
    console.error('Error unregistering token:', error);
  }
}
