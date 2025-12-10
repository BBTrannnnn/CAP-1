// file: utils/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// 1. Cấu hình: App vẫn hiện thông báo khi đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Hàm xin quyền thông báo
export async function ensureNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Cần quyền thông báo', 'Vui lòng cấp quyền để nhận nhắc nhở!');
    return false;
  }
  return true;
}

/**
 * 3. Hẹn giờ thông báo lặp lại theo ngày trong tuần
 * @param {string} title - Tiêu đề thông báo
 * @param {string} body - Nội dung
 * @param {number} hour - Giờ (0-23)
 * @param {number} minute - Phút (0-59)
 * @param {number[]} weekdays - Mảng các ngày [1=CN, 2=T2, ..., 7=T7]. Nếu rỗng là chỉ báo 1 lần hôm nay/mai.
 */
export async function scheduleReminder(title, body, hour, minute, weekdays = []) {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) return null;

  // Trường hợp 1: Lặp lại các ngày cụ thể (T2, T3...)
  if (weekdays.length > 0) {
    const notificationIds = [];
    
    for (const day of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: 'default',
        },
        trigger: {
          hour: hour,
          minute: minute,
          weekday: day, // 1: Chủ Nhật, 2: Thứ 2, ...
          repeats: true,
        },
      });
      notificationIds.push(id);
    }
    return notificationIds; // Trả về mảng ID để sau này xóa
  } 
  
  // Trường hợp 2: Báo một lần (Hẹn giờ ngày mai nếu giờ đã qua)
  else {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: false, // Không lặp
      },
    });
    return [id];
  }
}

// 4. Hủy thông báo (Khi xóa nhắc nhở hoặc tắt switch)
export async function cancelReminder(notificationIds) {
  if (!notificationIds) return;
  
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  console.log('Đã hủy các thông báo:', ids);
}

// 5. Hủy tất cả (Dùng khi logout)
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}