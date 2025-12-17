// app/(tabs)/community/index.tsx
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  View,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { YStack, XStack, Text, Button, Card, Input } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import PostCard, { Post, Comment } from './PostCard';
import { apiRequest, getBlockedUsers, unblockUser, getTrendingHashtags, getPostsByHashtag, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../../../server/users';
import { ModerationApi, SocialApi } from '../../../api/services';
import { notifyError, notifySuccess, notifyInfo } from '../../../utils/notify';

import { eventBus } from '../../../lib/eventBus';
import AppealModal from '../../../components/AppealModal';
import {
  getFeedPosts,
  createPostApi,
  togglePostLike,
  createCommentApi,
  getPostComments,
  updateComment,
  sendFriendRequest,
  blockUser,
  getFriendStatus,
  sharePost as sharePostApi,
  unfriend,
  getToken,

  getFullImageUrl,
} from '../../../server/users';

const PRIMARY = '#FF2FB2';
const PRIMARY_SOFT = '#FFE6F4';
const BG = '#F4F7FB';
import { BASE_URL as USER_BASE_URL } from '../../../server/users';
const BASE = USER_BASE_URL;

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
};

type TabKey = 'feed' | 'create';

const SUGGESTED_TAGS = ['FlowState', 'WellnessJourney', 'Mindfulness'];

function mapApiPostToPost(apiPost: any): Post {
  const user = apiPost.userId || apiPost.user || {};
  let rawAvatar = user.avatarUrl || user.avatar || '';
  if (rawAvatar === 'null' || rawAvatar === 'undefined') rawAvatar = '';
  const avatarUrl = getFullImageUrl(rawAvatar);

  // Handle shared post data
  let sharedPost = undefined;
  if (apiPost.sharedPostId || apiPost.sharedPost) {
    const shared = apiPost.sharedPost || apiPost.sharedPostId || {};
    const sharedUser = shared.userId || shared.user || {};

    sharedPost = {
      id: shared._id || shared.id || '',
      content: shared.content || '',
      imageUrl: shared.images?.[0]?.url || shared.imageUrl || shared.image || undefined,
      user: {
        name: sharedUser.name || 'Người dùng FlowState',
        avatarUrl: getFullImageUrl(sharedUser.avatar || sharedUser.avatarUrl),
      },
    };
  }

  return {
    id: apiPost._id || apiPost.id,
    user: {
      id: user._id || user.id || 'unknown',
      name: user.name || 'Người dùng FlowState',
      avatarUrl,
      badge: user.badge || undefined,
      gender: user.gender,
      trustScore: user.trustScore,
    },
    // ở FE trước dùng "4 giờ trước" – giờ hiển thị ngày/giờ tạo cho đơn giản
    createdAgo: apiPost.createdAt
      ? new Date(apiPost.createdAt).toLocaleString('vi-VN')
      : 'Vừa đăng',
    content: apiPost.content || '',
    hashtags: apiPost.hashtags || [],
    likeCount:
      typeof apiPost.likeCount === 'number'
        ? apiPost.likeCount
        : Array.isArray(apiPost.likes)
          ? apiPost.likes.length
          : 0,
    commentCount:
      typeof apiPost.commentCount === 'number' ? apiPost.commentCount : 0,
    hasLiked: !!apiPost.hasLiked,
    imageUrl:
      apiPost.images && apiPost.images.length > 0
        ? (() => {
          const rawUrl = apiPost.images[0].url || apiPost.images[0];
          const fullUrl = getFullImageUrl(rawUrl);
          console.log('[DEBUG] Image Render:', { id: apiPost._id, raw: rawUrl, full: fullUrl });
          return fullUrl;
        })()
        : undefined,
    moderationStatus: apiPost.moderationStatus || 'approved',
    sharedPost,
  };
}

// Map API comment to UI Comment format
function mapApiCommentToUi(postId: string, apiComment: any): Comment {
  const user = apiComment.userId || apiComment.user || {};
  return {
    id: apiComment._id || apiComment.id,
    postId,
    author: user.name || 'Người dùng FlowState',
    avatarUrl: getFullImageUrl(user.avatar || user.avatarUrl),
    text: apiComment.content || apiComment.text || '',
    createdAgo: apiComment.createdAt
      ? new Date(apiComment.createdAt).toLocaleString('vi-VN')
      : 'Vừa xong',
    userId: user._id || user.id || apiComment.userId, // Thêm userId để check quyền edit
    moderationStatus: apiComment.moderationStatus || 'approved',
  };
}

export default function CommunityScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('feed');

  const [posts, setPosts] = useState<Post[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, Comment[]>
  >({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<{ postId: string; comment: Comment } | null>(null);

  // Create post state
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends'>('public');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // UI state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userActionsVisible, setUserActionsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Post['user'] | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const myUserId = currentUserId;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [friendLoading, setFriendLoading] = useState(false);
  const [lastHiddenPost, setLastHiddenPost] = useState<Post | null>(null);
  const [hideToastVisible, setHideToastVisible] = useState(false);

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocklist, setLoadingBlocklist] = useState(false);
  const [blocklistVisible, setBlocklistVisible] = useState(false);

  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // loading feed
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Moderation state (for moderators/admins)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState({ posts: 0, comments: 0, total: 0 });
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);

  // Notification state
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  // ---------- GỌI API FEED ----------
  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const res = await apiRequest('/api/posts/feed?page=1&limit=20', {
        method: 'GET',
        auth: true,
      });

      // BE trả dạng { success, data: { posts, pagination } } hoặc {posts: []}
      const apiPosts =
        res?.data?.posts || res?.data?.data?.posts || res?.posts || [];

      const mapped: Post[] = apiPosts.map(mapApiPostToPost);
      setPosts(mapped);
    } catch (error) {
      console.error('[Community] loadFeed error', error);
      notifyError('Lỗi', 'Không tải được bài viết, vui lòng thử lại.');
    } finally {
      setLoadingFeed(false);
      setRefreshing(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      setTrendingLoading(true);
      const res = await getTrendingHashtags(8, 7);

      const list = res?.data || res?.data?.data || res;
      const tags = Array.isArray(list)
        ? list.map((t: any) => t.hashtag || t.tag).filter(Boolean)
        : [];

      setTrendingTags(tags);
    } catch (error) {
      console.error('[Community] loadTrending error', error);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  const loadPostsByHashtag = async (tag: string) => {
    try {
      setLoadingFeed(true);
      const res = await getPostsByHashtag(tag, 1, 20);

      const apiPosts =
        res?.data?.posts || res?.data?.data?.posts || res?.posts || [];

      const mapped: Post[] = apiPosts.map(mapApiPostToPost);
      setPosts(mapped);
    } catch (error) {
      console.error('[Community] loadPostsByHashtag error', error);
      notifyError('Lỗi', 'Không tải được bài viết theo hashtag');
    } finally {
      setLoadingFeed(false);
    }
  };

  // Load comments for a specific post
  const loadCommentsForPost = async (postId: string) => {
    try {
      const res = await getPostComments(postId);
      const raw = (res as any)?.data?.comments || (res as any)?.comments || (res as any)?.data || res;
      const mapped: Comment[] = Array.isArray(raw)
        ? raw.map((c) => mapApiCommentToUi(postId, c))
        : [];

      setCommentsByPost(prev => ({
        ...prev,
        [postId]: mapped,
      }));
    } catch (err) {
      console.error('[Community] loadComments error', err);
    }
  };

  useEffect(() => {
    loadFeed();
    loadTrending();
  }, [loadFeed, loadTrending]);

  // Listen for reload requests from other screens (e.g., after editing a post)
  useEffect(() => {
    const off = eventBus.on('reloadFeed', async () => {
      try {
        await loadFeed();
      } catch (err) {
        console.error('[Community] reloadFeed handler error', err);
      }
    });
    return () => off();
  }, [loadFeed]);

  // Submit or update comment (used by controlled comment input)
  const handleSubmitComment = async () => {
    if (!activeCommentPostId || !commentText.trim()) return;

    try {
      if (editingComment) {
        const content = commentText.trim();
        await updateComment(editingComment.comment.id, content);

        setCommentsByPost(prev => ({
          ...prev,
          [editingComment.postId]: (prev[editingComment.postId] || []).map(c =>
            c.id === editingComment.comment.id ? { ...c, text: content } : c,
          ),
        }));

        setEditingComment(null);
        setCommentText('');
        return;
      }

      // Create new comment
      const res = await createCommentApi({
        postId: activeCommentPostId,
        content: commentText.trim(),
      });

      // Kiểm tra response từ BE
      const success = res?.success !== false;
      const message = res?.message || '';
      const apiComment = (res as any)?.comment || (res as any)?.data || res;
      const moderationStatus = apiComment?.moderationStatus;

      // Xử lý trường hợp bị từ chối (success = false)
      if (!success) {
        notifyError(
          'Nội dung không phù hợp',
          message || 'Bình luận chứa từ ngữ vi phạm tiêu chuẩn cộng đồng.',
        );
        return;
      }

      // Xử lý trường hợp pending (không hiện alert làm phiền, chỉ hiện UI pending trong list)
      // if (moderationStatus === 'pending') {
      //   Alert.alert('Kiểm duyệt', 'Bình luận đang được kiểm duyệt...');
      // }

      // Thêm comment vào UI (cho cả approved và pending)
      const newComment = mapApiCommentToUi(activeCommentPostId, apiComment);
      setCommentsByPost(prev => ({
        ...prev,
        [activeCommentPostId]: [
          ...(prev[activeCommentPostId] || []),
          newComment,
        ],
      }));
      setCommentText('');
      setCommentText('');
    } catch (err: any) {
      console.error('[Community] submit comment error', err);
      // Hiển thị message chi tiết từ backend nếu có
      const msg = err?.message || 'Không thể gửi bình luận. Vui lòng thử lại.';

      if (msg.includes('vi phạm tiêu chuẩn cộng đồng') || msg.toLowerCase().includes('profanity') || msg.toLowerCase().includes('violation')) {
        notifyError('Vi phạm tiêu chuẩn', 'Nội dung bình luận của bạn có chứa từ ngữ vi phạm tiêu chuẩn cộng đồng.');
      } else {
        notifyError('Lỗi', msg);
      }
    }
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        const me = await apiRequest('/api/users/me', { auth: true });
        const user = me.user || me.data?.user || me;
        console.log('[Community] loadMe - user:', { id: user?.id || user?._id, role: user?.role });
        setCurrentUserId(user?.id || user?._id || null);
        setUserRole(user?.role || null);
      } catch (error) {
        console.log('[Community] loadMe error', error);
      }
    };

    loadMe();
  }, []);

  // Load pending count for moderators/admins
  const loadPendingCount = useCallback(async () => {
    console.log('[Community] loadPendingCount - userRole:', userRole);
    if (!userRole || (userRole !== 'moderator' && userRole !== 'admin')) {
      console.log('[Community] Skipping loadPendingCount - not mod/admin');
      return;
    }

    try {
      console.log('[Community] Fetching moderation stats...');
      // Remove '1d' argument to use default (today) or whatever backend default is.
      // Note: pending counts in backend are global, not filtered by period.
      const res = await ModerationApi.getStats();
      console.log('[Community] Stats response:', JSON.stringify(res));

      const stats = res as any;
      // Backend returns { success: true, data: { pending: { posts: X... } } }
      // Client might unwrap specific layers, so check multiple paths.
      const currentPending = stats?.data?.pending || stats?.pending || stats?.currentPending || {};

      const newCount = {
        posts: currentPending.posts || 0,
        comments: currentPending.comments || 0,
        total: currentPending.total || 0,
      };
      console.log('[Community] Setting pendingCount:', newCount);
      setPendingCount(newCount);
    } catch (error) {
      console.log('[Community] loadPendingCount error (non-critical):', error);
    }
  }, [userRole]);

  // ... (lines 409-2059 omitted) ...

  <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
    {notifs.length === 0 ? (
      <Text textAlign="center" color="$gray10" marginTop={20}>Không có thông báo mới</Text>
    ) : (
      notifs.map(notif => (
        <Card key={notif._id} padding={12} marginBottom={8} backgroundColor={notif.isRead ? 'white' : '#F0F9FF'} onPress={() => {
          // Navigate based on type
          if (notif.type === 'moderation_pending') {
            router.push('/(tabs)/moderation'); // Go to moderation dashboard
            setNotifModalVisible(false);
          }
        }}>
          <XStack gap={10} alignItems="center">
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={20} color="#4F46E5" />
            </View>
            <YStack flex={1}>
              <Text fontWeight="600" numberOfLines={1} color="#000">{notif.title}</Text>
              <Text fontSize={13} color="#333" numberOfLines={2}>{notif.message}</Text>
              <Text fontSize={11} color="#666" marginTop={4}>{new Date(notif.createdAt).toLocaleString('vi-VN')}</Text>
            </YStack>
          </XStack>
        </Card>
      ))
    )}
  </ScrollView>

  // Load pending count when user role is available
  useEffect(() => {
    if (userRole === 'moderator' || userRole === 'admin') {
      loadPendingCount();
    }
  }, [userRole, loadPendingCount]);

  // Reload pending count when screen comes into focus (for moderators/admins)
  useFocusEffect(
    useCallback(() => {
      if (userRole === 'moderator' || userRole === 'admin') {
        loadPendingCount();
        loadNotifications(); // Load notifications too
      }
    }, [userRole, loadPendingCount])
  );

  const loadNotifications = async () => {
    try {
      const res = await apiRequest('/api/notifications?limit=10', { auth: true });
      const data = res?.data || res;
      setNotifs(data.notifications || []);
      setUnreadNotifCount(data.unreadCount || 0);
    } catch (error) {
      console.log('Load notifs error', error);
    }
  };

  const handleOpenNotifs = async () => {
    setNotifModalVisible(true);
    // Mark all as read visualy first
    setUnreadNotifCount(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));

    // Call API to mark all read
    try {
      await apiRequest('/api/notifications/all/read', { method: 'PATCH', auth: true });
    } catch (err) {
      console.log('Mark read error', err);
    }
  };

  // Load friend requests
  useEffect(() => {
    const loadFriendRequests = async () => {
      try {
        const res = await getFriendRequests();
        const requests = (res as any)?.data?.requests || (res as any)?.requests || [];
        setFriendRequests(requests);
        setFriendRequestCount(requests.length);
      } catch (err) {
        console.log('[Community] load friend requests error (non-critical):', err);
        // Silently fail - friend requests are not critical for app function
      }
    };
    loadFriendRequests();
  }, []);

  // Handle accept friend request
  const handleAcceptFriend = async (friendId: string, friendName: string) => {
    try {
      await acceptFriendRequest(friendId);
      notifySuccess('Thành công', `Đã chấp nhận lời mời từ ${friendName}`);

      // Remove from list
      setFriendRequests(prev => prev.filter((req: any) => {
        const sender = req.friendId || {};
        const id = sender._id || sender.id;
        return id !== friendId;
      }));
      setFriendRequestCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      notifyError('Lỗi', err.message || 'Không thể chấp nhận lời mời');
    }
  };

  // Handle reject friend request
  const handleRejectFriend = async (friendId: string, friendName: string) => {
    try {
      await rejectFriendRequest(friendId);
      notifyInfo('Đã từ chối', `Đã từ chối lời mời từ ${friendName}`);

      // Remove from list
      setFriendRequests(prev => prev.filter((req: any) => {
        const sender = req.friendId || {};
        const id = sender._id || sender.id;
        return id !== friendId;
      }));
      setFriendRequestCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      notifyError('Lỗi', err.message || 'Không thể từ chối lời mời');
    }
  };

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const res = await apiRequest(`/api/posts/${postId}/like`, {
        method: 'POST',
        auth: true,
      });

      const liked = res?.data?.liked;
      const likeCountFromApi = res?.data?.likeCount;

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
              ...p,
              hasLiked:
                typeof liked === 'boolean' ? liked : !p.hasLiked,
              likeCount:
                typeof likeCountFromApi === 'number'
                  ? likeCountFromApi
                  : p.likeCount + (p.hasLiked ? -1 : 1),
            }
            : p,
        ),
      );
    } catch (error) {
      console.error('[Community] toggleLike error', error);
      notifyError('Lỗi', 'Không thể thích/bỏ thích bài viết. Vui lòng thử lại.');
    }
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addComment = useCallback(
    async (postId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      try {
        const res = await apiRequest('/api/comments', {
          method: 'POST',
          auth: true,
          body: {
            postId,
            content: trimmed,
          },
        });

        const c = res?.data;

        const newComment: Comment = {
          id: c?._id || `${postId}-${Date.now()}`,
          postId,
          author: c?.userId?.name || 'Bạn',
          avatarUrl: c?.userId?.avatar || undefined,
          text: c?.content || trimmed,
          createdAgo: c?.createdAt
            ? new Date(c.createdAt).toLocaleString('vi-VN')
            : 'Vừa xong',
        };

        setCommentsByPost(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));

        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, commentCount: p.commentCount + 1 }
              : p,
          ),
        );
      } catch (error) {
        console.error('[Community] addComment error', error);
        notifyError('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
      }
    },
    [],
  );

  const handleShareConfirm = async () => {
    if (!sharePost) return;

    try {
      setIsSharing(true);

      // Nếu sau này có text nhập tay thì dùng shareText,
      // còn hiện tại dùng luôn content gốc của bài viết
      const caption =
        (sharePost.content && sharePost.content.trim()) ||
        'Chia sẻ bài viết từ cộng đồng FlowState';

      const res = await sharePostApi(sharePost.id, {
        shareCaption: caption,       // << BẮT BUỘC phải có text
        visibility: 'public',
      });

      if (res.success) {
        notifySuccess('Thành công', 'Đã chia sẻ bài viết 🎉');
        setSharePost(null);
        await loadFeed();
      } else {
        throw new Error(res.message || 'Không thể chia sẻ');
      }
    } catch (error) {
      console.error('[Community] share post error', error);
      notifyError('Lỗi', 'Không thể chia sẻ bài viết, vui lòng thử lại.');
    } finally {
      setIsSharing(false);
    }
  };


  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const handleHidePost = (postId: string) => {
    setPosts(prev => {
      const found = prev.find(p => p.id === postId);
      if (found) {
        setLastHiddenPost(found);
        setHideToastVisible(true);
      }
      return prev.filter(p => p.id !== postId);
    });
  };

  const handleReportPost = (post: Post) => {
    notifyInfo('Thông báo', `Đã ghi nhận báo cáo bài viết của ${post.user.name}.`);
  };

  const handleMutePost = (postId: string) => {
    notifyInfo('Thông báo', 'Bạn sẽ không nhận thông báo từ bài viết này.');
  };

  const handleUndoHidePost = () => {
    if (lastHiddenPost) {
      setPosts(prev => [lastHiddenPost, ...prev]);
      setLastHiddenPost(null);
    }
    setHideToastVisible(false);
  };

  const handleDismissHideToast = () => {
    setHideToastVisible(false);
    setLastHiddenPost(null);
  };

  const handleOpenUserActions = (user: Post['user']) => {
    if (!user) return;

    // Nếu là chính mình → đi thẳng sang trang cá nhân cộng đồng
    if (currentUserId && user.id === currentUserId) {
      router.push({
        pathname: '/(tabs)/community/[userId]',
        params: { userId: user.id },
      });
      return;
    }

    // Còn lại (user khác) → mở bottom sheet tuỳ chọn tương tác
    setSelectedUser(user);
    setUserActionsVisible(true);
  };

  const handleCloseUserActions = () => {
    setUserActionsVisible(false);
    setSelectedUser(null);
    setFriendStatus(null);
  };

  const handleViewCommunityProfile = () => {
    if (!selectedUser || !selectedUser.id) return;

    // Đóng modal tuỳ chọn
    setUserActionsVisible(false);

    router.push({
      pathname: '/(tabs)/community/[userId]',
      params: { userId: selectedUser.id },
    });
  };

  const handleEditPost = (post: Post) => {
    setUserActionsVisible(false);
    // Navigate to the community edit screen (shared route)
    router.push({
      pathname: '/(tabs)/community/edit',
      params: { postId: post.id },
    });
  };

  const handleAddFriend = async () => {
    if (!selectedUser) return;

    // Đã là bạn bè hoặc đã chờ thì không gửi tiếp
    if (friendStatus === 'friends') {
      notifyInfo('Kết bạn', 'Bạn và người này đã là bạn bè.');
      return;
    }
    if (friendStatus === 'pending') {
      notifyInfo('Kết bạn', 'Bạn đã gửi lời mời trước đó, hãy chờ phản hồi.');
      return;
    }

    try {
      setFriendLoading(true);
      const res = await sendFriendRequest(selectedUser.id);

      notifySuccess('Kết bạn', res?.message || 'Đã gửi lời mời kết bạn');
      setFriendStatus('pending');
    } catch (error: any) {
      notifyError('Lỗi', error.message || 'Gửi lời mời kết bạn thất bại');
    } finally {
      setFriendLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!selectedUser) return;

    Alert.alert(
      friendStatus === 'friends' ? 'Huỷ kết bạn' : 'Huỷ lời mời',
      friendStatus === 'friends'
        ? `Bạn có chắc muốn huỷ kết bạn với ${selectedUser.name}?`
        : `Bạn có chắc muốn huỷ lời mời kết bạn đã gửi cho ${selectedUser.name}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await unfriend(selectedUser.id);
              notifySuccess('Thành công', res?.message || 'Đã cập nhật trạng thái bạn bè');

              // Sau khi huỷ, coi như trở lại trạng thái "none"
              setFriendStatus('none');
            } catch (error: any) {
              notifyError('Lỗi', error?.message || 'Không thể huỷ kết bạn / huỷ lời mời');
            }
          },
        },
      ],
    );
  };

  const handleSendMessage = () => {
    setUserActionsVisible(false);
    notifyInfo('Thông báo', 'Đi tới màn hình nhắn tin (demo).');
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'Chặn người dùng',
      `Bạn chắc chắn muốn chặn ${selectedUser.name}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await blockUser(selectedUser.id, 'Blocked from community');
              notifySuccess('Thành công', res?.message || 'Đã chặn người dùng');

              // Ẩn tất cả bài viết của user bị chặn khỏi feed hiện tại
              setPosts((prev) =>
                prev.filter((p) => p.user.id !== selectedUser.id),
              );

              handleCloseUserActions();
            } catch (error: any) {
              notifyError('Lỗi', error.message || 'Chặn người dùng thất bại');
            }
          },
        },
      ],
    );
  };

  const loadBlocklist = async () => {
    try {
      setLoadingBlocklist(true);
      const res = await getBlockedUsers(1, 50);

      const arr =
        res?.data?.blockedUsers ||
        res?.data?.data?.blockedUsers ||
        res?.blockedUsers ||
        [];

      setBlockedUsers(arr);
    } catch (error) {
      console.error('[Community] loadBlocklist error', error);
      notifyError('Lỗi', 'Không tải được danh sách đã chặn');
    } finally {
      setLoadingBlocklist(false);
    }
  };

  const handleUnblock = (blockedUserId: string) => {
    Alert.alert('Bỏ chặn', 'Bạn có chắc muốn bỏ chặn người này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await unblockUser(blockedUserId);
            notifySuccess('Thành công', res?.message || 'Đã bỏ chặn');

            setBlockedUsers(prev =>
              prev.filter(b => {
                const u = b.blockedUserId || b.user || {};
                return (u._id || u.id) !== blockedUserId;
              }),
            );
          } catch (error) {
            notifyError('Lỗi', 'Không thể bỏ chặn');
          }
        },
      },
    ]);
  };

  const renderFriendLabel = () => {
    if (friendLoading) return 'Đang xử lý...';
    switch (friendStatus) {
      case 'friends':
        return 'Đã là bạn bè';
      case 'pending':
        return 'Đã gửi lời mời';
      case 'blocked':
        return 'Đã chặn';
      default:
        return 'Kết bạn';
    }
  };

  const isFriendButtonDisabled =
    friendLoading || friendStatus === 'friends' || friendStatus === 'blocked';

  const resetCreateForm = () => {
    setContent('');
    setPrivacy('public');
    setSelectedTags([]);
    setImageUri(null);
  };

  // ---------- TẠO BÀI VIẾT (API) ----------
  const handleCreatePost = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      notifyError('Cảnh báo', 'Vui lòng nhập nội dung bài viết.');
      return;
    }

    setCreating(true);
    try {
      let uploadedImageUrl = null;

      // STEP 1: Upload image if exists
      if (imageUri) {
        console.log('[Community] Uploading image:', imageUri);

        try {
          // Create FormData for image upload
          const formData = new FormData();
          formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'post-image.jpg',
          } as any);

          // Get token for auth
          const token = await getToken();

          // Upload to server
          const uploadRes = await fetch(`${BASE}/api/upload/image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || 'Failed to upload image');
          }

          const uploadData = await uploadRes.json();
          uploadedImageUrl = uploadData.url;
          console.log('[Community] Image uploaded successfully:', uploadedImageUrl);
        } catch (uploadError: any) {
          console.error('[Community] Image upload error:', uploadError);
          Alert.alert(
            'Lỗi tải ảnh',
            uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại hoặc đăng bài không có ảnh.',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Đăng không có ảnh',
                onPress: () => {
                  // Continue without image
                  uploadedImageUrl = null;
                }
              }
            ]
          );
          setCreating(false);
          return;
        }
      }

      // STEP 2: Create post with uploaded image URL
      const body: any = {
        content: trimmed,
        visibility: privacy, // 'public' | 'friends'
        hashtags: selectedTags,
      };

      if (uploadedImageUrl) {
        body.images = [{ url: uploadedImageUrl }];
      }

      const res = await apiRequest('/api/posts', {
        method: 'POST',
        auth: true,
        body,
      });

      // DEBUG: Log toàn bộ response để kiểm tra
      console.log('[DEBUG] Full response:', JSON.stringify(res, null, 2));

      // Kiểm tra response từ BE
      const success = res?.success !== false;
      const message = res?.message || '';
      const createdPostFromApi = res?.data || res?.data?.post || res;
      const moderationStatus = createdPostFromApi?.moderationStatus;

      // DEBUG: Log các giá trị quan trọng
      console.log('[DEBUG] success:', success);
      console.log('[DEBUG] message:', message);
      console.log('[DEBUG] createdPostFromApi:', createdPostFromApi);
      console.log('[DEBUG] moderationStatus:', moderationStatus);

      // Xử lý trường hợp bị từ chối (success = false)
      if (!success) {
        notifyError(
          'Nội dung không phù hợp',
          message || 'Nội dung chứa từ ngữ vi phạm tiêu chuẩn cộng đồng, vui lòng chỉnh sửa lại bài viết.',
        );
        return;
      }

      // Xử lý trường hợp pending
      if (moderationStatus === 'pending') {
        notifyInfo('Kiểm duyệt', 'Bài viết đang được kiểm duyệt...');
        const newPost = mapApiPostToPost(createdPostFromApi);
        setPosts(prev => [newPost, ...prev]);

        // Bắt đầu polling để check status
        pollPostStatus(createdPostFromApi._id);

        resetCreateForm();
        setTab('feed');
        return;
      }

      // Xử lý trường hợp approved
      if (moderationStatus === 'approved' || !moderationStatus) {
        notifySuccess('Thành công', 'Tạo bài viết thành công');
        const newPost = mapApiPostToPost(createdPostFromApi);
        setPosts(prev => [newPost, ...prev]);
        resetCreateForm();
        setTab('feed');
      }
    } catch (error: any) {
      console.error('[Community] createPost error', error);

      // Check for rate limiting (429 status) first
      if (error?.status === 429) {
        notifyError(
          'Đăng bài quá nhanh',
          error?.message || 'Bạn đang đăng bài quá nhanh. Vui lòng chờ một chút.'
        );
        return;
      }

      // Parse error message from backend
      const errorMessage = error?.message || '';

      // Check for specific moderation errors
      if (errorMessage.includes('từ ngữ không phù hợp') ||
        errorMessage.includes('profanity') ||
        errorMessage.includes('Nội dung chứa')) {
        notifyError(
          'Nội dung không phù hợp',
          'Nội dung chứa từ ngữ vi phạm tiêu chuẩn cộng đồng. Vui lòng chỉnh sửa và thử lại.'
        );
      } else if (errorMessage.includes('spam') ||
        errorMessage.includes('đăng bài quá nhanh') ||
        errorMessage.includes('duplicate')) {
        notifyError(
          'Đăng bài quá nhanh',
          'Bạn đang đăng bài quá nhanh. Vui lòng chờ một chút.'
        );
      } else if (errorMessage.includes('NSFW') ||
        errorMessage.includes('hình ảnh không phù hợp')) {
        notifyError(
          'Hình ảnh không phù hợp',
          'Hình ảnh không phù hợp với tiêu chuẩn cộng đồng. Vui lòng chọn hình ảnh khác.'
        );
      } else if (errorMessage.includes('banned') ||
        errorMessage.includes('bị khóa')) {
        notifyError(
          'Tài khoản bị khóa',
          errorMessage || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        );
      } else {
        // Generic error message for other cases
        notifyError(
          'Lỗi',
          errorMessage || 'Không thể đăng bài viết. Vui lòng thử lại.'
        );
      }
    } finally {
      setCreating(false);
    }
  };

  // Polling để check status của bài pending
  const pollPostStatus = async (postId: string) => {
    let attempts = 0;
    const maxAttempts = 10; // Poll trong 10 giây

    const interval = setInterval(async () => {
      attempts++;

      try {
        // Kiểm tra token trước khi gọi
        const token = await getToken();
        if (!token) {
          clearInterval(interval);
          return;
        }

        const response = await apiRequest(`/api/posts/${postId}`, {
          method: 'GET',
          auth: true
        });

        const updatedStatus = response?.data?.moderationStatus;

        if (updatedStatus === 'approved') {
          // Cập nhật post trong state
          setPosts(prev => prev.map(p =>
            p.id === postId
              ? { ...p, moderationStatus: 'approved' }
              : p
          ));
          clearInterval(interval);
          notifySuccess('Thành công', 'Bài viết đã được duyệt!');
        } else if (updatedStatus === 'rejected') {
          // Xóa post khỏi feed
          setPosts(prev => prev.filter(p => p.id !== postId));
          clearInterval(interval);
          notifyError('Từ chối', 'Bài viết không được duyệt');
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.log('[Polling] Stopped after', maxAttempts, 'attempts');
        }
      } catch (error: any) {
        // Silent fail for auth error during polling
        if (error.message?.includes('No auth token')) {
          clearInterval(interval);
          return;
        }
        console.error('[Polling] Error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 1000); // Poll mỗi 1 giây
  };


  const filteredPosts =
    searchQuery.trim().length === 0
      ? posts.filter(p => {
        // Chỉ hiển thị approved posts cho tất cả mọi người
        if (p.moderationStatus === 'approved' || !p.moderationStatus) return true;
        // Hiển thị pending posts chỉ cho chủ bài viết
        if (p.moderationStatus === 'pending' && p.user.id === currentUserId) return true;
        // Ẩn rejected posts
        return false;
      })
      : posts
        .filter(p => {
          // Áp dụng cùng logic moderation filter
          if (p.moderationStatus === 'approved' || !p.moderationStatus) return true;
          if (p.moderationStatus === 'pending' && p.user.id === currentUserId) return true;
          return false;
        })
        .filter(p =>
          (p.content + ' ' + p.hashtags.join(' '))
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom']}>
      <YStack flex={1} backgroundColor={BG}>
        {/* Header */}
        <XStack alignItems="center" paddingHorizontal={16} paddingVertical={10}>
          <Button
            backgroundColor="transparent"
            height={36}
            width={36}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </Button>
          <YStack>
            <Text fontSize={18} fontWeight="700" color="#000">
              Community
            </Text>
            <Text fontSize={11} color="#7A7A7A">
              Kết nối cộng đồng sức khỏe
            </Text>
          </YStack>
          <XStack flex={1} />
          {/* Search icon */}
          <Button
            backgroundColor="transparent"
            height={36}
            width={36}
            onPress={() => setAppealModalVisible(true)}
          >
            <Ionicons name="megaphone-outline" size={20} color="#111" />
          </Button>



          {/* Notification Bell (Only for Mods/Admins) - Navigate to Moderation */}
          {(userRole === 'admin' || userRole === 'moderator') && (
            <Button
              backgroundColor="transparent"
              height={36}
              width={36}
              onPress={() => router.push('/(tabs)/moderation')}
            >
              <View>
                <Ionicons name="notifications-outline" size={20} color="#111" />
                {pendingCount.total > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 2,
                      backgroundColor: 'red',
                      borderRadius: 10,
                      width: 14,
                      height: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text color="white" fontSize={9} fontWeight="bold">
                      {pendingCount.total > 9 ? '9+' : pendingCount.total}
                    </Text>
                  </View>
                )}
              </View>
            </Button>
          )}

          <Button
            backgroundColor="transparent"
            height={36}
            width={36}
            onPress={() => setSearchVisible(true)}
          >
            <Ionicons name="search-outline" size={20} color="#111" />
          </Button>

          {/* Avatar user (notifications + friend requests) */}
          <View style={{ position: 'relative' }}>
            <Button
              backgroundColor="transparent"
              height={36}
              width={36}
              onPress={() => setNotificationsVisible(true)}
            >
              <YStack
                width={30}
                height={30}
                borderRadius={15}
                backgroundColor={PRIMARY_SOFT}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="person" size={16} color={PRIMARY} />
                <YStack
                  position="absolute"
                  top={2}
                  right={2}
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor="#22c55e"
                />
              </YStack>
            </Button>
          </View>
        </XStack>

        {/* Hide post toast */}
        {hideToastVisible && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 16,
              right: 16,
              zIndex: 50,
            }}
          >
            <Card
              padding={10}
              borderRadius={999}
              backgroundColor="#111827"
            >
              <XStack alignItems="center" justifyContent="space-between" gap={8}>
                <Text fontSize={12} color="#f9fafb" flexShrink={1}>
                  Đã ẩn một bài viết.
                </Text>
                <Button
                  height={30}
                  borderRadius={999}
                  backgroundColor="#374151"
                  onPress={handleUndoHidePost}
                >
                  <Text fontSize={12} color="#f9fafb" fontWeight="700">
                    Hoàn tác
                  </Text>
                </Button>
                <Button
                  backgroundColor="transparent"
                  height={30}
                  width={30}
                  onPress={handleDismissHideToast}
                >
                  <Ionicons name="close" size={16} color="#9ca3af" />
                </Button>
              </XStack>
            </Card>
          </View>
        )}

        {/* Moderation pending banner (for moderators/admins) */}
        {(userRole === 'moderator' || userRole === 'admin') && pendingCount.total > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <Card
              padding={12}
              borderRadius={8}
              backgroundColor="#fef3c7"
            >
              <XStack alignItems="center" justifyContent="space-between" gap={8}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                <Text fontSize={13} color="#92400e" flexShrink={1}>
                  {pendingCount.total} nội dung đang chờ kiểm duyệt
                </Text>
                <Button
                  height={32}
                  borderRadius={6}
                  backgroundColor="#f59e0b"
                  onPress={() => router.push('/(tabs)/moderation')}
                >
                  <Text fontSize={12} color="#fff" fontWeight="600">
                    Xem ngay
                  </Text>
                </Button>
              </XStack>
            </Card>
          </View>
        )}


        {/* Tabs */}
        <XStack paddingHorizontal={16} marginBottom={8} gap={8}>
          {[
            { key: 'feed', label: 'Feed' },
            { key: 'create', label: 'Viết bài' },
          ].map(t => {
            const active = tab === (t.key as TabKey);
            return (
              <Button
                key={t.key}
                flex={1}
                height={48}
                borderRadius={999}
                backgroundColor={active ? PRIMARY : '#F2F2F2'}
                onPress={() => setTab(t.key as TabKey)}
              >
                <Text
                  fontSize={14}
                  fontWeight="600"
                  color={active ? '#fff' : '#555'}
                >
                  {t.label}
                </Text>
              </Button>
            );
          })}
        </XStack>

        {/* Content */}
        {tab === 'feed' ? (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            style={{ width: '100%' }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              // optional: nếu bạn đã import RefreshControl thì thêm vào;
              // còn không dùng cũng được, chỉ hiển thị loader ở trên thôi.
              undefined
            }
          >
            {friendRequestCount > 0 && (
              <XStack
                marginBottom={12}
                padding={10}
                borderRadius={12}
                backgroundColor="#EEF2FF"
                alignItems="center"
                justifyContent="space-between"
                gap={8}
              >
                <YStack flex={1}>
                  <Text fontSize={13} fontWeight="600" color="#111827">
                    Bạn có {friendRequestCount} lời mời kết bạn mới
                  </Text>
                  <Text fontSize={11} color="#4B5563">
                    Nhấn "Xem" để chấp nhận hoặc từ chối lời mời.
                  </Text>
                </YStack>
                <Button
                  height={32}
                  borderRadius={999}
                  paddingHorizontal={14}
                  backgroundColor="#6366F1"
                  onPress={() => setNotificationsVisible(true)}
                >
                  <Text fontSize={12} color="white" fontWeight="600">
                    Xem
                  </Text>
                </Button>
              </XStack>
            )}




            {loadingFeed && posts.length === 0 ? (
              <YStack alignItems="center" marginTop={40} gap={8}>
                <ActivityIndicator color={PRIMARY} />
                <Text color="#777">Đang tải bài viết...</Text>
              </YStack>
            ) : null}

            {/* Trending hashtags */}
            {(trendingTags.length > 0 || trendingLoading) && (
              <YStack marginBottom={12}>
                <XStack justifyContent="space-between" alignItems="center" marginBottom={6}>
                  <Text fontSize={13} fontWeight="600">
                    Hashtag nổi bật
                  </Text>
                  {activeTag && (
                    <Button
                      height={26}
                      borderRadius={999}
                      backgroundColor="#E5E7EB"
                      onPress={() => {
                        setActiveTag(null);
                        loadFeed();
                      }}
                    >
                      <Text fontSize={11}>Xoá lọc</Text>
                    </Button>
                  )}
                </XStack>

                {trendingLoading ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <XStack gap={8}>
                      {trendingTags.map(tag => {
                        const active = activeTag === tag;
                        return (
                          <Button
                            key={tag}
                            height={30}
                            paddingHorizontal={12}
                            borderRadius={999}
                            backgroundColor={active ? PRIMARY : '#F3F4F6'}
                            onPress={async () => {
                              setActiveTag(tag);
                              await loadPostsByHashtag(tag);
                            }}
                          >
                            <Text
                              fontSize={12}
                              color={active ? '#fff' : '#111827'}
                            >
                              #{tag}
                            </Text>
                          </Button>
                        );
                      })}
                    </XStack>
                  </ScrollView>
                )}
              </YStack>
            )}

            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                comments={commentsByPost[post.id] || []}
                onToggleLike={toggleLike}
                onAddComment={addComment}
                onFocusCommentInput={() => {
                  setActiveCommentPostId(post.id);
                  setCommentText('');
                  loadCommentsForPost(post.id);
                }}
                commentText={activeCommentPostId === post.id ? commentText : undefined}
                onChangeCommentText={setCommentText}
                onSubmitComment={handleSubmitComment}
                onEditComment={(comment) => {
                  // Chỉ cho phép edit comment của chính mình
                  if ((comment as any).userId === currentUserId) {
                    setActiveCommentPostId(post.id);
                    setEditingComment({ postId: post.id, comment });
                    setCommentText(comment.text);
                  }
                }}
                canEditComment={(comment) => (comment as any).userId === currentUserId}
                onShare={setSharePost}
                onReport={handleReportPost}
                onHide={handleHidePost}
                onMute={handleMutePost}
                onUserPress={(user) => {
                  handleOpenUserActions(user);
                }}
                canEdit={post.user?.id === currentUserId}
                onDelete={(postId) => {
                  setPosts(prev => prev.filter(p => p.id !== postId));
                }}
              />
            ))}

            {!loadingFeed && filteredPosts.length === 0 && (
              <YStack alignItems="center" marginTop={40}>
                <Text color="#777">Không tìm thấy bài viết phù hợp.</Text>
              </YStack>
            )}
          </ScrollView>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <CreatePostCard
                content={content}
                onChangeContent={setContent}
                privacy={privacy}
                onChangePrivacy={setPrivacy}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
                onCreate={handleCreatePost}
                creating={creating}
                imageUri={imageUri}
                onPickImage={handlePickImage}
                onRemoveImage={() => setImageUri(null)}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* Search modal */}
        <Modal
          visible={searchVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setSearchVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <Card padding={16} borderRadius={18} backgroundColor="#fff">
              <Text fontSize={16} fontWeight="700">
                Tìm kiếm trong cộng đồng
              </Text>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nhập từ khóa, hashtag..."
                marginTop={12}
                borderRadius={12}
                height={48}
                fontSize={14}
                paddingHorizontal={12}
              />
              <XStack justifyContent="flex-end" marginTop={16} gap={8}>
                <Button
                  height={38}
                  borderRadius={999}
                  backgroundColor="#E5E7EB"
                  onPress={() => {
                    setSearchQuery('');
                    setSearchVisible(false);
                  }}
                >
                  <Text color="#000">Đóng</Text>
                </Button>
                <Button
                  height={38}
                  borderRadius={999}
                  backgroundColor={PRIMARY}
                  onPress={() => setSearchVisible(false)}
                >
                  <Text color="#fff" fontWeight="700">
                    Áp dụng
                  </Text>
                </Button>
              </XStack>
            </Card>
          </View>
        </Modal>

        {/* Blocklist modal */}
        <Modal
          visible={blocklistVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setBlocklistVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <Card padding={16} borderRadius={18} backgroundColor="#fff">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={16} fontWeight="700">
                  Người dùng đã chặn
                </Text>
                <Button
                  backgroundColor="transparent"
                  height={30}
                  width={30}
                  onPress={() => setBlocklistVisible(false)}
                >
                  <Ionicons name="close" size={18} color="#555" />
                </Button>
              </XStack>

              {loadingBlocklist ? (
                <YStack alignItems="center" marginTop={16} gap={8}>
                  <ActivityIndicator />
                  <Text fontSize={13} color="#6B7280">
                    Đang tải danh sách...
                  </Text>
                </YStack>
              ) : blockedUsers.length === 0 ? (
                <YStack marginTop={16}>
                  <Text fontSize={13} color="#6B7280">
                    Bạn chưa chặn ai.
                  </Text>
                </YStack>
              ) : (
                <YStack marginTop={12} gap={8}>
                  {blockedUsers.map(b => {
                    const u = b.blockedUserId || b.user || {};
                    const name = u.name || 'Người dùng';
                    const id = u._id || u.id;

                    return (
                      <XStack
                        key={id}
                        justifyContent="space-between"
                        alignItems="center"
                        paddingVertical={6}
                      >
                        <Text fontSize={13}>{name}</Text>
                        <Button
                          height={30}
                          borderRadius={999}
                          backgroundColor="#E5E7EB"
                          onPress={() => handleUnblock(id)}
                        >
                          <Text fontSize={12}>Bỏ chặn</Text>
                        </Button>
                      </XStack>
                    );
                  })}
                </YStack>
              )}
            </Card>
          </View>
        </Modal>

        {/* Notifications modal */}
        <Modal
          visible={notificationsVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setNotificationsVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
              paddingTop: 60,
              paddingRight: 16,
            }}
          >
            <Card
              padding={12}
              borderRadius={16}
              backgroundColor="#FFFFFF"
              width={260}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={14} fontWeight="700">
                  Tài khoản & Thông báo
                </Text>
                <Button
                  backgroundColor="transparent"
                  height={30}
                  width={30}
                  onPress={() => setNotificationsVisible(false)}
                >
                  <Ionicons name="close" size={18} color="#555" />
                </Button>
              </XStack>

              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <YStack marginTop={12} gap={8}>
                  <Text fontSize={13} fontWeight="600" color="#111">
                    Lời mời kết bạn ({friendRequestCount})
                  </Text>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {friendRequests.map((req: any) => {
                      const sender = req.friendId || {};
                      const senderId = sender._id || sender.id;
                      const senderName = sender.name || 'Người dùng';

                      return (
                        <XStack
                          key={req._id || req.id || senderId}
                          padding={8}
                          backgroundColor="#F9FAFB"
                          borderRadius={8}
                          alignItems="center"
                          gap={8}
                          marginBottom={6}
                        >
                          <YStack flex={1}>
                            <Text fontSize={13} fontWeight="600">
                              {senderName}
                            </Text>
                            <Text fontSize={11} color="#6B7280">
                              Muốn kết bạn với bạn
                            </Text>
                          </YStack>
                          <XStack gap={6}>
                            <Button
                              height={28}
                              paddingHorizontal={10}
                              borderRadius={6}
                              backgroundColor="#10B981"
                              onPress={() => handleAcceptFriend(senderId, senderName)}
                            >
                              <Text fontSize={11} color="white" fontWeight="600">
                                Chấp nhận
                              </Text>
                            </Button>
                            <Button
                              height={28}
                              paddingHorizontal={10}
                              borderRadius={6}
                              backgroundColor="#EF4444"
                              onPress={() => handleRejectFriend(senderId, senderName)}
                            >
                              <Text fontSize={11} color="white" fontWeight="600">
                                Từ chối
                              </Text>
                            </Button>
                          </XStack>
                        </XStack>
                      );
                    })}
                  </ScrollView>
                </YStack>
              )}

              <Button
                marginTop={8}
                height={36}
                borderRadius={999}
                backgroundColor="#F3F4F6"
                onPress={async () => {
                  setNotificationsVisible(false);
                  await loadBlocklist();
                  setBlocklistVisible(true);
                }}
              >
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="ban-outline" size={18} color="#EF4444" />
                  <Text fontSize={16} fontWeight="600" color="#000">
                    Danh sách đã chặn
                  </Text>
                </XStack>
              </Button>
            </Card>
          </View>
        </Modal>

        {/* Share modal */}
        <Modal
          visible={!!sharePost}
          animationType="fade"
          transparent
          onRequestClose={() => setSharePost(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              justifyContent: 'flex-end',
            }}
          >
            <Card
              padding={16}
              borderRadius={24}
              backgroundColor="#FFFFFF"
              margin={12}
            >
              <Text fontSize={15} fontWeight="700">
                Chia sẻ bài viết
              </Text>
              {sharePost && (
                <Text
                  numberOfLines={2}
                  fontSize={13}
                  color="#4B5563"
                  marginTop={6}
                >
                  {sharePost.content}
                </Text>
              )}

              <YStack marginTop={12} gap={8}>
                <Button
                  height={42}
                  borderRadius={999}
                  backgroundColor={PRIMARY_SOFT}
                  onPress={handleShareConfirm}
                  disabled={isSharing}
                >
                  <XStack alignItems="center" gap={8}>
                    <Ionicons name="share-outline" size={18} color={PRIMARY} />
                    <Text fontSize={13} color="#111">
                      {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ lại lên Feed của bạn'}
                    </Text>
                  </XStack>
                </Button>
              </YStack>

              <Button
                marginTop={10}
                height={40}
                borderRadius={999}
                backgroundColor="#E5E7EB"
                onPress={() => setSharePost(null)}
              >
                <Text color="#000">Đóng</Text>
              </Button>
            </Card>
          </View>
        </Modal>

        {/* User actions modal */}
        <Modal
          visible={userActionsVisible && !!selectedUser}
          animationType="fade"
          transparent
          onRequestClose={handleCloseUserActions}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)',
              justifyContent: 'flex-end',
            }}
          >
            <Card
              padding={16}
              borderRadius={24}
              backgroundColor="#fff"
              margin={12}
            >
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: '#E5E7EB',
                  marginBottom: 8,
                }}
              />
              <Text fontSize={16} fontWeight="700">
                {selectedUser?.name}
              </Text>
              <Text fontSize={12} color="#9ca3af" marginTop={2}>
                Tuỳ chọn tương tác
              </Text>

              <YStack marginTop={12} gap={8}>
                {/* Xem trang cá nhân */}
                <Button
                  height={40}
                  borderRadius={999}
                  backgroundColor={PRIMARY_SOFT}
                  onPress={handleViewCommunityProfile}
                >
                  <XStack alignItems="center" gap={8}>
                    <Ionicons name="person-circle" size={18} color={PRIMARY} />
                    <Text fontSize={13} color="#000">Xem trang cá nhân</Text>
                  </XStack>
                </Button>

                {friendStatus !== 'self' && (
                  <>
                    <Button
                      height={40}
                      borderRadius={999}
                      backgroundColor={
                        friendStatus === 'friends'
                          ? '#DCFCE7'
                          : friendStatus === 'pending'
                            ? '#FEF3C7'
                            : '#F3F4F6'
                      }
                      onPress={handleAddFriend}
                      disabled={isFriendButtonDisabled}
                    >
                      <Text fontSize={13} color="#000">{renderFriendLabel()}</Text>
                    </Button>

                    {(friendStatus === 'friends' || friendStatus === 'pending') && (
                      <Button
                        marginTop={8}
                        height={40}
                        borderRadius={999}
                        backgroundColor="#FEE2E2"
                        onPress={handleUnfriend}
                      >
                        <Text fontSize={13} color="#B91C1C" fontWeight="600">
                          {friendStatus === 'friends' ? 'Huỷ kết bạn' : 'Huỷ lời mời'}
                        </Text>
                      </Button>
                    )}

                    <Button
                      height={40}
                      borderRadius={999}
                      backgroundColor="#F3F4F6"
                      onPress={handleSendMessage}
                    >
                      <Text fontSize={13} color="#000">Nhắn tin</Text>
                    </Button>

                    <Button
                      height={40}
                      borderRadius={999}
                      backgroundColor="#FEE2E2"
                      onPress={handleBlockUser}
                    >
                      <Text fontSize={13} color="#b91c1c">
                        Chặn người dùng
                      </Text>
                    </Button>
                  </>
                )}
              </YStack>

              <Button
                marginTop={10}
                height={38}
                borderRadius={999}
                backgroundColor="#E5E7EB"
                onPress={() => setUserActionsVisible(false)}
              >
                <Text color="#000">Đóng</Text>
              </Button>
            </Card>
          </View>
        </Modal>
      </YStack>
      <AppealModal
        visible={appealModalVisible}
        onClose={() => setAppealModalVisible(false)}
        onSubmit={async (reason) => {
          try {
            setAppealLoading(true);
            if (!currentUserId) {
              Alert.alert('Lỗi', 'Không thể xác định tài khoản. Vui lòng đăng nhập lại.');
              setAppealLoading(false);
              return;
            }
            // Submit ban appeal using createAppeal (correct endpoint)
            await SocialApi.createAppeal('account', currentUserId, reason);
            Alert.alert('Thành công', 'Đã gửi kháng cáo. Vui lòng chờ phản hồi.');
            setAppealModalVisible(false);
          } catch (err: any) {
            console.error('Appeal error:', err);
            Alert.alert('Lỗi', err.message || 'Không thể gửi kháng cáo');
          } finally {
            setAppealLoading(false);
          }
        }}
        loading={appealLoading}
        contentType="ban"
      />

    </SafeAreaView >
  );
}

type CreatePostProps = {
  content: string;
  onChangeContent: (v: string) => void;
  privacy: 'public' | 'friends';
  onChangePrivacy: (v: 'public' | 'friends') => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onCreate: () => void;
  creating: boolean;
  imageUri: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
};

function CreatePostCard({
  content,
  onChangeContent,
  privacy,
  onChangePrivacy,
  selectedTags,
  onToggleTag,
  onCreate,
  creating,
  imageUri,
  onPickImage,
  onRemoveImage,
}: CreatePostProps) {
  return (
    <Card
      padding={16}
      borderRadius={20}
      backgroundColor="#FFFFFF"
      borderWidth={1}
      borderColor="#E8ECF3"
    >
      <XStack alignItems="center" gap={8}>
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={PRIMARY_SOFT}
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="person" size={20} color={PRIMARY} />
        </YStack>
        <YStack>
          <Text fontWeight="700">Chia sẻ hành trình của bạn</Text>
          <Text fontSize={12} color="#8A8A8A">
            Truyền cảm hứng cho cộng đồng
          </Text>
        </YStack>
      </XStack>

      <YStack marginTop={12}>
        <Input
          multiline
          numberOfLines={5}
          value={content}
          onChangeText={onChangeContent}
          placeholder="Hãy chia sẻ tiến độ, cảm xúc hoặc tips hữu ích của bạn..."
          backgroundColor="#F8F8F8"
          borderRadius={16}
          padding={12}
          fontSize={14}
          color="#111827"
        />
        <Text fontSize={11} color="#9A9A9A" textAlign="right" marginTop={4}>
          {content.length}/500 ký tự
        </Text>
      </YStack>

      <YStack marginTop={12}>
        <Text fontSize={13} fontWeight="600">
          Quyền riêng tư
        </Text>
        <XStack gap={8} marginTop={6}>
          <Button
            flex={1}
            height={36}
            borderRadius={999}
            backgroundColor={
              privacy === 'public' ? PRIMARY_SOFT : '#F2F2F2'
            }
            onPress={() => onChangePrivacy('public')}
          >
            <Text
              fontSize={13}
              color={privacy === 'public' ? PRIMARY : '#555'}
              fontWeight="600"
            >
              Công khai
            </Text>
          </Button>

          <Button
            flex={1}
            height={36}
            borderRadius={999}
            backgroundColor={
              privacy === 'friends' ? PRIMARY_SOFT : '#F2F2F2'
            }
            onPress={() => onChangePrivacy('friends')}
          >
            <Text
              fontSize={13}
              color={privacy === 'friends' ? PRIMARY : '#555'}
              fontWeight="600"
            >
              Bạn bè
            </Text>
          </Button>
        </XStack>
      </YStack>

      <YStack marginTop={12}>
        <Text fontSize={13} fontWeight="600">
          Hashtags gợi ý
        </Text>
        <XStack flexWrap="wrap" gap={8} marginTop={6}>
          {SUGGESTED_TAGS.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <Button
                key={tag}
                height={30}
                borderRadius={999}
                paddingHorizontal={12}
                backgroundColor={active ? PRIMARY : '#F2F2F2'}
                onPress={() => onToggleTag(tag)}
              >
                <Text
                  fontSize={12}
                  color={active ? '#fff' : '#555'}
                  fontWeight="600"
                >
                  #{tag}
                </Text>
              </Button>
            );
          })}
        </XStack>
      </YStack>

      {/* Ảnh đính kèm */}
      <YStack marginTop={12}>
        <Text fontSize={13} fontWeight="600">
          Ảnh đính kèm
        </Text>
        <XStack marginTop={6} gap={8} alignItems="center">
          <Button
            height={36}
            borderRadius={999}
            backgroundColor="#F2F2F2"
            onPress={onPickImage}
          >
            <XStack alignItems="center" gap={6}>
              <Ionicons name="image-outline" size={16} color="#111" />
              <Text fontSize={13} color="#000">Thêm ảnh</Text>
            </XStack>
          </Button>
          {imageUri && (
            <Button
              height={32}
              borderRadius={999}
              backgroundColor="#FEE2E2"
              onPress={onRemoveImage}
            >
              <Text fontSize={12} color="#b91c1c">
                Xoá ảnh
              </Text>
            </Button>
          )}
        </XStack>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{
              marginTop: 8,
              width: '100%',
              height: 180,
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
        )}
      </YStack>

      <Card
        marginTop={16}
        borderRadius={16}
        padding={12}
        backgroundColor="#E3E8FF"
      >
        <Text fontSize={14} fontWeight="600" marginBottom={8} color="#000">
          Tips chia sẻ hiệu quả
        </Text>
        <Text fontSize={12} color="#333" marginTop={4}>
          · Chia sẻ trải nghiệm cá nhân và cảm xúc thật.{'\n'}
          · Tránh tư vấn y khoa, chỉ chia sẻ trải nghiệm của bạn.{'\n'}
          · Hashtag rõ ràng giúp mọi người dễ tìm thấy bài viết hơn.
        </Text>
      </Card>

      <Button
        marginTop={16}
        height={48}
        borderRadius={999}
        backgroundColor={PRIMARY}
        onPress={onCreate}
        disabled={creating}
      >
        <Text fontSize={16} fontWeight="700" color="#FFFFFF">
          {creating ? 'Đang đăng...' : 'Đăng bài viết'}
        </Text>
      </Button>
    </Card>
  );
}
