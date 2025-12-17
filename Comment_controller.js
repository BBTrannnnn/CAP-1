import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Report from '../models/Report.js';
import ModerationLog from '../models/ModerationLog.js';
import { processModerationAsync } from '../../middlewares/moderationMiddleware.js';
import { canBypassModeration } from '../../middlewares/requireModerator.js';
import mongoose from 'mongoose';

// ========== COMMENT CRUD ==========

// Tạo comment mới
export const createComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId, content, parentCommentId } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung bình luận không được để trống'
            });
        }

        // Kiểm tra post có tồn tại không
        const post = await Post.findById(postId);
        if (!post || !post.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Nếu là reply, kiểm tra parent comment
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment || !parentComment.isActive) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bình luận gốc'
                });
            }

            // Tăng reply count của parent comment
            parentComment.replyCount += 1;
            await parentComment.save();
        }

        // Xác định trạng thái kiểm duyệt dựa trên role
        const moderationStatus = canBypassModeration(req.user) ? 'approved' : 'pending';

        const comment = await Comment.create({
            postId,
            userId,
            content: content.trim(),
            parentCommentId: parentCommentId || null,
            moderationStatus,
            autoApproved: canBypassModeration(req.user)
        });

        // Tăng comment count của post
        post.commentCount += 1;
        await post.save();

        await comment.populate('userId', 'name avatar badge');

        // Xử lý kiểm duyệt bất đồng bộ nếu không bypass
        if (!canBypassModeration(req.user)) {
            setImmediate(() => {
                processModerationAsync('comment', comment._id, userId).catch(err => {
                    console.error('Background moderation error:', err);
                });
            });
        } else {
            // Log auto-approval for admin/moderator
            await ModerationLog.create({
                userId,
                contentType: 'comment',
                contentId: comment._id,
                action: 'auto_approved',
                reason: 'Trusted user (bypass)',
                reviewedBy: userId,
                reviewedAt: new Date(),
                scores: { profanity: 0, nsfw: 0, spam: 0 }
            });
        }

        res.status(201).json({
            success: true,
            message: moderationStatus === 'pending' ? 'Bình luận đang được kiểm duyệt...' : 'Đã thêm bình luận',
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

// Lấy comments của 1 bài viết
export const getComments = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const { page = 1, limit = 20, sort = 'newest' } = req.query;

        // Chỉ lấy top-level comments (không phải replies)
        const query = {
            postId,
            parentCommentId: null,
            isActive: true
        };

        let sortOption = { createdAt: -1 }; // newest first
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'popular') {
            sortOption = { likeCount: -1, createdAt: -1 };
        }

        const comments = await Comment.find(query)
            .populate('userId', 'name avatar badge')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Check liked status cho mỗi comment
        const commentsWithLikeStatus = await Promise.all(
            comments.map(async (comment) => {
                const isLiked = await Like.isLikedBy(userId, 'comment', comment._id);
                return {
                    ...comment.toObject(),
                    isLiked
                };
            })
        );

        const total = await Comment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                comments: commentsWithLikeStatus,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy replies của 1 comment
export const getReplies = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { commentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = {
            parentCommentId: commentId,
            isActive: true
        };

        const replies = await Comment.find(query)
            .populate('userId', 'name avatar badge')
            .sort({ createdAt: 1 }) // oldest first for replies
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const repliesWithLikeStatus = await Promise.all(
            replies.map(async (reply) => {
                const isLiked = await Like.isLikedBy(userId, 'comment', reply._id);
                return {
                    ...reply.toObject(),
                    isLiked
                };
            })
        );

        const total = await Comment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                replies: repliesWithLikeStatus,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật comment
export const updateComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { commentId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung bình luận không được để trống'
            });
        }

        const comment = await Comment.findById(commentId);

        if (!comment || !comment.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }

        if (!comment.canEdit(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa bình luận này'
            });
        }

        comment.content = content.trim();
        comment.isEdited = true;
        await comment.save();

        await comment.populate('userId', 'name avatar badge');

        res.status(200).json({
            success: true,
            message: 'Đã cập nhật bình luận',
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

// Xóa comment
export const deleteComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment || !comment.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }

        // Chỉ chủ comment hoặc chủ bài viết mới được xóa
        const post = await Post.findById(comment.postId);
        const canDelete = comment.canEdit(userId) || post.userId.equals(userId);

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bình luận này'
            });
        }

        // Soft delete
        comment.isActive = false;
        await comment.save();

        // Giảm comment count của post
        if (post) {
            post.commentCount = Math.max(0, post.commentCount - 1);
            await post.save();
        }

        // Nếu là reply, giảm reply count của parent
        if (comment.parentCommentId) {
            const parentComment = await Comment.findById(comment.parentCommentId);
            if (parentComment) {
                parentComment.replyCount = Math.max(0, parentComment.replyCount - 1);
                await parentComment.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa bình luận'
        });
    } catch (error) {
        next(error);
    }
};

// ========== LIKE COMMENT ==========

// Toggle like comment
export const toggleLikeComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment || !comment.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bình luận'
            });
        }

        const result = await Like.toggleLike(userId, 'comment', commentId);

        // Update like count
        if (result.action === 'liked') {
            comment.likeCount += 1;
        } else {
            comment.likeCount = Math.max(0, comment.likeCount - 1);
        }
        await comment.save();

        res.status(200).json({
            success: true,
            message: result.action === 'liked' ? 'Đã thích bình luận' : 'Đã bỏ thích',
            data: {
                liked: result.liked,
                likeCount: comment.likeCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách người like comment
export const getCommentLikes = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const likes = await Like.find({
            targetType: 'comment',
            targetId: commentId
        })
            .populate('userId', 'name avatar badge')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Like.countDocuments({
            targetType: 'comment',
            targetId: commentId
        });

        res.status(200).json({
            success: true,
            data: {
                likes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== REPORT COMMENT ==========

// Báo cáo comment vi phạm
export const reportComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { commentId } = req.params;
        const { reason, description } = req.body;

        // Validate reason
        const validReasons = ['spam', 'harassment', 'hate_speech', 'violence', 'nsfw', 'misinformation', 'scam', 'copyright', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn lý do báo cáo hợp lệ'
            });
        }

        // Kiểm tra comment tồn tại
        const comment = await Comment.findOne({ _id: commentId, isActive: true });
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Bình luận không tồn tại'
            });
        }

        // Không thể tự báo cáo comment của mình
        if (comment.userId.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể báo cáo bình luận của chính mình'
            });
        }

        // Kiểm tra đã báo cáo chưa
        const existingReport = await Report.findOne({
            reporterId: userId,
            contentType: 'comment',
            contentId: commentId
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã báo cáo bình luận này rồi'
            });
        }

        // Tạo báo cáo
        const report = await Report.create({
            reporterId: userId,
            contentType: 'comment',
            contentId: commentId,
            reportedUserId: comment.userId,
            reason,
            description: description || ''
        });

        // Tăng priority nếu nhiều người báo cáo
        const reportCount = await Report.countDocuments({
            contentType: 'comment',
            contentId: commentId,
            status: { $in: ['pending', 'reviewing'] }
        });

        if (reportCount > 1) {
            const priority = Math.min(reportCount, 5);
            await Report.updateMany(
                { contentType: 'comment', contentId: commentId },
                { priority }
            );
        }

        // >= 3 reports -> auto reviewing
        if (reportCount >= 3) {
            await Report.updateMany(
                { contentType: 'comment', contentId: commentId, status: 'pending' },
                { status: 'reviewing' }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Đã gửi báo cáo. Cảm ơn bạn đã giúp duy trì cộng đồng lành mạnh!',
            data: {
                reportId: report._id,
                status: report.status
            }
        });
    } catch (error) {
        next(error);
    }
};
