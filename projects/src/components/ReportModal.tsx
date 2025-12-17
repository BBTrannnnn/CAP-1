import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Button, XStack, YStack } from 'tamagui';
import { X, Flag, Check } from '@tamagui/lucide-icons';

// Backend enum mapping
const REPORT_REASONS = [
    { value: 'spam', label: 'Nội dung spam hoặc quảng cáo' },
    { value: 'harassment', label: 'Quấy rối hoặc bắt nạt' },
    { value: 'hate_speech', label: 'Ngôn từ thù ghét' },
    { value: 'violence', label: 'Bạo lực hoặc gây hại' },
    { value: 'nsfw', label: 'Nội dung nhạy cảm (18+)' },
    { value: 'misinformation', label: 'Thông tin sai lệch' },
    { value: 'scam', label: 'Lừa đảo hoặc gian lận' },
    { value: 'copyright', label: 'Vi phạm bản quyền' },
    { value: 'other', label: 'Lý do khác' },
];

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (payload: { reason: string; description?: string }) => void;
    loading?: boolean;
}

export default function ReportModal({ visible, onClose, onSubmit, loading }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = React.useState<string | null>(null);
    const [description, setDescription] = React.useState('');

    const handleSubmit = () => {
        if (!selectedReason) {
            alert('Vui lòng chọn lý do báo cáo hợp lệ');
            return;
        }
        onSubmit({
            reason: selectedReason,
            description: description.trim() || undefined,
        });
        // Reset form
        setSelectedReason(null);
        setDescription('');
    };

    const handleClose = () => {
        setSelectedReason(null);
        setDescription('');
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
                            <Flag size={24} color="#ef4444" />
                            <Text style={styles.title}>Báo cáo nội dung</Text>
                        </XStack>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView style={styles.content}>
                        {/* Info */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Hãy cho chúng tôi biết điều gì đang xảy ra với nội dung này. Báo cáo của bạn sẽ được giữ kín.
                            </Text>
                        </View>

                        {/* Reason Selection */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>
                                Lý do báo cáo <Text style={{ color: 'red' }}>*</Text>
                            </Text>
                            <View style={styles.reasonList}>
                                {REPORT_REASONS.map((item) => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[
                                            styles.reasonItem,
                                            selectedReason === item.value && styles.reasonItemSelected,
                                        ]}
                                        onPress={() => setSelectedReason(item.value)}
                                        disabled={loading}
                                    >
                                        <View style={styles.radioOuter}>
                                            {selectedReason === item.value && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <Text
                                            style={[
                                                styles.reasonLabel,
                                                selectedReason === item.value && styles.reasonLabelSelected,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        {selectedReason === item.value && (
                                            <Check size={18} color="#ef4444" style={{ marginLeft: 'auto' }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </YStack>

                        {/* Description (Optional) */}
                        <YStack marginBottom="$4">
                            <Text style={styles.label}>
                                Mô tả chi tiết <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(tuỳ chọn)</Text>
                            </Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Bạn có thể mô tả thêm để moderator hiểu rõ hơn..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                maxLength={300}
                                editable={!loading}
                            />
                            <Text style={styles.charCount}>{description.length}/300</Text>
                        </YStack>
                    </ScrollView>

                    {/* Actions */}
                    <XStack gap="$3" marginTop="$4">
                        <Button
                            flex={1}
                            height={48}
                            backgroundColor="$gray5"
                            color="$gray11"
                            fontSize={15}
                            fontWeight="600"
                            onPress={handleClose}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button
                            flex={1}
                            height={48}
                            backgroundColor="$red10"
                            color="white"
                            fontSize={15}
                            fontWeight="600"
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
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
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    reasonList: {
        gap: 8,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        gap: 12,
    },
    reasonItemSelected: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
    },
    reasonLabel: {
        fontSize: 14,
        color: '#475569',
        flex: 1,
    },
    reasonLabelSelected: {
        color: '#0f172a',
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
});
