import { ActionSheetIOS, Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Utility to trigger UI notifications (Toast/Snackbar) from anywhere.
 * 
 * We use a "listener" pattern:
 * - The UI root (e.g. _layout.tsx) calls setNotifyHandler() to register the actual Toast implementation.
 * - Any business logic (API, stores, screens) calls notifySuccess/notifyError.
 */

export type NotifyType = 'success' | 'error' | 'info';

export type NotifyParams = {
    title: string;
    message?: string;
    type: NotifyType;
    action?: {
        label: string;
        onPress: () => void;
    };
};

// Singleton handler ref
let notifyHandler: ((params: NotifyParams) => void) | null = null;

export const setNotifyHandler = (handler: (params: NotifyParams) => void) => {
    notifyHandler = handler;
};

/**
 * Show a success notification (check mark, green, etc)
 */
export const notifySuccess = (title: string, message?: string) => {
    if (notifyHandler) {
        notifyHandler({ title, message, type: 'success' });
    } else {
        // Fallback if no provider is mounted yet
        console.log('[Notify Success]', title, message);
    }
};

/**
 * Show an error notification (red, alert icon)
 * Optionally provide an onRetry callback for a "Retry" button
 */
export const notifyError = (title: string, message?: string, onRetry?: () => void) => {
    if (notifyHandler) {
        notifyHandler({
            title,
            message,
            type: 'error',
            action: onRetry ? { label: 'Thử lại', onPress: onRetry } : undefined,
        });
    } else {
        console.warn('[Notify Error]', title, message);
        Alert.alert(title, message || 'Đã có lỗi xảy ra');
    }
};

/**
 * Show an info notification (neutral, blue)
 */
export const notifyInfo = (title: string, message?: string) => {
    if (notifyHandler) {
        notifyHandler({ title, message, type: 'info' });
    } else {
        console.log('[Notify Info]', title, message);
    }
};
