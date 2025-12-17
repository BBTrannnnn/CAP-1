// Moderation Controller
// Handles moderator/admin actions for content review

import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import ModerationLog from '../models/ModerationLog.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
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

        let content;
        let logs;
        let userViolations = [];

        if (contentType === 'user') {
            // For ban appeal reviews
            const user = await User.findById(contentId)
                .select('name email avatar trustScore violations isBanned bannedReason bannedUntil moderationHistory')
                .lean();

            if (!user) {
                return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
            }

            // Structure like post/comment for consistent FE handling, or handle differing structure in FE
            // FE expects content.userId object usually. For user, content IS the user.
            // Let's adjust structure:
            content = {
                ...user,
                userId: user // Self-referencing so FE accessing content.userId works
            };

            // Logs for this user (warnings, bans, etc.)
            logs = await ModerationLog.find({
                userId: contentId,
                action: { $in: ['warned', 'banned', 'ban_appeal_submitted', 'appeal_submitted'] }
            })
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

        } else {
            const Model = contentType === 'post' ? Post : Comment;
            content = await Model.findById(contentId)
                .populate('userId', 'name email avatar trustScore violations moderationHistory')
                .lean();

            if (!content) {
                return res.status(404).json({
                    success: false,
                    message: 'Nội dung không tồn tại'
                });
            }

            // Get moderation logs for this content
            logs = await ModerationLog.find({
                contentType,
                contentId
            })
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            // Get user's recent violations
            userViolations = await ModerationLog.find({
                userId: content.userId._id,
                action: { $in: ['auto_rejected', 'moderator_rejected'] }
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();
        }

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
            // Check content type for ban appeals
            if (appeal.contentType === 'user') {
                continue;
            }

            const Model = appeal.contentType === 'post' ? Post : Comment;
            if (Model) {
                try {
                    appeal.content = await Model.findById(appeal.contentId)
                        .select('content images moderationReason moderationScore')
                        .lean();
                } catch (err) {
                    console.error('Error fetching appeal content:', err);
                }
            }
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

// ========== REPORTS LISTING ==========

// Get all reports (posts + comments)
export const getReports = async (req, res, next) => {
    try {
        const {
            type,           // 'post' | 'comment' | 'user'
            status,         // 'pending' | 'reviewing' | 'resolved' | 'dismissed'
            priority,       // 1-5
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = {};
        if (type) {
            query.contentType = type;
        }
        if (status) {
            query.status = status;
        }
        if (priority) {
            query.priority = parseInt(priority);
        }

        // Get reports with populated data
        const reports = await Report.find(query)
            .populate('reporterId', 'name avatar email')
            .populate('reportedUserId', 'name avatar email trustScore violations')
            .populate('reviewerId', 'name email')
            .sort({ priority: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        // Populate content based on type
        for (let report of reports) {
            if (report.contentType === 'post') {
                const post = await Post.findById(report.contentId)
                    .select('content images createdAt moderationStatus')
                    .lean();
                report.content = post;
            } else if (report.contentType === 'comment') {
                const comment = await Comment.findById(report.contentId)
                    .select('content postId createdAt moderationStatus')
                    .populate('postId', 'content')
                    .lean();
                report.content = comment;
            }
        }

        const total = await Report.countDocuments(query);

        // Get statistics
        const stats = await Report.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                reports,
                stats: stats.reduce((acc, s) => {
                    acc[s._id] = s.count;
                    return acc;
                }, {}),
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

// ========== WARNING SYSTEM ==========

// Warn a user
export const warnUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { reason, message } = req.body;
        const moderatorId = req.user._id;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do cảnh cáo'
            });
        }

        // Kiểm tra user tồn tại
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Không thể cảnh cáo admin/moderator
        if (user.role === 'admin' || user.role === 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'Không thể cảnh cáo admin/moderator'
            });
        }

        // Tạo moderation log
        const moderationLog = await ModerationLog.create({
            userId: userId,
            moderatorId: moderatorId,
            action: 'warned',
            reason: reason,
            details: message || '',
            contentType: 'user',
            contentId: userId
        });

        // Tăng số lần vi phạm
        if (!user.violations) {
            user.violations = 0;
        }
        user.violations += 1;

        // Thêm vào lịch sử kiểm duyệt
        if (!user.moderationHistory) {
            user.moderationHistory = [];
        }
        user.moderationHistory.push({
            action: 'warned',
            reason: reason,
            moderatorId: moderatorId,
            timestamp: new Date()
        });

        // Giảm trust score
        if (user.trustScore) {
            user.trustScore = Math.max(0, user.trustScore - 10);
        }

        // ========== AUTO-BAN LOGIC ==========
        // Tự động ban nếu vi phạm >= 5 lần
        let autoBanned = false;
        let banDuration = null;
        let banDurationText = '';

        if (user.violations >= 5) {
            autoBanned = true;
            const banCount = user.violations - 4; // Số lần bị ban (lần 1, 2, 3...)

            // Tính thời gian ban dựa trên số lần
            if (banCount === 1) {
                banDuration = 24 * 60 * 60 * 1000; // 24 hours
                banDurationText = '24 giờ';
            } else if (banCount === 2) {
                banDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
                banDurationText = '7 ngày';
            } else if (banCount === 3) {
                banDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
                banDurationText = '30 ngày';
            } else {
                // Lần 4+ = permanent ban
                banDuration = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years
                banDurationText = 'vĩnh viễn';
            }

            user.isBanned = true;
            user.bannedUntil = new Date(Date.now() + banDuration);
            user.bannedReason = `Tự động cấm do vi phạm ${user.violations} lần`;

            // Tạo ban log
            await ModerationLog.create({
                userId: userId,
                moderatorId: moderatorId,
                action: 'banned',
                reason: `Auto-ban: ${user.violations} vi phạm`,
                details: `Tự động ban ${banDurationText} sau khi đạt ${user.violations} lần vi phạm`,
                contentType: 'user',
                contentId: userId
            });
        }

        await user.save();

        // TODO: Send notification to user about warning

        res.status(201).json({
            success: true,
            message: autoBanned
                ? `Đã gửi cảnh cáo. User tự động bị cấm ${banDurationText} do vi phạm ${user.violations} lần`
                : 'Đã gửi cảnh cáo tới người dùng',
            data: {
                userId: user._id,
                violations: user.violations,
                trustScore: user.trustScore,
                autoBanned,
                bannedUntil: autoBanned ? user.bannedUntil : null,
                banDuration: banDurationText,
                warning: {
                    reason,
                    message,
                    timestamp: moderationLog.createdAt
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== REPORT ACTIONS ==========

// Dismiss a report (mark as invalid/false report)
export const dismissReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const { reviewNote } = req.body;
        const moderatorId = req.user._id;

        if (!reviewNote || reviewNote.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do bỏ qua báo cáo'
            });
        }

        // Kiểm tra report tồn tại
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        // Không thể dismiss report đã resolved
        if (report.status === 'resolved' || report.status === 'dismissed') {
            return res.status(400).json({
                success: false,
                message: `Báo cáo đã được xử lý (${report.status})`
            });
        }

        // Update report
        report.status = 'dismissed';
        report.action = 'dismissed';
        report.reviewerId = moderatorId;
        report.reviewNote = reviewNote;
        report.reviewedAt = new Date();
        await report.save();

        // Tạo moderation log
        await ModerationLog.create({
            userId: report.reportedUserId,
            moderatorId: moderatorId,
            action: 'report_dismissed',
            reason: 'Báo cáo không hợp lệ',
            details: reviewNote,
            contentType: report.contentType,
            contentId: report.contentId
        });

        // Optional: Giảm trust score của người báo cáo sai (nếu muốn chống spam reports)
        // const reporter = await User.findById(report.reporterId);
        // if (reporter && reporter.trustScore) {
        //     reporter.trustScore = Math.max(0, reporter.trustScore - 5);
        //     await reporter.save();
        // }

        res.status(200).json({
            success: true,
            message: 'Đã bỏ qua báo cáo không hợp lệ',
            data: {
                reportId: report._id,
                status: report.status,
                reviewedBy: moderatorId,
                reviewedAt: report.reviewedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get trust score for a user (Moderator only)
export const getTrustScore = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Kiểm tra user tồn tại
        const user = await User.findById(userId)
            .select('name email avatar trustScore violations createdAt moderationHistory')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Tính các factors ảnh hưởng trust score
        const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        // Đếm số bài viết được duyệt
        const postsApproved = await Post.countDocuments({
            userId: userId,
            moderationStatus: 'approved',
            isActive: true
        });

        // Đếm số comments được duyệt
        const commentsApproved = await Comment.countDocuments({
            userId: userId,
            moderationStatus: 'approved',
            isActive: true
        });

        // Đếm số báo cáo nhận được
        const reportsReceived = await Report.countDocuments({
            reportedUserId: userId,
            status: { $in: ['pending', 'reviewing', 'resolved'] }
        });

        // Đếm số báo cáo bị dismissed (báo cáo đúng)
        const reportsDismissed = await Report.countDocuments({
            reportedUserId: userId,
            status: 'dismissed'
        });

        // Tính toán factors
        const factors = {
            accountAge: accountAgeDays > 30 ? 10 : Math.floor(accountAgeDays / 3), // Max +10
            postsApproved: Math.min(postsApproved * 2, 20), // 2 points per post, max +20
            commentsApproved: Math.min(commentsApproved, 10), // 1 point per comment, max +10
            violations: -(user.violations || 0) * 10, // -10 per violation
            reportsReceived: -Math.min(reportsReceived * 5, 25), // -5 per report, max -25
            reportsDismissed: reportsDismissed * 3 // +3 per dismissed report (good behavior)
        };

        // Tính base score (nếu chưa có)
        const calculatedScore = Object.values(factors).reduce((sum, val) => sum + val, 50); // Start from 50
        const finalScore = user.trustScore !== undefined ? user.trustScore : Math.max(0, Math.min(100, calculatedScore));

        // Xác định level
        let level = 'Untrusted';
        if (finalScore >= 80) level = 'Highly Trusted';
        else if (finalScore >= 60) level = 'Trusted';
        else if (finalScore >= 40) level = 'Normal';
        else if (finalScore >= 20) level = 'Low Trust';

        // Lấy lịch sử từ moderation history
        const history = (user.moderationHistory || [])
            .slice(-10) // Lấy 10 records gần nhất
            .map(h => ({
                date: h.timestamp,
                action: h.action,
                reason: h.reason,
                scoreChange: h.action === 'warned' ? -10 : 0
            }));

        res.status(200).json({
            success: true,
            data: {
                userId: user._id,
                name: user.name,
                avatar: user.avatar,
                trustScore: finalScore,
                level,
                factors,
                stats: {
                    accountAgeDays,
                    postsApproved,
                    commentsApproved,
                    violations: user.violations || 0,
                    reportsReceived,
                    reportsDismissed
                },
                history
            }
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
    unbanUser,
    getReports,
    warnUser,
    dismissReport,
    getTrustScore
};
