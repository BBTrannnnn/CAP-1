import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';
import { X, AlertCircle } from '@tamagui/lucide-icons';

interface AppealModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    loading?: boolean;
    contentType: 'post' | 'comment' | 'ban';
}

export default function AppealModal({ visible, onClose, onSubmit, loading, contentType }: AppealModalProps) {
    const [reason, setReason] = React.useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Vui lòng nhập lý do khiếu nại');
            return;
        }
        onSubmit(reason);
        setReason(''); // Reset
    };

    const handleClose = () => {
        setReason('');
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
                            <AlertCircle size={24} color="#f59e0b" />
                            <Text style={styles.title}>
                                {contentType === 'ban' ? 'Kháng cáo khóa tài khoản' : 'Khiếu nại nội dung'}
                            </Text>
                        </XStack>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView style={styles.content}>
                        {/* Info */}
                        <View style={[styles.infoBox, contentType === 'ban' && styles.infoBoxBan]}>
                            <Text style={[styles.infoText, contentType === 'ban' && styles.infoTextBan]}>
                                {contentType === 'ban'
                                    ? 'Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng. Nếu bạn cho rằng đây là nhầm lẫn, hãy gửi kháng cáo.'
                                    : `${contentType === 'post' ? 'Bài viết' : 'Bình luận'} của bạn đã bị từ chối. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng giải thích lý do dưới đây.`
                                }
                            </Text>
                        </View>

                        {/* Reason Input */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>
                                Lý do khiếu nại <Text style={{ color: 'red' }}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Ví dụ: Tôi nghĩ đây là nhầm lẫn, nội dung không vi phạm quy tắc cộng đồng..."
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={5}
                                maxLength={500}
                            />
                            <Text style={styles.charCount}>{reason.length}/500</Text>
                        </YStack>

                        {/* Note */}
                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>
                                💡 Khiếu nại của bạn sẽ được xem xét bởi moderator.
                                Chúng tôi sẽ phản hồi trong vòng 24-48 giờ.
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
                            backgroundColor="#f59e0b"
                            color="white"
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
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
    infoBox: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    infoText: {
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
    },
    infoBoxBan: {
        backgroundColor: '#fee2e2',
        borderLeftColor: '#ef4444',
    },
    infoTextBan: {
        color: '#991b1b',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#f8fafc',
        minHeight: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 4,
    },
    noteBox: {
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    noteText: {
        fontSize: 12,
        color: '#1e40af',
        lineHeight: 16,
    },
});
