import { config } from '../../tamagui.config';
import { TamaguiProvider } from 'tamagui';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { CurrentToast, GlobalNotifyListener } from '../components/ToastMessage';
import * as Notifications from 'expo-notifications';
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
