import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import { postRateLimit, moderatePost } from '../../middlewares/moderationMiddleware.js';
import { canBypassModeration } from '../../middlewares/requireModerator.js';
import {
    createPost,
    getFeed,
    getUserPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLikePost,
    getPostLikes,
    sharePost,
    getTrendingHashtags,
    getPostsByHashtag,
    reportPost
} from '../controllers/Post_controller.js';

const router = express.Router();

// ========== FEED ==========

// Lấy feed (bài viết của bạn bè và public posts)
router.get('/feed', authenticateToken, getFeed);

// Lấy trending hashtags
router.get('/trending/hashtags', authenticateToken, getTrendingHashtags);

// Tìm bài viết theo hashtag
router.get('/hashtag/:hashtag', authenticateToken, getPostsByHashtag);

// ========== POST CRUD ==========

// Tạo bài viết mới (with moderation)
router.post('/', authenticateToken, postRateLimit, (req, res, next) => {
    // Skip moderation for admin/moderator
    if (canBypassModeration(req.user)) {
        return next();
    }
    return moderatePost(req, res, next);
}, createPost);

// Lấy bài viết của 1 user cụ thể
router.get('/user/:userId', authenticateToken, getUserPosts);

// Lấy chi tiết 1 bài viết
router.get('/:postId', authenticateToken, getPostById);

// Cập nhật bài viết
router.put('/:postId', authenticateToken, updatePost);

// Xóa bài viết
router.delete('/:postId', authenticateToken, deletePost);

// ========== LIKE ==========

// Toggle like/unlike bài viết
router.post('/:postId/like', authenticateToken, toggleLikePost);

// Lấy danh sách người like
router.get('/:postId/likes', authenticateToken, getPostLikes);

// ========== SHARE ==========

// Share bài viết
router.post('/:postId/share', authenticateToken, sharePost);

// ========== REPORT ==========

// Báo cáo bài viết vi phạm
router.post('/:postId/report', authenticateToken, reportPost);

export default router;
