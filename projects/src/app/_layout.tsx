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
      const authToken = await AsyncStorage.getItem('authToken');

      if (!authToken) {
        console.log('⚠️ Chưa đăng nhập → bỏ qua đăng ký FCM');
        return;
      }

      const token = await registerForPushNotifications(authToken);

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
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 User click notification:', response);
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

// Export logout cho màn Setting
export async function handleLogout() {
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    const fcmToken = await AsyncStorage.getItem('fcmToken');

    if (authToken && fcmToken) {
      await unregisterPushNotifications(authToken, fcmToken);
    }

    await AsyncStorage.multiRemove(['authToken', 'fcmToken']);
    console.log('✅ Đã logout và xóa FCM token');
  } catch (err) {
    console.error('❌ Lỗi logout:', err);
  }
}
