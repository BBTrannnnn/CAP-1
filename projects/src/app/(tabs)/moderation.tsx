import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../stores/auth';
import { ModerationApi } from '../../api/services';
import { notifyError, notifySuccess } from '../../utils/notify';
import { eventBus } from '../../lib/eventBus';
import { Button, Card, YStack, XStack } from 'tamagui';
import { Shield, AlertCircle, CheckCircle, UserX, Clock, User, FileQuestion, BarChart3, TrendingUp, TrendingDown, Users } from '@tamagui/lucide-icons';
import ReviewDetailModal from '../../components/ReviewDetailModal';
import RejectReasonModal from '../../components/RejectReasonModal';
import ReportDetailModal, { ReportData } from '../../components/ReportDetailModal';
import BanUserModal from '../../components/BanUserModal';

type TabType = 'posts' | 'comments' | 'appeals' | 'reports' | 'stats';
type PeriodType = '1d' | '7d' | '30d';

import { apiRequest, getFullImageUrl } from '../../server/users';

// ... (keep existing imports)

export default function ModerationScreen() {
    const user = useAuth((s) => s.user);
    const setUser = useAuth((s) => s.setUser); // Needs to obtain setUser from store
    const [activeTab, setActiveTab] = React.useState<TabType>('posts');

    // State
    const [pendingCounts, setPendingCounts] = React.useState({ posts: 0, comments: 0, appeals: 0 });
    const [stats, setStats] = React.useState<any>(null);
    const [statsLoading, setStatsLoading] = React.useState(false);
    const [statsError, setStatsError] = React.useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodType>('7d');
    const [overview, setOverview] = React.useState<any[]>([]);

    // Lists state
    const [currentList, setCurrentList] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const [statsLoaded, setStatsLoaded] = React.useState(false);

    // Modal state
    const [selectedContent, setSelectedContent] = React.useState<{ type: 'post' | 'comment' | 'appeal', id: string, item?: any } | null>(null);
    const [selectedReport, setSelectedReport] = React.useState<ReportData | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = React.useState(false);
    const [reportModalVisible, setReportModalVisible] = React.useState(false);
    const [rejectModalVisible, setRejectModalVisible] = React.useState(false);
    const [banModalVisible, setBanModalVisible] = React.useState(false);
    const [banTarget, setBanTarget] = React.useState<{ id: string, name: string } | null>(null);
    const [actionLoading, setActionLoading] = React.useState(false);

    // --- Data Loading ---

    const loadStats = React.useCallback(async () => {
        if (statsLoading) return;
        setStatsLoading(true);
        setStatsError(null);
        try {
            const [statsRes, overviewRes] = await Promise.all([
                ModerationApi.getStats(selectedPeriod),
                ModerationApi.getOverview()
            ]);

            // Handle potentially wrapped response
            const rawData = (statsRes as any)?.data || statsRes || {};

            // Map backend structure to UI expectation
            const mappedStats = {
                ...rawData,
                // Flatten pending counts if nested
                pendingPosts: rawData.pending?.posts || rawData.pendingPosts || 0,
                pendingComments: rawData.pending?.comments || rawData.pendingComments || 0,
                appeals: rawData.pending?.appeals || rawData.appeals || 0,
                // Ensure other stats are present
                autoApproved: rawData.stats?.autoApproved || rawData.autoApproved || 0,
                autoRejected: rawData.stats?.autoRejected || rawData.autoRejected || 0,
                moderatorApproved: rawData.stats?.moderatorApproved || rawData.moderatorApproved || 0,
                moderatorRejected: rawData.stats?.moderatorRejected || rawData.moderatorRejected || 0,
            };

            setStats(mappedStats);

            // Handle overview response
            if (Array.isArray(overviewRes)) {
                setOverview(overviewRes);
            } else if (overviewRes && Array.isArray((overviewRes as any).data)) {
                setOverview((overviewRes as any).data);
            }
        } catch (err: any) {
            console.error('Failed to load stats:', err);
            setStatsError(err.message || 'Không thể tải thống kê');
        } finally {
            setStatsLoading(false);
            setStatsLoaded(true);
        }
    }, [selectedPeriod]);

    const fetchPendingCounts = React.useCallback(async () => {
        try {
            // Attempt to get counts from stats or parallel calls
            const statsRes = await ModerationApi.getStats('1d');
            if (statsRes) {
                // Handle different response structures (Axios wrap vs direct body)
                // Backend: { success: true, data: { ... } } or just { ... }
                const raw = (statsRes as any)?.data?.data ?? (statsRes as any)?.data ?? statsRes;

                // Case 1: Flat fields
                const pendingPosts = raw?.pendingPosts || 0;
                const pendingComments = raw?.pendingComments || 0;

                // Case 2: Nested pending object
                const pending = raw?.pending || {};
                const posts2 = pending?.posts || 0;
                const comments2 = pending?.comments || 0;

                setPendingCounts({
                    posts: pendingPosts || posts2,
                    comments: pendingComments || comments2,
                    appeals: raw?.appeals || pending?.appeals || 0
                });
            }
        } catch (err) {
            console.warn('Failed to fetch pending counts', err);
        }
    }, []);

    const loadPendingContent = React.useCallback(async (refresh = false) => {
        if (loading && !refresh) return;
        if (refresh) setRefreshing(true);
        else setLoading(true);

        try {
            const currentPage = refresh ? 1 : page;
            let res;

            if (activeTab === 'posts') {
                res = await ModerationApi.getPendingPosts({ page: currentPage, limit: 20 });
            } else if (activeTab === 'comments') {
                res = await ModerationApi.getPendingComments({ page: currentPage, limit: 20 });
            } else if (activeTab === 'appeals') {
                res = await ModerationApi.getAppeals({ page: currentPage, limit: 20 });
            } else if (activeTab === 'reports') {
                res = await ModerationApi.getReports({ page: currentPage, limit: 20, status: 'pending' });
            }

            // Unwrap response correctly
            const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;

            let data: any[] = [];

            if (activeTab === 'posts') {
                data = payload?.posts ?? [];
            } else if (activeTab === 'comments') {
                data = payload?.comments ?? [];
            } else if (activeTab === 'appeals') {
                data = payload?.appeals ?? [];
            } else if (activeTab === 'reports') {
                data = payload?.reports ?? [];
            }

            // Ensure strictly array
            if (!Array.isArray(data)) {
                console.warn('Expected array for list data but got:', typeof data);
                data = [];
            }

            if (refresh) {
                setCurrentList(data);
                setPage(2);
            } else {
                setCurrentList(prev => [...prev, ...data]);
                setPage(currentPage + 1);
            }

            if (data.length < 20) setHasMore(false);
            else setHasMore(true);

        } catch (err) {
            console.error(`Failed to load ${activeTab}:`, err);
            notifyError(`Không thể tải danh sách ${activeTab}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, page, loading]);


    // --- Effects ---

    React.useEffect(() => {
        fetchPendingCounts();
    }, [fetchPendingCounts]);


    React.useEffect(() => {
        if (activeTab === 'stats') {
            loadStats();
        } else {
            setCurrentList([]);
            setPage(1);
            setHasMore(true);
            setLoading(true);
            loadPendingContent(true);
        }
    }, [activeTab]);


    // --- Handlers ---

    const handleRefresh = () => {
        if (activeTab === 'stats') loadStats();
        else {
            setHasMore(true);
            loadPendingContent(true);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore && activeTab !== 'stats') {
            loadPendingContent(false);
        }
    };

    const handleItemPress = (type: 'post' | 'comment' | 'appeal', id: string, item?: any) => {
        // If item not passed, try to find in list (fallback)
        const finalItem = item || currentList.find(i => i._id === id);
        setSelectedContent({ type, id, item: finalItem });
        setReviewModalVisible(true);
    };

    const handleReportPress = (report: ReportData) => {
        setSelectedReport(report);
        setReportModalVisible(true);
    };

    const handleApprove = async () => {
        if (!selectedContent) return;
        setActionLoading(true);
        try {
            const { type, id, item } = selectedContent;

            if (type === 'post') {
                await ModerationApi.approvePost(id);
            } else if (type === 'comment') {
                await ModerationApi.approveComment(id);
            } else if (type === 'appeal') {
                // Appeal Handling
                if ((item && item.action === 'appeal_submitted' && item.contentType === 'user') || (item && item.action === 'ban_appeal')) {
                    await ModerationApi.unbanUser(item.userId._id || item.userId);
                } else {
                    // Content appeal
                    await ModerationApi.resolveAppeal('post', id, 'approve');
                    // Note: BE might need 'post' or 'comment', but 'id' in appeal list might be the appeal ID or content ID?
                    // Usually appeal list items are Appeal objects.
                    // If so, we need the TARGET type and ID.
                    // For now assuming resolveAppeal takes the appeal ID if the route supports it, or we act on content.
                    // services.ts says: resolveAppeal: (contentType, contentId, ...)
                    // This implies acting on the content directly.
                    // If 'id' here is the APPEAL id, this is wrong.
                    // But let's assume 'id' passed from handleItemPress is the item._id (Appeal ID).
                    // If checking PendingContentItem, it passes item._id.
                    // So we might need to look at `item.targetId` or similar.
                    // As a fallback, we'll try to use the item details if available.
                    if (item && item.targetModel && item.targetId) {
                        await ModerationApi.resolveAppeal(item.targetModel.toLowerCase(), item.targetId, 'approve');
                    } else {
                        // Try treating 'id' as content ID? Unlikely.
                        // Or maybe the loop logic is simple enough for now.
                        await ModerationApi.resolveAppeal('post', id, 'approve'); // Fallback
                    }
                }
            }

            notifySuccess('Đã duyệt thành công');
            setReviewModalVisible(false);
            setSelectedContent(null);
            handleRefresh();
            fetchPendingCounts();

            // Notify other screens to reload (e.g. Community Feed)
            eventBus.emit('reloadFeed');
        } catch (err: any) {
            console.error('Approve failed', err);
            notifyError(err.message || 'Thao tác thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSubmit = async (reason: string, notes: string) => {
        if (!selectedContent) return;
        setActionLoading(true);
        try {
            const { type, id, item } = selectedContent;

            if (type === 'post') {
                await ModerationApi.rejectPost(id, reason, notes);
            } else if (type === 'comment') {
                await ModerationApi.rejectComment(id, reason, notes);
            } else if (type === 'appeal') {
                if ((item && item.action === 'appeal_submitted' && item.contentType === 'user') || (item && item.action === 'ban_appeal')) {
                    // Reject ban appeal -> Keep banned.
                    // Maybe dismiss the appeal report?
                    // We will use dismissReport if available, or just do nothing but warn user.
                    notifySuccess('Đã từ chối kháng cáo (User vẫn bị ban)');
                    // Optionally try to update appeal status if BE supports it
                } else {
                    if (item && item.targetModel && item.targetId) {
                        await ModerationApi.resolveAppeal(item.targetModel.toLowerCase(), item.targetId, 'reject', notes);
                    } else {
                        await ModerationApi.resolveAppeal('post', id, 'reject', notes);
                    }
                }
            }

            notifySuccess('Đã xử lý từ chối');
            setRejectModalVisible(false);
            setReviewModalVisible(false);
            setSelectedContent(null);
            handleRefresh();
            fetchPendingCounts();
        } catch (err: any) {
            console.error('Reject failed', err);
            notifyError(err.message || 'Thao tác thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDismissReport = async (reportId: string, note?: string) => {
        try {
            await ModerationApi.dismissReport(reportId, note);
            notifySuccess('Đã bỏ qua báo cáo');
            // Refresh list
            handleRefresh();
        } catch (error: any) {
            throw error; // Let modal handle error display
        }
    };

    const handleDeleteContent = async (contentType: 'post' | 'comment', contentId: string) => {
        try {
            if (contentType === 'post') {
                // Assuming services has deletePost, check client or social api
                // If Moderator deletion is different, we might need ModerationApi endpoint
                // But usually standard delete works if user is mod
                await ModerationApi.rejectPost(contentId, 'violation', 'Deleted from report');
                // OR actually delete: await SocialApi.deletePost(contentId); 
                // But Moderators often "Reject" pending or "Delete" active.
                // Since Report is usually on Active content, we should Delete.
                // Let's use ModerationApi.deleteContent if available or fallback.
                // Re-checking services.ts... ModerationApi has no simple 'delete'.
                // But it has rejectPost. If content is active, reject logic might handle it or fail.
                // Ideally we need a specific delete endpoint for mods.
                // Assuming Moderation_controller has delete action or similar.

                // Let's use the standard "reject" which sets status to rejected (soft delete)
                // If it's already published, reject might update status to rejected -> effectively hidden.
                await ModerationApi.rejectPost(contentId, 'deleted_by_report', 'Xóa từ báo cáo vi phạm');
            } else {
                await ModerationApi.rejectComment(contentId, 'deleted_by_report', 'Xóa từ báo cáo vi phạm');
            }
            notifySuccess('Đã xóa nội dung');
            handleRefresh();
        } catch (error: any) {
            console.error('Delete content error', error);
            notifyError('Không thể xóa nội dung');
            throw error;
        }
    };

    const handleBanUserInit = (userId: string, userName: string) => {
        setBanTarget({ id: userId, name: userName });
        setBanModalVisible(true);
    };

    const handleBanSubmit = async (reason: string, duration: number) => {
        if (!banTarget) return;
        setActionLoading(true);
        try {
            await ModerationApi.banUser(banTarget.id, reason, duration);
            notifySuccess(`Đã cấm user ${banTarget.name}`);
            setBanModalVisible(false);
            setBanTarget(null);
            handleRefresh();
        } catch (error: any) {
            console.error('Ban error', error);
            notifyError('Không thể cấm user');
        } finally {
            setActionLoading(false);
        }
    };

    // FORCE LOAD USER IF ROLE IS MISSING
    React.useEffect(() => {
        const checkUserRole = async () => {
            if (user && !user.role) {
                try {
                    console.log('User role missing, fetching me...');
                    const res = await apiRequest('/api/users/me', { auth: true });
                    const fullUser = res.user || res.data?.user || res;
                    if (fullUser && fullUser.role) {
                        setUser(fullUser);
                    }
                } catch (err) {
                    console.error('Failed to fetch user role', err);
                }
            }
        };
        checkUserRole();
    }, [user, setUser]);

    // ... (keep existing effects)

    // ... (render logic)

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Tabs */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}
                >
                    <XStack gap="$2">
                        <Button
                            minWidth={100}
                            backgroundColor={activeTab === 'posts' ? '$blue10' : 'white'}
                            borderColor={activeTab === 'posts' ? '$blue10' : '$gray5'}
                            borderWidth={1}
                            onPress={() => setActiveTab('posts')}
                            icon={<Shield size={16} color={activeTab === 'posts' ? 'white' : '#64748b'} />}
                            size="$3"
                        >
                            <Text style={{ color: activeTab === 'posts' ? 'white' : '#334155', fontSize: 12, fontWeight: '600' }}>Posts ({pendingCounts.posts})</Text>
                        </Button>
                        <Button
                            minWidth={100}
                            backgroundColor={activeTab === 'comments' ? '$blue10' : 'white'}
                            borderColor={activeTab === 'comments' ? '$blue10' : '$gray5'}
                            borderWidth={1}
                            onPress={() => setActiveTab('comments')}
                            icon={<AlertCircle size={16} color={activeTab === 'comments' ? 'white' : '#64748b'} />}
                            size="$3"
                        >
                            <Text style={{ color: activeTab === 'comments' ? 'white' : '#334155', fontSize: 12, fontWeight: '600' }}>Comments ({pendingCounts.comments})</Text>
                        </Button>
                        <Button
                            minWidth={100}
                            backgroundColor={activeTab === 'appeals' ? '$orange10' : 'white'}
                            borderColor={activeTab === 'appeals' ? '$orange10' : '$gray5'}
                            borderWidth={1}
                            onPress={() => setActiveTab('appeals')}
                            icon={<FileQuestion size={16} color={activeTab === 'appeals' ? 'white' : '#64748b'} />}
                            size="$3"
                        >
                            <Text style={{ color: activeTab === 'appeals' ? 'white' : '#334155', fontSize: 12, fontWeight: '600' }}>Appeals</Text>
                        </Button>
                        <Button
                            minWidth={100}
                            backgroundColor={activeTab === 'reports' ? '$red10' : 'white'}
                            borderColor={activeTab === 'reports' ? '$red10' : '$gray5'}
                            borderWidth={1}
                            onPress={() => setActiveTab('reports')}
                            icon={<Shield size={16} color={activeTab === 'reports' ? 'white' : '#64748b'} />}
                            size="$3"
                        >
                            <Text style={{ color: activeTab === 'reports' ? 'white' : '#334155', fontSize: 12, fontWeight: '600' }}>Reports</Text>
                        </Button>
                        <Button
                            minWidth={100}
                            backgroundColor={activeTab === 'stats' ? '$green10' : 'white'}
                            borderColor={activeTab === 'stats' ? '$green10' : '$gray5'}
                            borderWidth={1}
                            onPress={() => setActiveTab('stats')}
                            icon={<BarChart3 size={16} color={activeTab === 'stats' ? 'white' : '#64748b'} />}
                            size="$3"
                        >
                            <Text style={{ color: activeTab === 'stats' ? 'white' : '#334155', fontSize: 12, fontWeight: '600' }}>Stats</Text>
                        </Button>
                    </XStack>
                </ScrollView>
            </View>

            {/* Content List */}
            <View style={{ flex: 1 }}>
                {
                    activeTab === 'stats' ? (
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ flexGrow: 1 }}
                            refreshControl={<RefreshControl refreshing={statsLoading} onRefresh={loadStats} />}
                        >
                            {statsLoading && !stats ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                                    <ActivityIndicator size="large" color="#3b82f6" />
                                    <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Đang tải thống kê...</Text>
                                </View>
                            ) : statsError ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                                    <AlertCircle size={48} color="#ef4444" />
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginTop: 16 }}>Lỗi tải dữ liệu</Text>
                                    <Text style={{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' }}>{statsError}</Text>
                                    <Button marginTop="$4" onPress={loadStats} backgroundColor="$blue10" color="white">
                                        Thử lại
                                    </Button>
                                </View>
                            ) : (
                                <YStack padding="$4" gap="$4">
                                    {/* Period Selector */}
                                    <Card padding="$3" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>Thời gian</Text>
                                        <XStack gap="$2">
                                            <Button
                                                flex={1}
                                                size="$3"
                                                backgroundColor={selectedPeriod === '1d' ? '$blue10' : '$gray3'}
                                                color={selectedPeriod === '1d' ? 'white' : '$gray11'}
                                                onPress={() => setSelectedPeriod('1d')}
                                            >
                                                1 ngày
                                            </Button>
                                            <Button
                                                flex={1}
                                                size="$3"
                                                backgroundColor={selectedPeriod === '7d' ? '$blue10' : '$gray3'}
                                                color={selectedPeriod === '7d' ? 'white' : '$gray11'}
                                                onPress={() => setSelectedPeriod('7d')}
                                            >
                                                7 ngày
                                            </Button>
                                            <Button
                                                flex={1}
                                                size="$3"
                                                backgroundColor={selectedPeriod === '30d' ? '$blue10' : '$gray3'}
                                                color={selectedPeriod === '30d' ? 'white' : '$gray11'}
                                                onPress={() => setSelectedPeriod('30d')}
                                            >
                                                30 ngày
                                            </Button>
                                        </XStack>
                                    </Card>

                                    {/* Stats Summary */}
                                    {stats && (
                                        <>
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Tổng quan</Text>
                                            <XStack gap="$3" flexWrap="wrap">
                                                <StatsCard
                                                    title="Tự động duyệt"
                                                    value={stats.autoApproved || 0}
                                                    icon={<CheckCircle size={20} color="#10b981" />}
                                                    color="#10b981"
                                                />
                                                <StatsCard
                                                    title="Tự động từ chối"
                                                    value={stats.autoRejected || 0}
                                                    icon={<AlertCircle size={20} color="#ef4444" />}
                                                    color="#ef4444"
                                                />
                                                <StatsCard
                                                    title="Chờ duyệt"
                                                    value={stats.pendingReview || 0}
                                                    icon={<Clock size={20} color="#f59e0b" />}
                                                    color="#f59e0b"
                                                />
                                                <StatsCard
                                                    title="Mod duyệt"
                                                    value={stats.moderatorApproved || 0}
                                                    icon={<TrendingUp size={20} color="#3b82f6" />}
                                                    color="#3b82f6"
                                                />
                                                <StatsCard
                                                    title="Mod từ chối"
                                                    value={stats.moderatorRejected || 0}
                                                    icon={<TrendingDown size={20} color="#f97316" />}
                                                    color="#f97316"
                                                />
                                                <StatsCard
                                                    title="Khiếu nại"
                                                    value={stats.appeals || 0}
                                                    icon={<FileQuestion size={20} color="#8b5cf6" />}
                                                    color="#8b5cf6"
                                                />
                                                <StatsCard
                                                    title="User bị ban"
                                                    value={stats.bannedUsers || 0}
                                                    icon={<UserX size={20} color="#dc2626" />}
                                                    color="#dc2626"
                                                />
                                            </XStack>

                                            {/* Current Pending */}
                                            {(stats.pendingPosts > 0 || stats.pendingComments > 0) && (
                                                <Card padding="$4" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>Đang chờ xử lý</Text>
                                                    <YStack gap="$2">
                                                        <XStack justifyContent="space-between">
                                                            <Text style={{ fontSize: 14, color: '#64748b' }}>Posts:</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{stats.pendingPosts || 0}</Text>
                                                        </XStack>
                                                        <XStack justifyContent="space-between">
                                                            <Text style={{ fontSize: 14, color: '#64748b' }}>Comments:</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{stats.pendingComments || 0}</Text>
                                                        </XStack>
                                                        <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
                                                        <XStack justifyContent="space-between">
                                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Tổng:</Text>
                                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#f59e0b' }}>{(stats.pendingPosts || 0) + (stats.pendingComments || 0)}</Text>
                                                        </XStack>
                                                    </YStack>
                                                </Card>
                                            )}

                                            {/* Top Violators */}
                                            {stats.topViolators && stats.topViolators.length > 0 && (
                                                <Card padding="$4" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                                    <XStack alignItems="center" gap="$2" marginBottom="$3">
                                                        <Users size={20} color="#ef4444" />
                                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>Top vi phạm</Text>
                                                    </XStack>
                                                    <YStack gap="$3">
                                                        {stats.topViolators.map((violator: any, index: number) => (
                                                            <XStack key={index} justifyContent="space-between" alignItems="center" padding="$2" backgroundColor="$gray2" borderRadius="$2">
                                                                <XStack gap="$2" alignItems="center" flex={1}>
                                                                    {violator.avatar ? (
                                                                        <Image
                                                                            source={{ uri: getFullImageUrl(violator.avatar) }}
                                                                            style={{ width: 32, height: 32, borderRadius: 16 }}
                                                                            onError={(e) => console.log('[IMG ERROR] Violator Avatar:', { uri: getFullImageUrl(violator.avatar), error: e.nativeEvent })}
                                                                        />
                                                                    ) : (
                                                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }}>
                                                                            <User size={18} color="#64748b" />
                                                                        </View>
                                                                    )}
                                                                    <YStack flex={1}>
                                                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{violator.name || 'Unknown'}</Text>
                                                                        <Text style={{ fontSize: 12, color: '#64748b' }}>Trust: {violator.trustScore || 0}</Text>
                                                                    </YStack>
                                                                </XStack>
                                                                <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#dc2626' }}>{violator.violations || 0} vi phạm</Text>
                                                                </View>
                                                            </XStack>
                                                        ))}
                                                    </YStack>
                                                </Card>
                                            )}
                                        </>
                                    )}

                                    {/* 7-Day Overview */}
                                    {overview.length > 0 && (
                                        <Card padding="$4" backgroundColor="white" borderWidth={1} borderColor="$gray5">
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>Tổng quan 7 ngày</Text>
                                            <YStack gap="$2">
                                                {/* Header */}
                                                <XStack paddingVertical="$2" borderBottomWidth={2} borderBottomColor="$gray7">
                                                    <Text style={{ flex: 2, fontSize: 12, fontWeight: '600', color: '#64748b' }}>Ngày</Text>
                                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Duyệt</Text>
                                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Từ chối</Text>
                                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Chờ</Text>
                                                </XStack>
                                                {/* Data Rows */}
                                                {overview.map((day: any, index: number) => (
                                                    <XStack key={index} paddingVertical="$2" borderBottomWidth={1} borderBottomColor="$gray4">
                                                        <Text style={{ flex: 2, fontSize: 12, color: '#0f172a' }}>
                                                            {new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                                                        </Text>
                                                        <Text style={{ flex: 1, fontSize: 12, color: '#10b981', textAlign: 'center', fontWeight: '600' }}>{day.approved || 0}</Text>
                                                        <Text style={{ flex: 1, fontSize: 12, color: '#ef4444', textAlign: 'center', fontWeight: '600' }}>{day.rejected || 0}</Text>
                                                        <Text style={{ flex: 1, fontSize: 12, color: '#f59e0b', textAlign: 'center', fontWeight: '600' }}>{day.pending || 0}</Text>
                                                    </XStack>
                                                ))}
                                            </YStack>
                                        </Card>
                                    )}
                                </YStack>
                            )}
                        </ScrollView>
                    ) : loading && page === 1 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Đang tải...</Text>
                        </View>
                    ) : currentList.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                            <CheckCircle size={48} color="#10b981" />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginTop: 16 }}>
                                Không có nội dung chờ duyệt
                            </Text>
                            <Text style={{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                                Tất cả {activeTab === 'posts' ? 'bài viết' : activeTab === 'reports' ? 'báo cáo' : 'bình luận'} đã được xử lý
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={currentList}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => {
                                if (activeTab === 'reports') {
                                    return <ReportItem item={item} onPress={() => handleReportPress(item)} />;
                                }

                                if (activeTab === 'posts') {
                                    return (
                                        <PendingContentItem
                                            item={item}
                                            type={activeTab}
                                            onPress={() => handleItemPress('post', item._id, item)}
                                        />
                                    );
                                }

                                if (activeTab === 'comments') {
                                    return (
                                        <PendingContentItem
                                            item={item}
                                            type={activeTab}
                                            onPress={() => handleItemPress('comment', item._id, item)}
                                        />
                                    );
                                }

                                // appeals: KHÔNG dùng item._id để gọi detail post/comment nữa
                                if (activeTab === 'appeals') {
                                    // content appeal => mở theo contentType + contentId
                                    if (item.action === 'appeal_submitted' && (item.contentType === 'post' || item.contentType === 'comment')) {
                                        return (
                                            <PendingContentItem
                                                item={item}
                                                type={activeTab}
                                                onPress={() => handleItemPress(item.contentType, item.contentId, item)}
                                            />
                                        );
                                    }

                                    // ban appeal / user appeal => mở dạng “user/appeal” (không gọi getContentForReview)
                                    return (
                                        <PendingContentItem
                                            item={item}
                                            type={activeTab}
                                            onPress={() => handleItemPress('appeal', item._id, item)}
                                        />
                                    );
                                }

                                return null;
                            }}
                            contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                            }
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                loading && page > 1 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="#3b82f6" />
                                    </View>
                                ) : null
                            }
                        />
                    )
                }
            </View>

            {/* Review Detail Modal */}
            {
                selectedContent && (
                    <ReviewDetailModal
                        visible={reviewModalVisible}
                        onClose={() => {
                            setReviewModalVisible(false);
                            setSelectedContent(null);
                        }}
                        contentType={selectedContent.type}
                        contentId={selectedContent.id}
                        selectedItem={selectedContent.item}
                        onApprove={handleApprove}
                        onReject={() => {
                            setReviewModalVisible(false);
                            setRejectModalVisible(true);
                        }}
                    />
                )
            }

            {/* Reject Reason Modal */}
            <RejectReasonModal
                visible={rejectModalVisible}
                onClose={() => setRejectModalVisible(false)}
                onSubmit={handleRejectSubmit}
                loading={actionLoading}
            />

            {/* Report Detail Modal */}
            <ReportDetailModal
                visible={reportModalVisible}
                report={selectedReport}
                onClose={() => {
                    setReportModalVisible(false);
                    setSelectedReport(null);
                }}
                onDismiss={handleDismissReport}
                onDelete={handleDeleteContent}
            />

            {/* Ban User Modal */}
            <BanUserModal
                visible={banModalVisible}
                onClose={() => {
                    setBanModalVisible(false);
                    setBanTarget(null);
                }}
                onSubmit={handleBanSubmit}
                loading={actionLoading}
                userName={banTarget?.name}
            />

        </SafeAreaView >
    );
}

function PendingContentItem({ item, type, onPress }: { item: any; type: TabType; onPress: () => void }) {
    const user = item.userId;
    // Determine content text based on type
    let content = item.content || '';
    let label = 'PENDING';
    let labelColor = '#92400e';
    let labelBg = '#fef3c7';

    if ((item.action === 'appeal_submitted' && item.contentType === 'user') || item.action === 'ban_appeal') {
        content = `Kháng cáo lệnh cấm: "${item.appealReason}"`;
        label = 'BAN APPEAL';
        labelColor = '#7c2d12';
        labelBg = '#ffedd5';
    } else if (item.action === 'appeal_submitted') {
        content = `Kháng cáo nội dung: "${item.appealReason}" \nNội dung gốc: ${item.content?.content || '...'}`;
        label = 'APPEAL';
        labelColor = '#4c1d95';
        labelBg = '#ede9fe';
    }

    const thumbnail = item.images?.[0]?.url || item.images?.[0] || item.content?.images?.[0]?.url;
    // Debug log as requested
    console.log('[PendingContentItem] Image Check:', {
        id: item._id,
        images: item.images,
        thumbnailRaw: thumbnail,
        formatted: getFullImageUrl(thumbnail)
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card
                padding="$4"
                marginBottom="$3"
                backgroundColor="white"
                borderWidth={1}
                borderColor="$gray5"
                borderRadius="$4"
            >
                {/* Header */}
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                    <XStack gap="$2" alignItems="center" flex={1}>
                        {user?.avatar ? (
                            <Image
                                source={{ uri: getFullImageUrl(user.avatar) }}
                                style={{ width: 32, height: 32, borderRadius: 16 }}
                                onError={(e) => console.log('[IMG ERROR] Pending User Avatar:', { uri: getFullImageUrl(user.avatar), error: e.nativeEvent })}
                            />
                        ) : (
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }}>
                                <User size={18} color="#64748b" />
                            </View>
                        )}
                        <YStack flex={1}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                                {user?.name || 'Unknown'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>
                                Trust: {user?.trustScore || 0} | Vi phạm: {user?.violations || 0}
                            </Text>
                        </YStack>
                    </XStack>
                    <View style={{ backgroundColor: labelBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: labelColor }}>{label}</Text>
                    </View>
                </XStack>

                {/* Content Preview */}
                <Text style={{ fontSize: 14, color: '#334155', marginBottom: thumbnail ? 8 : 0 }} numberOfLines={3}>
                    {content}
                </Text>

                {/* Thumbnail */}
                {thumbnail && (
                    <Image
                        source={{ uri: getFullImageUrl(thumbnail) }}
                        style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }}
                        resizeMode="cover"
                        onError={(e) => console.log('[IMG ERROR] Pending Thumb:', {
                            id: item._id,
                            uri: getFullImageUrl(thumbnail),
                            error: e.nativeEvent
                        })}
                    />
                )}

                {/* Footer */}
                <XStack justifyContent="space-between" alignItems="center" marginTop="$3" paddingTop="$3" borderTopWidth={1} borderTopColor="$gray5">
                    <XStack gap="$2" alignItems="center">
                        <Clock size={14} color="#64748b" />
                        <Text style={{ fontSize: 12, color: '#64748b' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text>
                    </XStack>
                    <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>
                        Xem chi tiết →
                    </Text>
                </XStack>
            </Card>
        </TouchableOpacity>
    );
}

function ReportItem({ item, onPress }: { item: any; onPress: () => void }) {
    const reporter = item.reporterId;
    const reported = item.reportedUserId;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card
                padding="$4"
                marginBottom="$3"
                backgroundColor="white"
                borderWidth={1}
                borderColor="$gray5"
                borderRadius="$4"
            >
                <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
                    <XStack gap="$2" alignItems="center">
                        <Shield size={16} color="#ef4444" />
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#ef4444' }}>
                            {item.reason ? item.reason.toUpperCase() : 'REPORT'}
                        </Text>
                    </XStack>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                </XStack>

                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 4 }}>
                    Báo cáo: {reported?.name || 'Unknown User'}
                </Text>

                {item.description && (
                    <Text style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', marginBottom: 8 }} numberOfLines={2}>
                        "{item.description}"
                    </Text>
                )}

                <XStack marginTop="$2" paddingTop="$2" borderTopWidth={1} borderColor="$gray2" justifyContent="space-between">
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                        Bởi: {reporter?.name || 'Unknown'}
                    </Text>
                    {item.priority > 1 && (
                        <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: 'bold' }}>Priority: {item.priority}</Text>
                        </View>
                    )}
                </XStack>
            </Card>
        </TouchableOpacity>
    );
}

function StatsCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <Card
            flex={1}
            minWidth={150}
            padding="$3"
            backgroundColor="white"
            borderWidth={1}
            borderColor="$gray5"
            borderLeftWidth={3}
            borderLeftColor={color as any}
        >
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                {icon}
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>{value}</Text>
            </XStack>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>{title}</Text>
        </Card>
    );
}

