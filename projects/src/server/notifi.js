// server/notifications.js
// API wrapper cho Push Notifications (FCM)
// Giống style habits.js và users.js

import { apiRequest } from './users';

/* ------------------------------------------------------------------ */
/* FCM TOKEN MANAGEMENT                                               */
/* ------------------------------------------------------------------ */

/**
 * Đăng ký FCM token lên backend
 * @param {string} token - Expo Push Token
 * @param {string} device - 'ios' hoặc 'android'
 * @param {string} deviceId - Unique device ID
 */
export function registerFCMToken(token, device, deviceId) {
  return apiRequest('/api/fcm/register', {
    method: 'POST',
    body: { token, device, deviceId },
    auth: true,
  });
}

/**
 * Hủy đăng ký FCM token (khi logout)
 * @param {string} token - Expo Push Token cần xóa
 */
export function unregisterFCMToken(token) {
  return apiRequest('/api/fcm/unregister', {
    method: 'POST',
    body: { token },
    auth: true,
  });
}

/**
 * Lấy danh sách devices đã đăng ký
 */
export function getRegisteredDevices() {
  return apiRequest('/api/fcm/devices', { auth: true });
}

/**
 * Gửi test notification đến chính mình
 */
export function sendTestNotification() {
  return apiRequest('/api/test/test-push', {
    method: 'POST',
    auth: true,
  });
}