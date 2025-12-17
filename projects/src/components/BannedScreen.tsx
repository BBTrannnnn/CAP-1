import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { Text, YStack, Button, XStack } from 'tamagui';
import { AlertTriangle, Lock, LogOut } from '@tamagui/lucide-icons';
import { notifyError, notifySuccess } from '../utils/notify';
import AppealModal from './AppealModal';
import { SocialApi } from '../api/services';
import { useAuth } from '../stores/auth';
import { useRouter } from 'expo-router';

interface BannedScreenProps {
    reason?: string;
    bannedUntil?: string;
}

export default function BannedScreen({ reason, bannedUntil }: BannedScreenProps) {
    const [appealVisible, setAppealVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const signOut = useAuth(s => s.signOut);
    const router = useRouter();

    const user = useAuth((s) => s.user);

    const handleAppeal = async (appealReason: string) => {
        setLoading(true);
        try {
            const userId = user?._id || (user as any)?.id;
            if (userId) {
                // Use createAppeal instead of submitBanAppeal (which calls non-existent endpoint)
                await SocialApi.createAppeal('account', userId, appealReason);
            } else {
                console.error("User object missing ID:", user);
                throw new Error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            }
            notifySuccess('Đã gửi kháng cáo', 'Chúng tôi sẽ xem xét yêu cầu của bạn.');
            setAppealVisible(false);
        } catch (error: any) {
            notifyError('Lỗi', error.message || 'Không thể gửi kháng cáo');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        signOut();
        router.replace('/(auth)/login');
    };

    const formattedDate = bannedUntil
        ? new Date(bannedUntil).toLocaleDateString('vi-VN')
        : 'Vĩnh viễn';

    return (
        <View style={styles.container}>
            {/* Appeal Icon (Top Right) */}
            <Pressable
                style={styles.appealIcon}
                onPress={() => setAppealVisible(true)}
            >
                <XStack gap="$2" padding="$2" backgroundColor="rgba(255,255,255,0.2)" borderRadius={20}>
                    <Text color="white" fontWeight="600">Khiếu nại</Text>
                    <AlertTriangle color="white" size={20} />
                </XStack>
            </Pressable>

            <YStack alignItems="center" paddingHorizontal={20} gap="$4">
                <View style={styles.iconCircle}>
                    <Lock size={48} color="#ef4444" />
                </View>

                <Text fontSize={24} fontWeight="bold" color="white" textAlign="center">
                    Tài khoản bị khóa
                </Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Lý do:</Text>
                    <Text style={styles.value}>{reason || 'Vi phạm tiêu chuẩn cộng đồng'}</Text>

                    <Text style={styles.label} marginTop={10}>Thời hạn:</Text>
                    <Text style={styles.value}>{formattedDate}</Text>
                </View>

                <Text color="#e2e8f0" textAlign="center" fontSize={13}>
                    Nếu bạn cho rằng đây là nhầm lẫn, hãy nhấn vào nút "Khiếu nại" ở góc trên bên phải.
                </Text>

                <Button
                    backgroundColor="#334155"
                    color="white"
                    icon={<LogOut size={16} />}
                    marginTop="$8"
                    onPress={handleLogout}
                >
                    Đăng xuất
                </Button>
            </YStack>

            <AppealModal
                visible={appealVisible}
                onClose={() => setAppealVisible(false)}
                onSubmit={handleAppeal}
                loading={loading}
                contentType="ban"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    appealIcon: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        borderRadius: 16,
        width: '100%',
        maxWidth: 350,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    label: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    value: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 4,
    }
});
