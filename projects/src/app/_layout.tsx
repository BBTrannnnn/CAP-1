// app/_layout.js
// ✅ SIMPLIFIED: Không cần truyền authToken nữa

import React, { useEffect, useRef, useState } from 'react';
import { config } from '../../tamagui.config';
import { TamaguiProvider } from '@tamagui/core';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './../server/toastConfig';

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../utils/notifications';

// Cấu hình notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const [fcmToken, setFcmToken] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Setup Notifications + Listeners
  useEffect(() => {
    setupNotifications();
    setupListeners();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  async function setupNotifications() {
    try {
      // ✅ Kiểm tra xem đã login chưa
      const authToken = await AsyncStorage.getItem('accessToken');
      
      if (!authToken) {
        console.log('⚠️ Chưa đăng nhập → bỏ qua đăng ký FCM');
        return;
      }

      // ✅ Đăng ký FCM (không cần truyền authToken vì apiRequest tự lấy)
      const token = await registerForPushNotifications();

      if (token) {
        setFcmToken(token);
        await AsyncStorage.setItem('fcmToken', token);
        console.log('✅ Đăng ký notifications thành công');
      }
    } catch (err) {
      console.error('❌ Lỗi setup notifications:', err);
    }
  }

  function setupListeners() {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification nhận:', notification);
        const { title, body } = notification.request.content;
        console.log(`   ${title}: ${body}`);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 User click notification');
        const data = response.notification.request.content.data;
        
        if (data?.habitId) {
          console.log('   → Navigate đến habit:', data.habitId);
          // TODO: Implement navigation
          // router.push(`/habits/${data.habitId}`);
        }
      });
  }

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
        <Toast config={toastConfig} />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

// ✅ Export logout cho màn Setting
export async function handleLogout() {
  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');

    // ✅ Hủy FCM token (không cần authToken vì apiRequest tự lấy)
    if (fcmToken) {
      await unregisterPushNotifications(null, fcmToken);
    }

    // ✅ Xóa tất cả tokens
    await AsyncStorage.multiRemove(['accessToken', 'auth_token', 'fcmToken']);
    console.log('✅ Đã logout và xóa FCM token');
  } catch (err) {
    console.error('❌ Lỗi logout:', err);
  }
}