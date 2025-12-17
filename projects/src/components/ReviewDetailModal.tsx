import React from 'react';
import { Modal, View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Button, XStack, YStack, Card } from 'tamagui';
import { X, User, AlertTriangle, CheckCircle, Clock, UserX, Shield } from '@tamagui/lucide-icons';
import { notifyError, notifySuccess } from '../utils/notify';
import { ModerationApi } from '../api/services';
import BanUserModal from './BanUserModal';
import TrustScoreBadge from './TrustScoreBadge';

interface ReviewDetailModalProps {
    visible: boolean;
    onClose: () => void;
    contentType: 'post' | 'comment' | 'appeal' | 'user';
    contentId: string;
    selectedItem?: any;
    onApprove: (item?: any) => void;
    onReject: (item?: any) => void;
}

export default function ReviewDetailModal({
    visible,
    onClose,
    contentType,
    contentId,
    selectedItem,
    onApprove,
    onReject
}: ReviewDetailModalProps) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<any>(null);
    const [banModalVisible, setBanModalVisible] = React.useState(false);
    const [banLoading, setBanLoading] = React.useState(false);

    React.useEffect(() => {
        if (visible && contentId) {
            loadContentDetail();
        }
    }, [visible, contentId]);

    const loadContentDetail = async () => {
        setLoading(true);
        try {
            if (contentType === 'appeal' && selectedItem) {
                // Determine target from selectedItem
                let targetType = selectedItem.contentType;
                let targetId = selectedItem.contentId;

                // If ban appeal, target is the user
                if (targetType === 'user' || selectedItem.action === 'ban_appeal') {
                    targetType = 'user';
                    if (selectedItem.userId && selectedItem.userId._id) {
                        targetId = selectedItem.userId._id;
                    } else if (selectedItem.userId) {
                        targetId = selectedItem.userId;
                    }
                }

                if (targetType && targetId) {
                    // Logic: we want to display the appeal itself primarily.
                    // But typically we also want underlying target info.
                    // The user requested: "if type is 'appeal', dont call API post/comment"

                    // Actually, if we follow the explicit instruction from user:
                    /*
                    if (contentType === 'appeal') {
                        setData({ content: selectedItem, logs: [] });
                        return;
                    }
                    */

                    // Let's implement EXACTLY that simplicity to avoid recursion or confusion.
                    // The previous complexity was likely overkill causing the bug.

                    const appealData = {
                        content: {
                            userId: selectedItem?.userId,
                            content: `Kháng cáo: ${selectedItem?.appealReason}`,
                            // Map other fields if needed, or just let it be generic
                        },
                        logs: [], // No logs for the appeal wrapper itself
                        userStats: {
                            trustScore: selectedItem?.userId?.trustScore,
                            violations: selectedItem?.userId?.violations,
                            isBanned: selectedItem?.userId?.isBanned
                        }
                    };
                    setData(appealData);
                } else {
                    console.error('Could not determine target from appeal', selectedItem);
                    notifyError('Lỗi', 'Không thể xác định nội dung khiếu nại');
                }
            } else {
                // Standard post/comment review
                const response = await ModerationApi.getContentDetail(contentType, contentId);
                setData(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load content detail:', error);
            // Don't show error if 404 and we're just closing
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (reason: string, duration: number) => {
        if (!data?.content?.userId?._id) return;

        setBanLoading(true);
        try {
            await ModerationApi.banUser(data.content.userId._id, reason, duration);
            const durationText = duration === 0 ? 'vĩnh viễn' : `${duration} ngày`;
            notifySuccess('Thành công', `Đã cấm người dùng ${durationText}`);
            setBanModalVisible(false);
            loadContentDetail(); // Refresh to show updated ban status
        } catch (error: any) {
            notifyError('Lỗi', error.message || 'Không thể cấm người dùng');
        } finally {
            setBanLoading(false);
        }
    };

    const handleUnbanUser = async () => {
        if (!data?.content?.userId?._id) return;

        Alert.alert(
            'Xác nhận',
            'Bạn có chắc muốn gỡ cấm người dùng này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Gỡ cấm',
                    onPress: async () => {
                        try {
                            await ModerationApi.unbanUser(data.content.userId._id);
                            notifySuccess('Thành công', 'Đã gỡ cấm người dùng');
                            loadContentDetail(); // Refresh
                        } catch (error: any) {
                            notifyError('Lỗi', error.message || 'Không thể gỡ cấm');
                        }
                    }
                }
            ]
        );
    };

    const content = data?.content;
    const userStats = data?.userStats;
    const logs = data?.logs || [];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <XStack justifyContent="space-between" alignItems="center" marginBottom="$4" paddingHorizontal="$4" paddingTop="$4">
                        <Text style={styles.title}>Chi tiết {contentType === 'post' ? 'bài viết' : 'bình luận'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </XStack>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.loadingText}>Đang tải...</Text>
                        </View>
                    ) : data ? (
                        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 20 }}>
                            {/* Content Section */}
                            <Card padding="$4" marginHorizontal="$4" marginBottom="$3" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                <Text style={styles.sectionTitle}>Nội dung</Text>
                                <Text style={styles.contentText}>{content?.content || 'Không có nội dung'}</Text>

                                {/* Images */}
                                {content?.images && content.images.length > 0 && (
                                    <YStack marginTop="$3" gap="$2">
                                        {content.images.map((img: any, idx: number) => (
                                            <Image
                                                key={idx}
                                                source={{ uri: img.url || img }}
                                                style={styles.contentImage}
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </YStack>
                                )}
                            </Card>

                            {/* Moderation Scores */}
                            {content?.moderationScore && (
                                <Card padding="$4" marginHorizontal="$4" marginBottom="$3" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                    <Text style={styles.sectionTitle}>Điểm kiểm duyệt</Text>
                                    <XStack gap="$3" marginTop="$2">
                                        <ScoreBadge label="Profanity" score={content.moderationScore.profanity || 0} />
                                        <ScoreBadge label="NSFW" score={content.moderationScore.nsfw || 0} />
                                    </XStack>
                                </Card>
                            )}

                            {/* User Stats */}
                            {userStats && (
                                <Card padding="$4" marginHorizontal="$4" marginBottom="$3" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                    <Text style={styles.sectionTitle}>Thông tin người dùng</Text>

                                    {/* Trust Score Badge */}
                                    <YStack marginTop="$2" marginBottom="$3">
                                        <TrustScoreBadge score={userStats.trustScore || 70} size="medium" />
                                    </YStack>

                                    <YStack gap="$2">
                                        <StatRow label="Vi phạm" value={userStats.violations || 0} />
                                        <StatRow label="Báo cáo" value={userStats.reportCount || 0} />
                                    </YStack>

                                    {/* Ban/Unban Buttons */}
                                    <YStack gap="$2" marginTop="$3">
                                        {userStats.isBanned ? (
                                            <>
                                                <View style={styles.bannedBadge}>
                                                    <Text style={styles.bannedText}>🚫 Người dùng đã bị cấm</Text>
                                                </View>
                                                <Button
                                                    size="$3"
                                                    backgroundColor="$green10"
                                                    color="white"
                                                    onPress={handleUnbanUser}
                                                    icon={<Shield size={16} color="white" />}
                                                >
                                                    Gỡ cấm
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="$3"
                                                backgroundColor="$red10"
                                                color="white"
                                                onPress={() => setBanModalVisible(true)}
                                                icon={<UserX size={16} color="white" />}
                                            >
                                                Cấm người dùng
                                            </Button>
                                        )}
                                    </YStack>
                                </Card>
                            )}

                            {/* Moderation Logs */}
                            {logs.length > 0 && (
                                <Card padding="$4" marginHorizontal="$4" marginBottom="$3" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                    <Text style={styles.sectionTitle}>Lịch sử kiểm duyệt</Text>
                                    <YStack gap="$3" marginTop="$2">
                                        {logs.map((log: any, idx: number) => (
                                            <LogItem key={idx} log={log} />
                                        ))}
                                    </YStack>
                                </Card>
                            )}
                        </ScrollView>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.errorText}>Không thể tải dữ liệu</Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    {!loading && data && (
                        <XStack gap="$3" padding="$4" borderTopWidth={1} borderTopColor="$gray5">
                            <Button
                                flex={1}
                                backgroundColor="$green10"
                                color="white"
                                onPress={onApprove}
                                icon={<CheckCircle size={18} color="white" />}
                            >
                                Phê duyệt
                            </Button>
                            <Button
                                flex={1}
                                backgroundColor="$red10"
                                color="white"
                                onPress={onReject}
                                icon={<AlertTriangle size={18} color="white" />}
                            >
                                Từ chối
                            </Button>
                        </XStack>
                    )}

                    {/* Ban User Modal */}
                    <BanUserModal
                        visible={banModalVisible}
                        onClose={() => setBanModalVisible(false)}
                        onSubmit={handleBanUser}
                        loading={banLoading}
                        userName={data?.content?.userId?.name}
                    />
                </View>
            </View>
        </Modal>
    );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
    const color = score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981';
    return (
        <View style={[styles.scoreBadge, { backgroundColor: color + '20', borderColor: color }]}>
            <Text style={[styles.scoreBadgeText, { color }]}>{label}: {score}%</Text>
        </View>
    );
}

function StatRow({ label, value }: { label: string; value: any }) {
    return (
        <XStack justifyContent="space-between">
            <Text style={styles.statLabel}>{label}:</Text>
            <Text style={styles.statValue}>{value}</Text>
        </XStack>
    );
}

function LogItem({ log }: { log: any }) {
    const getIcon = () => {
        switch (log.action) {
            case 'pending_review': return <Clock size={16} color="#f59e0b" />;
            case 'auto_approved': return <CheckCircle size={16} color="#10b981" />;
            case 'auto_rejected': return <AlertTriangle size={16} color="#ef4444" />;
            default: return <User size={16} color="#64748b" />;
        }
    };

    return (
        <XStack gap="$2" alignItems="flex-start">
            {getIcon()}
            <YStack flex={1}>
                <Text style={styles.logAction}>{log.action}</Text>
                {log.reason && <Text style={styles.logReason}>{log.reason}</Text>}
                <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString('vi-VN')}</Text>
            </YStack>
        </XStack>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
    },
    scrollContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 8,
    },
    contentText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
    },
    contentImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
    },
    scoreBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    logAction: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0f172a',
    },
    logReason: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    logTime: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    bannedBadge: {
        backgroundColor: '#fee2e2',
        padding: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#dc2626',
    },
    bannedText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#991b1b',
    },
});
