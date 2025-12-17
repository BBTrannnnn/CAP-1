import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';
import { X, AlertTriangle } from '@tamagui/lucide-icons';

interface BanUserModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: string, duration: number) => void;
    loading?: boolean;
    userName?: string;
}

const DURATION_OPTIONS = [
    { label: '1 ngày', value: 1 },
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
    { label: 'Vĩnh viễn', value: 0 },
];

export default function BanUserModal({ visible, onClose, onSubmit, loading, userName }: BanUserModalProps) {
    const [reason, setReason] = React.useState('');
    const [duration, setDuration] = React.useState(7);

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Vui lòng nhập lý do cấm');
            return;
        }
        onSubmit(reason, duration);
        setReason('');
        setDuration(7);
    };

    const handleClose = () => {
        setReason('');
        setDuration(7);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                        <XStack gap="$2" alignItems="center">
                            <AlertTriangle size={24} color="#ef4444" />
                            <Text style={styles.title}>Cấm người dùng</Text>
                        </XStack>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView style={styles.content}>
                        {/* Warning */}
                        {userName && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    Bạn đang cấm người dùng: <Text style={{ fontWeight: 'bold' }}>{userName}</Text>
                                </Text>
                            </View>
                        )}

                        {/* Duration Selector */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>Thời gian cấm <Text style={{ color: 'red' }}>*</Text></Text>
                            <XStack gap="$2" flexWrap="wrap">
                                {DURATION_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => setDuration(option.value)}
                                        style={[
                                            styles.durationOption,
                                            duration === option.value && styles.durationOptionActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.durationText,
                                            duration === option.value && styles.durationTextActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </XStack>
                        </YStack>

                        {/* Reason Input */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>Lý do cấm <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Ví dụ: Vi phạm nhiều lần quy tắc cộng đồng..."
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={4}
                                maxLength={300}
                            />
                            <Text style={styles.charCount}>{reason.length}/300</Text>
                        </YStack>

                        {/* Note */}
                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>
                                ⚠️ Người dùng sẽ không thể đăng nhập và sử dụng ứng dụng trong thời gian bị cấm.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <XStack gap="$3" marginTop="$4">
                        <Button
                            flex={1}
                            backgroundColor="$gray5"
                            color="$gray11"
                            onPress={handleClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            flex={1}
                            backgroundColor="$red10"
                            color="white"
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Cấm người dùng'}
                        </Button>
                    </XStack>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    content: {
        maxHeight: 400,
    },
    warningBox: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    warningText: {
        fontSize: 13,
        color: '#991b1b',
        lineHeight: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    durationOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    durationOptionActive: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    durationText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    durationTextActive: {
        color: '#ef4444',
        fontWeight: '600',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#f8fafc',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 4,
    },
    noteBox: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    noteText: {
        fontSize: 12,
        color: '#991b1b',
        lineHeight: 16,
    },
});
