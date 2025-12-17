// Admin Role Management Screen
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, YStack, XStack } from 'tamagui';
import { Shield, User, CheckCircle, AlertCircle } from '@tamagui/lucide-icons';
import { useAuth } from '../../stores/auth';
import { apiRequest } from '../../server/users';
import { router } from 'expo-router';
import { notifyError, notifySuccess } from '../../utils/notify';

export default function RoleManagementScreen() {
    const user = useAuth((s) => s.user);
    const [users, setUsers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);

    React.useEffect(() => {
        if (user && user.role === 'admin') {
            loadUsers();
        }
    }, [user]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await apiRequest('/api/admin/users?page=1&limit=50', {
                method: 'GET',
                auth: true
            });

            const usersList = response?.data?.users || response?.users || [];
            setUsers(usersList);
        } catch (error: any) {
            console.error('Failed to load users:', error);
            notifyError('Lỗi', 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
        Alert.alert(
            'Xác nhận',
            `Bạn có chắc muốn thay đổi role thành "${newRole}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            await apiRequest(`/api/admin/users/${userId}/role`, {
                                method: 'PATCH',
                                auth: true,
                                body: { role: newRole }
                            });

                            notifySuccess('Thành công', 'Đã cập nhật role');
                            loadUsers(); // Refresh list
                        } catch (error: any) {
                            notifyError('Lỗi', error.message || 'Không thể cập nhật role');
                        }
                    }
                }
            ]
        );
    };

    // Access control
    if (!user || user.role !== 'admin') {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <AlertCircle size={48} color="#ef4444" />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16 }}>
                    Truy cập bị từ chối
                </Text>
                <Text style={{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                    Chỉ Admin mới có thể quản lý role người dùng
                </Text>
                <Button marginTop="$4" onPress={() => router.back()} backgroundColor="$blue10" color="white">
                    Quay lại
                </Button>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <XStack alignItems="center" gap="$2">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ fontSize: 16, color: '#3b82f6' }}>← Quay lại</Text>
                    </TouchableOpacity>
                </XStack>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>
                    Quản lý Role
                </Text>
                <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                    Cấp quyền moderator/admin cho người dùng
                </Text>
            </View>

            {/* User List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <UserRoleCard
                            user={item}
                            onUpdateRole={handleUpdateRole}
                            currentUserId={user._id}
                        />
                    )}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                />
            )}
        </SafeAreaView>
    );
}

function UserRoleCard({ user, onUpdateRole, currentUserId }: { user: any; onUpdateRole: (userId: string, role: 'user' | 'moderator' | 'admin') => void; currentUserId: string }) {
    const isCurrentUser = user._id === currentUserId;

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return '#dc2626';
            case 'moderator': return '#3b82f6';
            default: return '#64748b';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield size={16} color="white" />;
            case 'moderator': return <Shield size={16} color="white" />;
            default: return <User size={16} color="white" />;
        }
    };

    return (
        <Card
            padding="$4"
            marginBottom="$3"
            backgroundColor="white"
            borderWidth={1}
            borderColor="$gray5"
            borderRadius="$4"
        >
            {/* User Info */}
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                <YStack flex={1}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>
                        {user.name} {isCurrentUser && '(Bạn)'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                        {user.email}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        Trust Score: {user.trustScore || 70}
                    </Text>
                </YStack>

                {/* Current Role Badge */}
                <View style={{
                    backgroundColor: getRoleColor(user.role),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                }}>
                    {getRoleIcon(user.role)}
                    <Text style={{ fontSize: 12, fontWeight: '600', color: 'white', textTransform: 'uppercase' }}>
                        {user.role}
                    </Text>
                </View>
            </XStack>

            {/* Role Change Buttons */}
            {!isCurrentUser && (
                <YStack gap="$2">
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>
                        Thay đổi role:
                    </Text>
                    <XStack gap="$2">
                        <Button
                            flex={1}
                            size="$3"
                            backgroundColor={user.role === 'user' ? '$gray5' : '$gray3'}
                            color={user.role === 'user' ? '$gray11' : '$gray12'}
                            onPress={() => onUpdateRole(user._id, 'user')}
                            disabled={user.role === 'user'}
                        >
                            User
                        </Button>
                        <Button
                            flex={1}
                            size="$3"
                            backgroundColor={user.role === 'moderator' ? '$blue10' : '$blue3'}
                            color={user.role === 'moderator' ? 'white' : '$blue11'}
                            onPress={() => onUpdateRole(user._id, 'moderator')}
                            disabled={user.role === 'moderator'}
                        >
                            Moderator
                        </Button>
                        <Button
                            flex={1}
                            size="$3"
                            backgroundColor={user.role === 'admin' ? '$red10' : '$red3'}
                            color={user.role === 'admin' ? 'white' : '$red11'}
                            onPress={() => onUpdateRole(user._id, 'admin')}
                            disabled={user.role === 'admin'}
                        >
                            Admin
                        </Button>
                    </XStack>
                </YStack>
            )}
        </Card>
    );
}
