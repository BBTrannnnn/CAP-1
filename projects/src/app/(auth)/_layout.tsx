// app/_layout.tsx
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Web: dùng Web Notifications API (Expo notifications không hoạt động trên web)
    if (Platform.OS === 'web') {
      if (typeof Notification !== 'undefined') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Web notifications enabled', {
              body: 'You will receive web alerts while this tab is open.',
            });
          } else {
            console.warn('Web notifications permission was not granted');
          }
        });
      } else {
        console.warn('Web Notifications API is not supported in this browser');
      }
      return;
    }

    // Khi app đang mở, nhận notification
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('New notification', notification.request.content.body || 'You have a new notification');
        
        Alert.alert('New notification', notification.request.content.body || 'You have a new notification');
      });

    // Khi user bấm vào notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        Alert.alert('Notification opened', 'You just tapped a notification');
        const data = response.notification.request.content.data as any;

        // Nếu backend gửi kèm habitId trong data
        if (data?.habitId) {
          router.push({
            pathname: '/(tabs)/habits/RunningHabitTracker',
            params: { habitId: String(data.habitId) },
          });
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Nhóm auth: dùng AuthLayout bạn đã viết */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      {/* Nhóm tabs chính */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
