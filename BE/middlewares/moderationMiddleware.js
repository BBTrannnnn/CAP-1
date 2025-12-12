// Moderation Middleware
// Handles content moderation for posts and comments

import rateLimit from 'express-rate-limit';
import {
    checkTextProfanity,
    checkUrls,
    checkDuplicateContent,
    checkImagesNSFW,
    clearSpamCache
} from '../src/services/contentModerator.js';
import {
    getUserModerationPolicy,
    checkUserBanStatus,
    calculateModerationDecision,
    updateTrustScore
} from '../src/services/trustScoreService.js';
import ModerationLog from '../src/models/ModerationLog.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';

// ========== RATE LIMITING ==========

// Post rate limiter
export const postRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: async (req) => {
        const policy = getUserModerationPolicy(req.user);
        return Math.ceil(policy.maxPostsPerDay / (24 * 60)); // Per minute limit
    },
    message: 'Bạn đang đăng bài quá nhanh. Vui lòng chờ một chút.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Comment rate limiter
export const commentRateLimit = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: async (req) => {
        const policy = getUserModerationPolicy(req.user);
        return Math.ceil(policy.maxCommentsPerDay / (24 * 60 * 2)); // Per 30s limit
    },
    message: 'Bạn đang bình luận quá nhanh. Vui lòng chờ một chút.',
    standardHeaders: true,
    legacyHeaders: false,
});

// ========== MODERATION MIDDLEWARE ==========

/**
 * Moderate post content
 * Layer 1: Instant checks (synchronous)
 * Layer 2: AI checks (asynchronous background job)
 */
export const moderatePost = async (req, res, next) => {
    try {
        const user = req.user;
        const { content, images, visibility } = req.body;

        // Check if user is banned
        const banStatus = checkUserBanStatus(user);
        if (banStatus.banned) {
            return res.status(403).json({
                success: false,
                message: `Tài khoản của bạn đã bị khóa${banStatus.until ? ' đến ' + banStatus.until.toLocaleDateString('vi-VN') : ' vĩnh viễn'}`,
                details: {
                    reason: banStatus.reason,
                    until: banStatus.until,
                    appeal: 'Bạn có thể gửi kháng cáo nếu cho rằng đây là sai lầm'
                }
            });
        }

        // Get user's moderation policy
        const policy = getUserModerationPolicy(user);

        // Check if user can upload images
        if (images && images.length > 0) {
            if (!policy.canUploadImages) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản của bạn chưa được phép đăng hình ảnh',
                    details: {
                        reason: 'Cần tăng điểm uy tín',
                        currentTrustScore: user.trustScore,
                        requiredTrustScore: 60
                    }
                });
            }

            if (images.length > 1 && !policy.canUploadMultipleImages) {
                return res.status(403).json({
                    success: false,
                    message: 'Tài khoản mới chỉ được đăng 1 hình ảnh mỗi bài',
                    details: {
                        maxImages: 1,
                        currentImages: images.length
                    }
                });
            }
        }

        // === LAYER 1: INSTANT CHECKS (Synchronous) ===

        // Check text profanity
        const textCheck = checkTextProfanity(content);
        if (textCheck.blocked) {
            // Log violation
            await updateTrustScore(user._id, 'violation_severe', {
                content: content.substring(0, 100),
                score: textCheck.score,
                moderationAction: 'auto_rejected'
            });

            await ModerationLog.create({
                userId: user._id,
                contentType: 'post',
                action: 'auto_rejected',
                reason: textCheck.reason,
                scores: { profanity: textCheck.score },
                detectedIssues: textCheck.matches.map(m => ({
                    type: 'profanity',
                    severity: m.type === 'severe' ? 'severe' : 'medium',
                    details: `Detected: "${m.word}"`
                })),
                trustScoreChange: -15
            });

            return res.status(400).json({
                success: false,
                message: textCheck.reason,
                details: {
                    type: 'profanity',
                    score: textCheck.score,
                    trustScoreDeducted: 15,
                    action: 'Vui lòng chỉnh sửa nội dung và thử lại'
                }
            });
        }

        // Check URLs
        const urlCheck = checkUrls(content);
        if (urlCheck.blocked) {
            return res.status(400).json({
                success: false,
                message: urlCheck.reason,
                details: {
                    type: 'url',
                    urls: urlCheck.urls
                }
            });
        }

        // Check spam/duplicate
        const spamCheck = checkDuplicateContent(user._id, content);
        if (spamCheck.blocked) {
            await updateTrustScore(user._id, 'violation_minor', {
                content: content.substring(0, 100),
                moderationAction: 'spam_rejected'
            });

            return res.status(429).json({
                success: false,
                message: spamCheck.reason,
                details: {
                    type: 'spam',
                    similarity: spamCheck.similarity,
                    action: 'Vui lòng đăng nội dung khác biệt'
                }
            });
        }

        // === PASS LAYER 1 - Prepare for Layer 2 ===

        // Store moderation results for async processing
        req.moderationResults = {
            textCheck,
            urlCheck,
            spamCheck,
            policy,
            needsImageCheck: images && images.length > 0
        };

        // Allow request to proceed
        next();

    } catch (error) {
        console.error('Moderation middleware error:', error);
        next(error);
    }
};

/**
 * Moderate comment content
 * Similar to post but simplified (no images)
 */
export const moderateComment = async (req, res, next) => {
    try {
        const user = req.user;
        const { content } = req.body;

        // Check ban status
        const banStatus = checkUserBanStatus(user);
        if (banStatus.banned) {
            return res.status(403).json({
                success: false,
                message: `Tài khoản của bạn đã bị khóa${banStatus.until ? ' đến ' + banStatus.until.toLocaleDateString('vi-VN') : ''}`,
                details: {
                    reason: banStatus.reason
                }
            });
        }

        const policy = getUserModerationPolicy(user);

        // Check text profanity
        const textCheck = checkTextProfanity(content);
        if (textCheck.blocked) {
            await updateTrustScore(user._id, 'violation_severe', {
                content: content.substring(0, 100),
                score: textCheck.score
            });

            await ModerationLog.create({
                userId: user._id,
                contentType: 'comment',
                action: 'auto_rejected',
                reason: textCheck.reason,
                scores: { profanity: textCheck.score },
                trustScoreChange: -15
            });

            return res.status(400).json({
                success: false,
                message: textCheck.reason,
                details: {
                    type: 'profanity',
                    trustScoreDeducted: 15
                }
            });
        }

        // Check URLs
        const urlCheck = checkUrls(content);
        if (urlCheck.blocked) {
            return res.status(400).json({
                success: false,
                message: urlCheck.reason
            });
        }

        // Check spam
        const spamCheck = checkDuplicateContent(user._id, content);
        if (spamCheck.blocked) {
            return res.status(429).json({
                success: false,
                message: spamCheck.reason
            });
        }

        req.moderationResults = {
            textCheck,
            urlCheck,
            spamCheck,
            policy
        };

        next();

    } catch (error) {
        console.error('Comment moderation error:', error);
        next(error);
    }
};

/**
 * Process moderation after content is saved
 * This runs asynchronously - Layer 2 AI checks
 */
export async function processModerationAsync(contentType, contentId, userId, images = []) {
    try {
        const user = await import('../src/models/User.js').then(m => m.default.findById(userId));
        if (!user) return;

        const policy = getUserModerationPolicy(user);
        const moderationResults = {
            textCheck: { score: 0 }, // Already checked in Layer 1
            imageCheck: null,
            urlCheck: { blocked: false },
            spamCheck: { blocked: false }
        };

        // Check images with NSFW.js (this takes 1-3 seconds)
        if (images && images.length > 0) {
            const imageUrls = images.map(img => img.url || img);
            moderationResults.imageCheck = await checkImagesNSFW(imageUrls);

            if (moderationResults.imageCheck.blocked) {
                // Image failed - reject content
                const Model = contentType === 'post' ? Post : Comment;
                await Model.findByIdAndUpdate(contentId, {
                    moderationStatus: 'rejected',
                    moderationReason: moderationResults.imageCheck.reason,
                    'moderationScore.nsfw': moderationResults.imageCheck.results[0]?.scores?.porn || 0
                });

                await updateTrustScore(userId, 'violation_severe', {
                    content: 'Image violation',
                    score: 100
                });

                await ModerationLog.create({
                    userId,
                    contentType,
                    contentId,
                    action: 'auto_rejected',
                    reason: moderationResults.imageCheck.reason,
                    scores: {
                        nsfw: moderationResults.imageCheck.results[0]?.scores?.porn || 0
                    },
                    detectedIssues: [{
                        type: 'nsfw',
                        severity: 'high',
                        details: moderationResults.imageCheck.reason
                    }],
                    trustScoreChange: -15
                });

                console.log(`🚫 ${contentType} ${contentId} rejected: NSFW image detected`);
                return;
            }
        }

        // Calculate moderation decision
        const decision = calculateModerationDecision(user, moderationResults);

        // Update content status
        const Model = contentType === 'post' ? Post : Comment;
        await Model.findByIdAndUpdate(contentId, {
            moderationStatus: decision.status,
            moderationReason: decision.reason,
            autoApproved: decision.autoApproved,
            'moderationScore.profanity': decision.scores?.text || 0,
            'moderationScore.nsfw': moderationResults.imageCheck?.results?.[0]?.scores?.porn || 0
        });

        // Log decision
        await ModerationLog.create({
            userId,
            contentType,
            contentId,
            action: decision.action,
            reason: decision.reason || 'Content approved',
            scores: {
                profanity: decision.scores?.text || 0,
                nsfw: moderationResults.imageCheck?.results?.[0]?.scores?.porn || 0
            }
        });

        // Clear spam cache if approved
        if (decision.status === 'approved') {
            clearSpamCache(userId);
        }

        console.log(`✅ ${contentType} ${contentId} moderation: ${decision.status} (auto: ${decision.autoApproved})`);

    } catch (error) {
        console.error('Async moderation error:', error);
    }
}

export default {
    postRateLimit,
    commentRateLimit,
    moderatePost,
    moderateComment,
    processModerationAsync
};
