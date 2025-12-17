import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Button, XStack, YStack, Avatar, Card, Separator } from 'tamagui';
import { X, Flag, AlertTriangle, User, MessageSquare, FileText, CheckCircle, Shield, UserX } from '@tamagui/lucide-icons';
import { BASE_URL } from '../api/client'; // Adjust path if needed

// Types based on backend Report model
interface UserInfo {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface ReportContent {
    _id: string;
    content?: string;
    images?: string[];
    // For comments
    postId?: { _id: string; content: string } | string;
}

export interface ReportData {
    _id: string;
    reporterId?: UserInfo;
    reportedUserId?: UserInfo;
    contentType: 'post' | 'comment' | 'user';
    contentId: string;
    content?: ReportContent;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    priority: number;
    createdAt: string;
}

interface ReportDetailModalProps {
    visible: boolean;
    report: ReportData | null;
    onClose: () => void;
    onDismiss: (reportId: string, note?: string) => Promise<void>;
    onViewContent?: (contentType: string, contentId: string) => void;
    onDelete?: (contentType: 'post' | 'comment', contentId: string) => Promise<void>;
}

export default function ReportDetailModal({ visible, report, onClose, onDismiss, onDelete }: ReportDetailModalProps) {
    const [dismissNote, setDismissNote] = useState('');
    const [loading, setLoading] = useState(false);

    if (!report) return null;

    const handleDismiss = async () => {
        setLoading(true);
        try {
            await onDismiss(report._id, dismissNote);
            onClose();
        } catch (error) {
            console.error('Dismiss error:', error);
            Alert.alert('Lỗi', 'Không thể bỏ qua báo cáo này');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!onDelete || !report.content) return;

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa nội dung này? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (report.contentType === 'post' || report.contentType === 'comment') {
                                await onDelete(report.contentType, report.contentId);
                            }
                            onClose();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa nội dung');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            'spam': 'Spam/Quảng cáo',
            'harassment': 'Quấy rối',
            'hate_speech': 'Ngôn từ thù ghét',
            'violence': 'Bạo lực',
            'nsfw': '18+ (NSFW)',
            'misinformation': 'Tin sai lệch',
            'scam': 'Lừa đảo',
            'copyright': 'Bản quyền',
            'other': 'Khác'
        };
        return labels[reason] || reason;
    };

    const getAvatarUrl = (user?: UserInfo) => {
        if (!user?.avatar) return null;
        return user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <XStack justifyContent="space-between" alignItems="center" padding="$4" borderBottomWidth={1} borderColor="$gray5">
                        <XStack gap="$2" alignItems="center">
                            <Shield size={20} color="#ef4444" />
                            <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
                        </XStack>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                        {/* Status Badge */}
                        <XStack marginBottom="$4" gap="$2">
                            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                                <Text style={{ color: '#d97706', fontSize: 12, fontWeight: 'bold' }}>
                                    {report.status.toUpperCase()}
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
                                <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}>
                                    ƯU TIÊN: {report.priority}
                                </Text>
                            </View>
                        </XStack>

                        {/* REASON */}
                        <Card bordered padding="$3" marginBottom="$4" backgroundColor="$red2">
                            <YStack gap="$2">
                                <Text style={styles.sectionLabel}>Lý do báo cáo:</Text>
                                <Text style={styles.reasonText}>{getReasonLabel(report.reason)}</Text>
                                {report.description && (
                                    <Text style={styles.descriptionText}>"{report.description}"</Text>
                                )}
                            </YStack>
                        </Card>

                        {/* USERS INVOLVED */}
                        <YStack marginBottom="$4" gap="$3">
                            <Text style={styles.sectionTitle}>Đối tượng liên quan</Text>

                            {/* Reported User (Bị báo cáo) */}
                            <XStack alignItems="center" gap="$3" padding="$3" borderWidth={1} borderColor="$gray5" borderRadius="$4">
                                <Avatar circular size="$4">
                                    <Avatar.Image src={getAvatarUrl(report.reportedUserId) || undefined} />
                                    <Avatar.Fallback backgroundColor="$red5" />
                                </Avatar>
                                <YStack flex={1}>
                                    <Text style={styles.userLabel}>Người bị báo cáo</Text>
                                    <Text style={styles.userName}>{report.reportedUserId?.name || 'Unknown'}</Text>
                                    <Text style={styles.userEmail}>{report.reportedUserId?.email}</Text>
                                </YStack>
                            </XStack>

                            {/* Reporter (Người báo cáo) */}
                            <XStack alignItems="center" gap="$3" padding="$3" borderWidth={1} borderColor="$gray5" borderRadius="$4" backgroundColor="$gray2">
                                <Avatar circular size="$4">
                                    <Avatar.Image src={getAvatarUrl(report.reporterId) || undefined} />
                                    <Avatar.Fallback backgroundColor="$blue5" />
                                </Avatar>
                                <YStack flex={1}>
                                    <Text style={styles.userLabel}>Người báo cáo</Text>
                                    <Text style={styles.userName}>{report.reporterId?.name || 'Unknown'}</Text>
                                    <Text style={styles.userEmail}>{report.reporterId?.email}</Text>
                                </YStack>
                            </XStack>
                        </YStack>

                        {/* CONTENT PREVIEW */}
                        <YStack marginBottom="$4">
                            <Text style={styles.sectionTitle}>Nội dung vi phạm</Text>
                            <View style={styles.contentBox}>
                                <Text style={styles.contentTypeBadge}>
                                    {report.contentType === 'post' ? 'BÀI VIẾT' : 'BÌNH LUẬN'}
                                </Text>

                                <Text style={styles.contentText}>
                                    {report.content?.content || '(Không có nội dung text)'}
                                </Text>

                                {/* Images */}
                                {report.content?.images && report.content.images.length > 0 && (
                                    <ScrollView horizontal style={{ marginTop: 8 }}>
                                        {report.content.images.map((img, idx) => (
                                            <Image
                                                key={idx}
                                                source={{ uri: img.startsWith('http') ? img : `${BASE_URL}${img}` }}
                                                style={{ width: 100, height: 100, borderRadius: 8, marginRight: 8 }}
                                            />
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                            {onDelete && report.status !== 'resolved' && (
                                <Button
                                    marginTop="$2"
                                    backgroundColor="$red10"
                                    color="white"
                                    onPress={handleDelete}
                                    icon={<AlertTriangle size={16} />}
                                >
                                    Xóa nội dung này
                                </Button>
                            )}
                        </YStack>

                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <XStack gap="$3">
                            <Button
                                flex={1}
                                backgroundColor="$gray5"
                                color="$gray11"
                                onPress={onClose}
                                disabled={loading}
                            >
                                Đóng
                            </Button>

                            {report.status !== 'dismissed' && report.status !== 'resolved' && (
                                <Button
                                    flex={1}
                                    backgroundColor="$blue10"
                                    color="white"
                                    onPress={handleDismiss}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang xử lý...' : 'Bỏ qua báo cáo'}
                                </Button>
                            )}
                        </XStack>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 600,
        height: '90%',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8
    },
    sectionLabel: {
        fontSize: 14,
        color: '#7f1d1d',
        fontWeight: '600'
    },
    reasonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#991b1b'
    },
    descriptionText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#7f1d1d',
        marginTop: 4
    },
    userLabel: {
        fontSize: 12,
        color: '#64748b'
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155'
    },
    userEmail: {
        fontSize: 13,
        color: '#94a3b8'
    },
    contentBox: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#cbd5e1'
    },
    contentTypeBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    contentText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: 'white'
    },
    footerNote: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8
    }
});
