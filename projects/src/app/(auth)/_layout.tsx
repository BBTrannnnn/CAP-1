// app/_layout.tsx
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Khi app đang mở, nhận notification
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

    // Khi user bấm vào notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data as any;

        if (data?.habitId) {
          router.push({
            pathname: '/(tabs)/habits/RunningHabitTracker',
            params: { habitId: String(data.habitId) },
          });
        }
      });

    return () => {
      // ✅ Expo SDK mới: mỗi subscription có .remove()
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
