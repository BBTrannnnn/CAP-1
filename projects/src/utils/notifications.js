import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { getBaseUrl } from '../server/users';

const BACKEND_URL = getBaseUrl();
const DEVICE_ID = Constants.deviceId ?? Device.osInternalBuildId ?? null;

// Configure notification behavior globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId || '';

// Register device for push notifications and send the token to backend
export async function registerForPushNotifications(authToken) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit_reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    Alert.alert('Physical device required', 'Push notifications need to run on a real device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission denied', 'Failed to get push notification permissions.');
    return null;
  }

  const projectId = getProjectId();
  const pushTokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = pushTokenResponse.data;

  console.log('FCM Token:', token);

  if (!authToken || !token) {
    return token;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/fcm/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        device: Platform.OS,
        deviceId: DEVICE_ID,
      }),
    });

    const data = await response.json();
    console.log('Token registered:', data);
  } catch (error) {
    console.error('Error registering token:', error);
  }

  return token;
}

// Remove token from backend on logout
export async function unregisterPushNotifications(authToken, fcmToken) {
  if (!authToken || !fcmToken) return;

  try {
    console.log(`${BACKEND_URL}/api/fcm/unregister`);
    
    await fetch(`${BACKEND_URL}/api/fcm/unregister`, {
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
