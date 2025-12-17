// app/(tabs)/community/PostCard.tsx
import React, { useState } from 'react';
import { Image, TextInput as RNTextInput, Pressable, TouchableOpacity, Alert, View } from 'react-native';
import { YStack, XStack, Text, Button, Card, Separator } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppealModal from '../../../components/AppealModal';
import ReportModal from '../../../components/ReportModal';
import { SocialApi } from '../../../api/services';
import { notifyError, notifySuccess } from '../../../utils/notify';
import { getFullImageUrl } from '../../../server/users';

const PRIMARY = '#FF2FB2';
const PRIMARY_SOFT = '#FFE6F4';

const AVATAR_GIRL = require('../../../assets/images/avatar-girl.png');
const AVATAR_PLACEHOLDER = require('../../../assets/images/avatar-placeholder.png');

export type Post = {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
    gender?: string;
    badge?: string;
    trustScore?: number;
  };
  createdAgo: string;
  content: string;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  imageUrl?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  sharedPost?: {
    id: string;
    content: string;
    imageUrl?: string;
    user: {
      name: string;
      avatarUrl?: string;
    };
  };
};

export type Comment = {
  id: string;
  postId: string;
  author: string;
  text: string;
  createdAgo: string;
  avatarUrl?: string;
  userId?: string; // Thêm để check quyền edit
  moderationStatus?: 'pending' | 'approved' | 'rejected';
};

type PostCardProps = {
  post: Post;
  comments: Comment[];
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onFocusCommentInput?: () => void;
  onToggleComments?: (postId: string, nextShow: boolean) => void;
  commentText?: string;
  onChangeCommentText?: (text: string) => void;
  onSubmitComment?: () => void;
  onEditComment?: (comment: Comment) => void;
  canEditComment?: (comment: Comment) => boolean;
  onShare: (post: Post) => void;
  onReport?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onHide: (postId: string) => void;
  onMute: (postId: string) => void;
  onUserPress?: (user: Post['user']) => void;
  canEdit?: boolean;
  onEdit?: (post: Post) => void;
};

export default function PostCard({
  post,
  comments,
  onToggleLike,
  onAddComment,
  onFocusCommentInput,
  onToggleComments,
  commentText: commentTextProp,
  onChangeCommentText,
  onSubmitComment,
  onEditComment,
  canEditComment,
  onShare,
  onReport,
  onDelete,
  onHide,
  onMute,
  onUserPress,
  canEdit,
  onEdit,
}: PostCardProps) {
  const [localCommentText, setLocalCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const isControlled = typeof commentTextProp !== 'undefined';
  const commentValue = isControlled ? commentTextProp : localCommentText;
  const handleChangeComment = (t: string) => {
    if (onChangeCommentText) return onChangeCommentText(t);
    setLocalCommentText(t);
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (onToggleComments) onToggleComments(post.id, next);
    if (next && onFocusCommentInput) onFocusCommentInput();
  };

  const handleSendComment = () => {
    if (!commentValue || !commentValue.trim()) return;
    if (onSubmitComment) {
      onSubmitComment();
      // parent will clear commentText; still show comments
      setShowComments(true);
      return;
    }

    onAddComment(post.id, commentValue);
    if (!isControlled) setLocalCommentText('');
    setShowComments(true);
  };

  const handleAppealSubmit = async (reason: string) => {
    setAppealLoading(true);
    try {
      await SocialApi.submitAppeal('post', post.id, reason);
      notifySuccess('Thành công', 'Đã gửi khiếu nại. Chúng tôi sẽ xem xét lại trong vòng 24-48 giờ.');
      setAppealModalVisible(false);
    } catch (error: any) {
      notifyError('Lỗi', error.message || 'Không thể gửi khiếu nại');
    } finally {
      setAppealLoading(false);
    }
  };


  const handleReportSubmit = async (payload: { reason: string; description?: string }) => {
    setReportLoading(true);
    try {
      // reportContent now receives reason (enum) and optional description
      await SocialApi.reportContent('post', post.id, payload.reason, payload.description);
      notifySuccess('Đã báo cáo', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.');
      setReportModalVisible(false);
    } catch (error: any) {
      notifyError('Lỗi', error.message || 'Không thể gửi báo cáo');
    } finally {
      setReportLoading(false);
    }
  };


  const handleDelete = () => {
    Alert.alert(
      'Xóa bài viết',
      'Bạn có chắc chắn muốn xóa bài viết này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (onDelete) onDelete(post.id);
            // Also call API if onDelete passed from parent doesn't handle it, 
            // but usually parent handles state update.
            // If parent just updates list, we might need to call API here or in parent.
            // Let's assume parent handles logic or we call simple API:
            try {
              await SocialApi.deletePost(post.id);
            } catch (e) { }
          }
        }
      ]
    );
  };

  return (
    <Card
      padding={16}
      borderRadius={20}
      backgroundColor="#FFFFFF"
      borderWidth={1}
      borderColor="#E8ECF3"
      marginBottom={12}
      position="relative"
    >
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <Pressable onPress={() => (onUserPress ? onUserPress(post.user) : undefined)}>
          <XStack alignItems="center" gap={10}>
            <Image
              source={
                !avatarError && post.user.avatarUrl && post.user.avatarUrl.trim()
                  ? { uri: post.user.avatarUrl }
                  : (post.user.gender || '').toLowerCase() === 'female'
                    ? AVATAR_GIRL
                    : AVATAR_PLACEHOLDER
              }
              onError={() => setAvatarError(true)}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <YStack>
              <XStack alignItems="center" gap={6}>
                <Text fontWeight="700" color="#000">{post.user.name}</Text>
                {post.user.badge ? (
                  <Text
                    fontSize={10}
                    paddingHorizontal={6}
                    paddingVertical={2}
                    borderRadius={999}
                    backgroundColor={PRIMARY_SOFT}
                    color={PRIMARY}
                    fontWeight="600"
                  >
                    {post.user.badge}
                  </Text>
                ) : null}
              </XStack>
              <Text fontSize={11} color="#9A9A9A">
                {post.createdAgo}
              </Text>
            </YStack>
          </XStack>
        </Pressable>
        {/* Menu button for everyone */}
        <Button backgroundColor="transparent" height={30} width={30} onPress={() => setOptionsVisible(v => !v)}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#777" />
        </Button>
      </XStack>

      {/* Moderation Status Badge */}
      {post.moderationStatus === 'pending' && (
        <XStack
          marginTop={8}
          paddingHorizontal={10}
          paddingVertical={6}
          borderRadius={8}
          backgroundColor="#FEF3C7"
          alignItems="center"
          gap={6}
        >
          <Ionicons name="time-outline" size={14} color="#D97706" />
          <Text fontSize={12} color="#92400E" fontWeight="600">
            Đang chờ kiểm duyệt
          </Text>
        </XStack>
      )}

      {/* Rejected moderation badge + Appeal button */}
      {post.moderationStatus === 'rejected' && (
        <YStack marginTop={8} gap={8}>
          <XStack
            paddingHorizontal={10}
            paddingVertical={6}
            borderRadius={8}
            backgroundColor="#FEE2E2"
            alignItems="center"
            gap={6}
          >
            <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
            <Text fontSize={12} color="#991B1B" fontWeight="600">
              Nội dung bị từ chối
            </Text>
          </XStack>
          <Button
            size="$3"
            backgroundColor="#F59E0B"
            color="white"
            onPress={() => setAppealModalVisible(true)}
            icon={<Ionicons name="megaphone-outline" size={16} color="white" />}
          >
            Khiếu nại
          </Button>
        </YStack>
      )}

      {/* Content */}
      <Text marginTop={10} fontSize={14} color="#222">
        {post.content}
      </Text>

      {/* Content image */}
      {post.imageUrl && (
        <Image
          source={{ uri: getFullImageUrl(post.imageUrl) }}
          style={{
            marginTop: 10,
            width: '100%',
            height: 250,
            borderRadius: 16,
          }}
          resizeMode="contain"
          onError={(e) => {
            console.log('[IMG ERROR] Post Content:', {
              id: post.id,
              uri: getFullImageUrl(post.imageUrl),
              error: e.nativeEvent
            });
          }}
        />
      )}

      {/* Shared post display */}
      {post.sharedPost && (
        <YStack
          marginTop={10}
          padding={12}
          borderRadius={12}
          borderWidth={1}
          borderColor="#E8ECF3"
          backgroundColor="#F9FAFB"
        >
          <XStack alignItems="center" gap={8} marginBottom={8}>
            {post.sharedPost.user.avatarUrl && (
              <Image
                source={{ uri: post.sharedPost.user.avatarUrl }}
                style={{ width: 24, height: 24, borderRadius: 12 }}
              />
            )}
            <Text fontSize={12} fontWeight="600" color="#555">
              {post.sharedPost.user.name}
            </Text>
          </XStack>
          <Text fontSize={13} color="#333">
            {post.sharedPost.content}
          </Text>
          {post.sharedPost.imageUrl && (
            <Image
              source={{ uri: getFullImageUrl(post.sharedPost.imageUrl) }}
              style={{
                marginTop: 8,
                width: '100%',
                height: 250,
                borderRadius: 8,
              }}
              resizeMode="contain"
              onError={(e) => {
                console.log('[IMG ERROR] Shared Post Content:', {
                  id: post.sharedPost?.id,
                  uri: getFullImageUrl(post.sharedPost?.imageUrl),
                  error: e.nativeEvent
                });
              }}
            />
          )}
        </YStack>
      )}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <XStack flexWrap="wrap" gap={6} marginTop={8}>
          {post.hashtags.map(tag => (
            <Text key={tag} fontSize={12} color={PRIMARY}>
              #{tag}
            </Text>
          ))}
        </XStack>
      )}

      <Separator marginVertical={10} backgroundColor="#F0F2F7" />

      {/* Actions */}
      <XStack justifyContent="space-between" alignItems="center">
        <Button
          backgroundColor="transparent"
          height={32}
          onPress={() => onToggleLike(post.id)}
        >
          <XStack alignItems="center" gap={6}>
            <Ionicons
              name={post.hasLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.hasLiked ? PRIMARY : '#444'}
            />
            <Text fontSize={13} color="#333">{post.likeCount}</Text>
          </XStack>
        </Button>

        <Button
          backgroundColor="transparent"
          height={32}
          onPress={handleToggleComments}
        >
          <XStack alignItems="center" gap={6}>
            <Ionicons name="chatbubble-outline" size={20} color="#444" />
            <Text fontSize={13} color="#333">{post.commentCount}</Text>
          </XStack>
        </Button>

        <Button backgroundColor="transparent" height={32} onPress={() => onShare(post)}>
          <XStack alignItems="center" gap={6}>
            <Ionicons name="arrow-redo-outline" size={20} color="#444" />
            <Text fontSize={13} color="#333">Chia sẻ</Text>
          </XStack>
        </Button>
      </XStack>

      {/* Comment input */}
      <YStack marginTop={8}>
        <XStack
          alignItems="center"
          backgroundColor="#F7F8FC"
          borderRadius={999}
          paddingHorizontal={12}
        >
          <RNTextInput
            style={{
              flex: 1,
              height: 40,
              fontSize: 13,
              color: '#000',
            }}
            placeholder="Viết bình luận..."
            value={commentValue}
            onChangeText={handleChangeComment}
            onFocus={() => onFocusCommentInput?.()}
          />
          <Button
            backgroundColor="transparent"
            height={40}
            width={40}
            onPress={handleSendComment}
          >
            <Ionicons name="send" size={18} color={PRIMARY} />
          </Button>
        </XStack>
      </YStack>

      {/* Comment list */}
      {showComments && comments.length > 0 && (
        <YStack marginTop={10} gap={6}>
          {comments.map(c => (
            <YStack
              key={c.id}
              padding={8}
              borderRadius={10}
              backgroundColor="#F7F8FC"
            >
              <YStack flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text fontSize={12} fontWeight="600" color="#000">
                  {c.author}{' '}
                  <Text fontSize={11} color="#9A9A9A">
                    · {c.createdAgo}
                  </Text>
                </Text>
                {onEditComment && canEditComment && canEditComment(c) ? (
                  <TouchableOpacity onPress={() => onEditComment(c)}>
                    <Text fontSize={12} color="#2563EB">Chỉnh sửa</Text>
                  </TouchableOpacity>
                ) : null}
              </YStack>
              <Text fontSize={13} color="#000">{c.text}</Text>
              {c.moderationStatus === 'pending' && (
                <Text fontSize={11} color="#92400E" marginTop={4}>
                  ⏱ Đang chờ kiểm duyệt
                </Text>
              )}
            </YStack>
          ))}
        </YStack>
      )}

      {/* Options menu - Only for own posts */}
      {optionsVisible && canEdit && (
        <YStack
          position="absolute"
          top={8}
          right={8}
          borderRadius={12}
          backgroundColor="#FFFFFF"
          paddingVertical={4}
          paddingHorizontal={4}
          shadowColor="rgba(0,0,0,0.15)"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.9}
          shadowRadius={6}
          borderWidth={1}
          borderColor="#E5E7EB"
          zIndex={100}
        >
          {/* Edit post - Owner only */}
          {canEdit && (
            <Button
              backgroundColor="transparent"
              height={32}
              justifyContent="flex-start"
              onPress={() => {
                if (onEdit) onEdit(post);
                setOptionsVisible(false);
              }}
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="pencil-outline" size={16} color="#111827" />
                <Text fontSize={13} color="#000">Chỉnh sửa bài viết</Text>
              </XStack>
            </Button>
          )}

          {/* Delete post - Owner only */}
          {canEdit && (
            <Button
              backgroundColor="transparent"
              height={32}
              justifyContent="flex-start"
              onPress={() => {
                setOptionsVisible(false);
                handleDelete();
              }}
            >
              <XStack alignItems="center" gap={6}>
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text fontSize={13} color="#DC2626">Xóa bài viết</Text>
              </XStack>
            </Button>
          )}

          {/* Close */}
          <Button
            backgroundColor="transparent"
            height={32}
            justifyContent="flex-start"
            onPress={() => setOptionsVisible(false)}
          >
            <XStack alignItems="center" gap={6}>
              <Ionicons name="close-outline" size={16} color="#9ca3af" />
              <Text fontSize={13} color="#000">Đóng</Text>
            </XStack>
          </Button>
        </YStack>
      )}

      {/* Options menu - For others (Report) */}
      {optionsVisible && !canEdit && (
        <YStack
          position="absolute"
          top={8}
          right={8}
          borderRadius={12}
          backgroundColor="#FFFFFF"
          paddingVertical={4}
          paddingHorizontal={4}
          shadowColor="rgba(0,0,0,0.15)"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.9}
          shadowRadius={6}
          borderWidth={1}
          borderColor="#E5E7EB"
          zIndex={100}
        >
          <Button
            backgroundColor="transparent"
            height={32}
            justifyContent="flex-start"
            onPress={() => {
              setOptionsVisible(false);
              setReportModalVisible(true);
            }}
          >
            <XStack alignItems="center" gap={6}>
              <Ionicons name="flag-outline" size={16} color="#111827" />
              <Text fontSize={13} color="#000">Báo cáo bài viết</Text>
            </XStack>
          </Button>

          <Button
            backgroundColor="transparent"
            height={32}
            justifyContent="flex-start"
            onPress={() => setOptionsVisible(false)}
          >
            <XStack alignItems="center" gap={6}>
              <Ionicons name="close-outline" size={16} color="#9ca3af" />
              <Text fontSize={13} color="#000">Đóng</Text>
            </XStack>
          </Button>
        </YStack>
      )}

      {/* Appeal Modal */}
      <AppealModal
        visible={appealModalVisible}
        onClose={() => setAppealModalVisible(false)}
        onSubmit={handleAppealSubmit}
        loading={appealLoading}
        contentType="post"
      />

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
        loading={reportLoading}
      />
    </Card>
  );
}
