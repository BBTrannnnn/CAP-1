import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { registerFCMToken, unregisterFCMToken } from '../server/notifi.js';

/* -------------------------------------------------------------------------- */
/*                         GLOBAL NOTIFICATION HANDLER                         */
/* -------------------------------------------------------------------------- */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* -------------------------------------------------------------------------- */
/*                               FCM / PUSH TOKEN                              */
/* -------------------------------------------------------------------------- */

/**
 * Đăng ký Expo / FCM Push Token + gửi backend
 * ✅ Backend tự động lấy authToken từ AsyncStorage (auth: true)
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Android channel (push)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit_reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Chỉ chạy trên thiết bị thật
  if (!Device.isDevice) {
    console.warn('⚠️ Push notification chỉ hoạt động trên thiết bị thật');
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
    Alert.alert('Cần quyền', 'Vui lòng cấp quyền thông báo trong Settings');
    return null;
  }

  try {
    // Lấy Expo Project ID
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('⚠️ Thiếu projectId (eas build:configure)');
    }

    // Lấy Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const token = tokenData.data;
    console.log('✅ Expo Push Token:', token);

    // ✅ Gửi token lên backend (auth: true tự động thêm authToken)
    await registerFCMToken(
      token,
      Platform.OS,
      Constants.deviceId ?? 'unknown'
    );

    return token;
  } catch (error: any) {
    console.error('❌ Lỗi đăng ký push token:', error?.message);
    return null;
  }
}

/**
 * Hủy đăng ký FCM token (khi logout)
 * ✅ Backend tự động lấy authToken (auth: true)
 */
export async function unregisterPushNotifications(
  fcmToken: string | null
): Promise<void> {
  if (!fcmToken) return;

  try {
    // ✅ Backend tự động thêm authToken vào header
    await unregisterFCMToken(fcmToken);
    console.log('✅ Đã hủy FCM token');
  } catch (error: any) {
    console.error('❌ Lỗi hủy FCM token:', error?.message);
  }
}

/* -------------------------------------------------------------------------- */
/*                           LOCAL / SCHEDULED NOTIFICATIONS                   */
/* -------------------------------------------------------------------------- */

/**
 * Xin quyền notification (dùng cho local notification)
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Notification sau X giây
 */
export async function scheduleNotification(
  title: string,
  body: string,
  seconds: number
): Promise<void> {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

/**
 * Notification hằng ngày
 */
export async function scheduleDailyNotification(
  title: string,
  body: string,
  hour: number,
  minute: number
): Promise<void> {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/**
 * Hủy toàn bộ local notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}