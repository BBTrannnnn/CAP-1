// Moderation Controller
// Handles moderator/admin actions for content review

import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import ModerationLog from '../models/ModerationLog.js';
import User from '../models/User.js';
import { updateTrustScore } from '../services/trustScoreService.js';

// ========== REVIEW QUEUE ==========

// Get pending posts (waiting for moderation)
export const getPendingPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

        const posts = await Post.find({
            moderationStatus: 'pending',
            isActive: true
        })
            .populate('userId', 'name email avatar trustScore violations')
            .sort({ [sortBy]: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await Post.countDocuments({
            moderationStatus: 'pending',
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get pending comments
export const getPendingComments = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const comments = await Comment.find({
            moderationStatus: 'pending',
            isActive: true
        })
            .populate('userId', 'name email avatar trustScore violations')
            .populate('postId', 'content')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await Comment.countDocuments({
            moderationStatus: 'pending',
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: {
                comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get content details for review
export const getContentForReview = async (req, res, next) => {
    try {
        const { contentType, contentId } = req.params;

        const Model = contentType === 'post' ? Post : Comment;
        const content = await Model.findById(contentId)
            .populate('userId', 'name email avatar trustScore violations moderationHistory')
            .lean();

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Nội dung không tồn tại'
            });
        }

        // Get moderation logs for this content
        const logs = await ModerationLog.find({
            contentType,
            contentId
        })
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get user's recent violations
        const userViolations = await ModerationLog.find({
            userId: content.userId._id,
            action: { $in: ['auto_rejected', 'moderator_rejected'] }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.status(200).json({
            success: true,
            data: {
                content,
                logs,
                userViolations
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== MODERATION ACTIONS ==========

// Approve content
export const approveContent = async (req, res, next) => {
    try {
        const { contentType, contentId } = req.params;
        const { notes } = req.body || {}; // Optional body
        const moderatorId = req.user._id;

        const Model = contentType === 'post' ? Post : Comment;
        const content = await Model.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Nội dung không tồn tại'
            });
        }

        if (content.moderationStatus === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đã được duyệt trước đó'
            });
        }

        // Update content
        content.moderationStatus = 'approved';
        content.moderationReason = null;
        content.reviewedBy = moderatorId;
        content.reviewedAt = new Date();
        content.autoApproved = false;
        await content.save();

        // Log action
        await ModerationLog.create({
            userId: content.userId,
            contentType,
            contentId,
            action: 'moderator_approved',
            reason: notes || 'Approved by moderator',
            reviewedBy: moderatorId,
            reviewedAt: new Date(),
            reviewNotes: notes
        });

        // Reward user if it was a false positive
        if (content.moderationScore?.profanity > 0) {
            await updateTrustScore(content.userId, 'appeal_approved', {
                content: 'False positive corrected'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã duyệt nội dung',
            data: content
        });
    } catch (error) {
        next(error);
    }
};

// Reject content
export const rejectContent = async (req, res, next) => {
    try {
        const { contentType, contentId } = req.params;
        const { reason, notes } = req.body;
        const moderatorId = req.user._id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do từ chối'
            });
        }

        const Model = contentType === 'post' ? Post : Comment;
        const content = await Model.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Nội dung không tồn tại'
            });
        }

        // Update content
        content.moderationStatus = 'rejected';
        content.moderationReason = reason;
        content.reviewedBy = moderatorId;
        content.reviewedAt = new Date();
        content.isActive = false; // Hide from feed
        await content.save();

        // Penalize user
        await updateTrustScore(content.userId, 'violation_moderate', {
            content: content.content.substring(0, 100),
            moderationAction: 'moderator_rejected'
        });

        // Log action
        await ModerationLog.create({
            userId: content.userId,
            contentType,
            contentId,
            action: 'moderator_rejected',
            reason,
            reviewedBy: moderatorId,
            reviewedAt: new Date(),
            reviewNotes: notes,
            trustScoreChange: -10
        });

        res.status(200).json({
            success: true,
            message: 'Đã từ chối nội dung',
            data: content
        });
    } catch (error) {
        next(error);
    }
};

// ========== APPEALS ==========

// Submit appeal
export const submitAppeal = async (req, res, next) => {
    try {
        const { contentType, contentId } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do kháng cáo (tối thiểu 10 ký tự)'
            });
        }

        const Model = contentType === 'post' ? Post : Comment;
        const content = await Model.findById(contentId);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Nội dung không tồn tại'
            });
        }

        if (content.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền kháng cáo nội dung này'
            });
        }

        if (content.moderationStatus !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể kháng cáo nội dung đã bị từ chối'
            });
        }

        // Check if already appealed
        const existingAppeal = await ModerationLog.findOne({
            contentType,
            contentId,
            action: 'appeal_submitted'
        });

        if (existingAppeal) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã gửi kháng cáo cho nội dung này rồi'
            });
        }

        // Create appeal log
        await ModerationLog.create({
            userId,
            contentType,
            contentId,
            action: 'appeal_submitted',
            reason: 'User appeal',
            appealReason: reason,
            appealedAt: new Date()
        });

        // Update content to pending for re-review
        content.moderationStatus = 'pending';
        await content.save();

        res.status(200).json({
            success: true,
            message: 'Đã gửi kháng cáo. Moderator sẽ xem xét lại.',
            data: {
                contentId,
                status: 'pending_appeal'
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get appeals queue
export const getAppeals = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const appeals = await ModerationLog.find({
            action: 'appeal_submitted'
        })
            .populate('userId', 'name email avatar trustScore')
            .populate('reviewedBy', 'name email')
            .sort({ appealedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get content details for each appeal
        for (const appeal of appeals) {
            const Model = appeal.contentType === 'post' ? Post : Comment;
            appeal.content = await Model.findById(appeal.contentId)
                .select('content images moderationReason moderationScore')
                .lean();
        }

        const count = await ModerationLog.countDocuments({
            action: 'appeal_submitted'
        });

        res.status(200).json({
            success: true,
            data: {
                appeals,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== USER MANAGEMENT ==========

// Ban user
export const banUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { reason, duration } = req.body; // duration in days, 0 = permanent

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do cấm'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        user.isBanned = true;
        user.bannedReason = reason;
        user.bannedUntil = duration > 0 
            ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
            : null; // null = permanent
        await user.save();

        res.status(200).json({
            success: true,
            message: `Đã cấm người dùng${duration > 0 ? ' trong ' + duration + ' ngày' : ' vĩnh viễn'}`,
            data: {
                userId: user._id,
                bannedUntil: user.bannedUntil
            }
        });
    } catch (error) {
        next(error);
    }
};

// Unban user
export const unbanUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        user.isBanned = false;
        user.bannedUntil = null;
        user.bannedReason = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đã gỡ cấm người dùng',
            data: { userId: user._id }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getPendingPosts,
    getPendingComments,
    getContentForReview,
    approveContent,
    rejectContent,
    submitAppeal,
    getAppeals,
    banUser,
    unbanUser
};
