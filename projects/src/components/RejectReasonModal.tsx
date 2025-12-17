import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';
import { X } from '@tamagui/lucide-icons';

interface RejectReasonModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: string, notes: string) => void;
    loading?: boolean;
}

export default function RejectReasonModal({ visible, onClose, onSubmit, loading }: RejectReasonModalProps) {
    const [reason, setReason] = React.useState('');
    const [notes, setNotes] = React.useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }
        onSubmit(reason, notes);
        // Reset form
        setReason('');
        setNotes('');
    };

    const handleClose = () => {
        setReason('');
        setNotes('');
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
                        <Text style={styles.title}>Từ chối nội dung</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView style={styles.content}>
                        {/* Reason Input */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>Lý do từ chối <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ví dụ: Vi phạm quy tắc cộng đồng"
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={2}
                            />
                        </YStack>

                        {/* Notes Input */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Thêm ghi chú chi tiết..."
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                            />
                        </YStack>
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
                            {loading ? 'Đang xử lý...' : 'Từ chối'}
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
        maxHeight: 300,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#f8fafc',
        minHeight: 60,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
