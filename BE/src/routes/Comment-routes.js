import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import { commentRateLimit, moderateComment } from '../../middlewares/moderationMiddleware.js';
import { canBypassModeration } from '../../middlewares/requireModerator.js';
import {
    createComment,
    getComments,
    getReplies,
    updateComment,
    deleteComment,
    toggleLikeComment,
    getCommentLikes
} from '../controllers/Comment_controller.js';

const router = express.Router();

// ========== COMMENT CRUD ==========

// Tạo comment mới (hoặc reply) with moderation
router.post('/', authenticateToken, commentRateLimit, (req, res, next) => {
    // Skip moderation for admin/moderator
    if (canBypassModeration(req.user)) {
        return next();
    }
    return moderateComment(req, res, next);
}, createComment);

// Lấy comments của 1 bài viết
router.get('/post/:postId', authenticateToken, getComments);

// Lấy replies của 1 comment
router.get('/:commentId/replies', authenticateToken, getReplies);

// Cập nhật comment
router.put('/:commentId', authenticateToken, updateComment);

// Xóa comment
router.delete('/:commentId', authenticateToken, deleteComment);

// ========== LIKE COMMENT ==========

// Toggle like/unlike comment
router.post('/:commentId/like', authenticateToken, toggleLikeComment);

// Lấy danh sách người like comment
router.get('/:commentId/likes', authenticateToken, getCommentLikes);

export default router;
