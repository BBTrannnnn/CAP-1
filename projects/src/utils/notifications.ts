
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
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
        // Permission not granted
        return false;
    }

    return true;
}

export async function scheduleNotification(title: string, body: string, seconds: number) {
    const hasPermission = await registerForPushNotificationsAsync();
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

export async function scheduleDailyNotification(title: string, body: string, hours: number, minutes: number) {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: 'default',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hours,
            minute: minutes,
            repeats: true,
        },
    });
}

export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
