import { Toast, useToastState, useToastController } from '@tamagui/toast';
import { YStack, XStack, Text } from 'tamagui';
import { AlertCircle, CheckCircle, Info } from '@tamagui/lucide-icons';
import { useEffect } from 'react';
import { setNotifyHandler } from '../utils/notify';

/**
 * CurrentToast: The actual UI component that renders the active toast.
 * It reads from the Tamagui Toast context.
 */
// Hardcoded component to ensure visibility
export const CurrentToast = () => {
    const currentToast = useToastState();

    if (!currentToast || currentToast.isHandledNatively) return null;

    const { title, message, customData } = currentToast;
    const type = customData?.type as 'success' | 'error' | 'info' | undefined;

    // Force explicit high-contrast colors
    let bgColor = 'white';
    let borderColor = '#E5E7EB'; // gray-200
    let Icon = Info;
    let iconColor = '#3B82F6'; // blue-500
    let titleColor = '#111827'; // gray-900
    let messageColor = '#4B5563'; // gray-600

    switch (type) {
        case 'success':
            bgColor = '#F0FDF4'; // green-50
            borderColor = '#BBF7D0'; // green-200
            Icon = CheckCircle;
            iconColor = '#16A34A'; // green-600
            break;
        case 'error':
            bgColor = '#FEF2F2'; // red-50
            borderColor = '#FECACA'; // red-200
            Icon = AlertCircle;
            iconColor = '#DC2626'; // red-600
            break;
        case 'info':
        default:
            bgColor = 'white';
            borderColor = '#E5E7EB';
            Icon = Info;
            iconColor = '#3B82F6';
            break;
    }

    return (
        <Toast
            key={currentToast.id}
            duration={currentToast.duration}
            enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
            exitStyle={{ opacity: 0, scale: 1, y: -20 }}
            y={0}
            opacity={1}
            scale={1}
            animation="quick"
            viewportName={currentToast.viewportName}
            backgroundColor="transparent"
            padding={0}
            borderWidth={0}
        >
            <YStack
                backgroundColor={bgColor as any}
                borderColor={borderColor as any}
                borderWidth={1}
                borderRadius={12}
                paddingVertical={12}
                paddingHorizontal={16}
                elevation={6}
                width={340} // Fixed width
                maxWidth="96%"
                alignSelf="center"
                shadowColor="rgba(0,0,0,0.1)"
                shadowRadius={10}
                shadowOffset={{ width: 0, height: 4 }}
            >
                <XStack alignItems="flex-start" gap="$3">
                    <Icon size={24} color={iconColor as any} style={{ marginTop: 2 }} />
                    <YStack flex={1}>
                        <Text
                            fontWeight="bold"
                            fontSize={16}
                            color={titleColor as any}
                            style={{ color: titleColor }}
                        >
                            {title}
                        </Text>
                        {!!message && (
                            <Text
                                color={messageColor as any}
                                fontSize={14}
                                style={{ color: messageColor, marginTop: 2 }}
                            >
                                {message}
                            </Text>
                        )}
                    </YStack>
                </XStack>

                {/* Render Action Button if present */}
                {customData?.action && (
                    <XStack justifyContent="flex-end" marginTop="$2">
                        <Text
                            color={iconColor as any}
                            fontWeight="700"
                            fontSize={14}
                            style={{ color: iconColor }}
                            onPress={() => {
                                (customData.action as any).onPress?.();
                            }}
                        >
                            {(customData.action as any).label}
                        </Text>
                    </XStack>
                )}
            </YStack>
        </Toast>
    );
};

export const GlobalNotifyListener = () => {
    const toast = useToastController();

    useEffect(() => {
        setNotifyHandler(({ title, message, type, action }) => {
            toast.show(title, {
                message,
                customData: { type, action },
                duration: 5000,
            });
        });

        return () => {
            setNotifyHandler(() => { });
        };
    }, [toast]);

    return null;
};
