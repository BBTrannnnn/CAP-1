import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { config } from '../../tamagui.config';
import { CurrentToast, GlobalNotifyListener } from '../components/ToastMessage';
import {
  unregisterPushNotifications
} from '../utils/notifications';

import { useAuth } from '../stores/auth';
import BannedScreen from '../components/BannedScreen';

// Configure Notifications Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<EventSubscription | undefined>();
  const responseListener = useRef<EventSubscription | undefined>();

  // Setup Notifications + Listeners khi app khởi động
  useEffect(() => {
    setupListeners();

    // Cleanup khi unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  function setupListeners() {
    // 📩 Listener khi nhận notification (app đang mở)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📩 Notification nhận:', notification);
      const { title, body } = notification.request.content;
      console.log(`   ${title}: ${body}`);
    });

    // 👆 Listener khi user click vào notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
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
        {/* Toast Provider wraps the app */}
        <ToastProvider swipeDirection="horizontal" duration={4000}>
          <GlobalNotifyListener />
          <RootContent />
          <SafeToastViewport />
        </ToastProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

// ✅ Toast Viewport với Safe Area
function SafeToastViewport() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <CurrentToast />
      <ToastViewport
        flexDirection="column-reverse"
        top={insets.top + 10}
        left={0}
        right={0}
        multipleToasts
      />
    </>
  );
}

// ✅ Main Content với Banned Screen Check
function RootContent() {
  const user = useAuth((s) => s.user);

  if (user?.isBanned) {
    return <BannedScreen reason={user.bannedReason} bannedUntil={user.bannedUntil} />;
  }

  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
    </Stack>
  );
}

// ✅ Export function handleLogout để dùng ở màn Setting
export async function handleLogout() {
  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');

    // ✅ Hủy FCM token với backend (backend tự lấy authToken)
    if (fcmToken) {
      await unregisterPushNotifications(fcmToken);
    }

    // ✅ Xóa tất cả tokens
    await AsyncStorage.multiRemove(['authToken', 'auth_token', 'fcmToken', 'remember_email']);
    console.log('✅ Đã logout và xóa FCM token');
  } catch (err) {
    console.error('❌ Lỗi logout:', err);
  }
}