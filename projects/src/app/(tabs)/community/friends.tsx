
import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, XStack, YStack, Button } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getUserFriends, getFullImageUrl } from '../../../server/users';

export default function FriendListScreen() {
    const router = useRouter();
    const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFriends();
    }, [userId]);

    const loadFriends = async () => {
        if (!userId || userId === 'undefined') return;
        setLoading(true);
        try {
            // Fetch all friends (page 1, big limit for now or handle pagination)
            const res = await getUserFriends(userId, 1, 100);
            const list = (res as any)?.data?.friends || (res as any)?.friends || [];
            setFriends(list);
        } catch (error) {
            console.log('Load friends error', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const friend = item.friendId || item.user || item;
        const fId = friend._id || friend.id;
        const fName = friend.name || 'Người dùng';
        const fAvatarUrl = friend.avatarUrl || friend.avatar;
        const fAvatar = getFullImageUrl(fAvatarUrl);
        const fGender = friend.gender;

        let avatarSource;
        if (fAvatar) {
            avatarSource = { uri: fAvatar };
        } else if (fGender === 'female') {
            avatarSource = require('../../../assets/images/avatar-girl.png');
        } else {
            avatarSource = require('../../../assets/images/avatar-placeholder.png');
        }

        return (
            <TouchableOpacity
                onPress={() => router.push(`/community/${fId}`)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0'
                }}
            >
                <Image
                    source={avatarSource}
                    style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' }}
                />
                <YStack marginLeft={12} flex={1}>
                    <Text fontSize={16} fontWeight="600" color="#111">{fName}</Text>
                    {/* Optional: Add friend bio or common friends count here */}
                </YStack>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            <XStack alignItems="center" paddingHorizontal={16} paddingVertical={12} borderBottomWidth={1} borderBottomColor="#EEE">
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text fontSize={18} fontWeight="700">Bạn bè của {userName || 'Người dùng'}</Text>
            </XStack>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#9B59FF" />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={(item, index) => (item.friendId?._id || item.id || String(index))}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        <Text textAlign="center" marginTop={20} color="#666">Chưa có bạn bè nào</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}
