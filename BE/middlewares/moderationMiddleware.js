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

export const postRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: async (req) => Math.ceil(getUserModerationPolicy(req.user).maxPostsPerDay / (24 * 60)),
    message: 'Bạn đang đăng bài quá nhanh. Vui lòng chờ một chút.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const commentRateLimit = rateLimit({
    windowMs: 5 * 1000,
    max: async (req) => Math.ceil(getUserModerationPolicy(req.user).maxCommentsPerDay / (24 * 60 * 10)),
    message: 'Bạn đang bình luận quá nhanh.',
    standardHeaders: true,
    legacyHeaders: false,
});

// ========== MODERATION MIDDLEWARE ==========

export const moderatePost = async (req, res, next) => {
    try {
        const user = req.user;
        const { content, images } = req.body;

        const banStatus = checkUserBanStatus(user);
        if (banStatus.banned) {
            return res.status(403).json({
                success: false,
                message: `Tài khoản của bạn đã bị khóa${banStatus.until ? ' đến ' + banStatus.until.toLocaleDateString('vi-VN') : ' vĩnh viễn'}`,
                details: { reason: banStatus.reason }
            });
        }

        const policy = getUserModerationPolicy(user);

        if (images && images.length > 0) {
            if (!policy.canUploadImages) {
                return res.status(403).json({ success: false, message: 'Chưa đủ uy tín đăng ảnh' });
            }
        }

        // === LAYER 1: INSTANT CHECKS ===

        // 1. Text Check (SỬ DỤNG AWAIT CHO API)
        const textCheck = await checkTextProfanity(content);
        
        if (textCheck.blocked) {
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
                detectedIssues: textCheck.matches,
                trustScoreChange: -15
            });

            return res.status(400).json({
                success: false,
                message: textCheck.reason,
                details: { type: 'profanity', matches: textCheck.matches }
            });
        }

        // 2. Check URLs
        const urlCheck = checkUrls(content);
        if (urlCheck.blocked) {
            return res.status(400).json({ success: false, message: urlCheck.reason });
        }

        // 3. Check Spam
        const spamCheck = checkDuplicateContent(user._id, content);
        if (spamCheck.blocked) {
            return res.status(429).json({ success: false, message: spamCheck.reason });
        }

        req.moderationResults = {
            textCheck,
            urlCheck,
            spamCheck,
            policy,
            needsImageCheck: images && images.length > 0
        };

        next();

    } catch (error) {
        console.error('Moderation middleware error:', error);
        next(error);
    }
};

export const moderateComment = async (req, res, next) => {
    try {
        const user = req.user;
        const { content } = req.body;

        const banStatus = checkUserBanStatus(user);
        if (banStatus.banned) {
            return res.status(403).json({ success: false, message: 'Tài khoản bị khóa' });
        }

        const policy = getUserModerationPolicy(user);

        // 1. Text Check (SỬ DỤNG AWAIT)
        const textCheck = await checkTextProfanity(content);

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
                trustScoreChange: -15
            });

            return res.status(400).json({ success: false, message: textCheck.reason });
        }

        const urlCheck = checkUrls(content);
        if (urlCheck.blocked) {
            return res.status(400).json({ success: false, message: urlCheck.reason });
        }

        const spamCheck = checkDuplicateContent(user._id, content);
        if (spamCheck.blocked) {
            return res.status(429).json({ success: false, message: spamCheck.reason });
        }

        req.moderationResults = { textCheck, urlCheck, spamCheck, policy };
        next();

    } catch (error) {
        console.error('Comment moderation error:', error);
        next(error);
    }
};

// Layer 2: Quét ảnh ngầm
export async function processModerationAsync(contentType, contentId, userId, images = []) {
    try {
        console.log(`🔍 [Layer 2] Processing ${contentType} ${contentId}...`);
        const user = await import('../src/models/User.js').then(m => m.default.findById(userId));
        if (!user) return;

        const moderationResults = {
            textCheck: { score: 0 }, 
            imageCheck: null,
            urlCheck: { blocked: false },
            spamCheck: { blocked: false }
        };

        // Check images (API Call)
        if (images && images.length > 0) {
            const imageUrls = images.map(img => img.url || img);
            moderationResults.imageCheck = await checkImagesNSFW(imageUrls);

            if (moderationResults.imageCheck.blocked) {
                // Reject logic
                const Model = contentType === 'post' ? Post : Comment;
                await Model.findByIdAndUpdate(contentId, {
                    moderationStatus: 'rejected',
                    moderationReason: moderationResults.imageCheck.reason,
                    isActive: false
                });

                await updateTrustScore(userId, 'violation_severe', { content: 'Image violation', score: 100 });
                await ModerationLog.create({
                    userId, contentType, contentId,
                    action: 'auto_rejected',
                    reason: moderationResults.imageCheck.reason,
                    trustScoreChange: -15
                });
                console.log(`🚫 ${contentType} rejected due to image violation.`);
                return;
            }
        }

        // Approve Logic
        const decision = calculateModerationDecision(user, moderationResults);
        const Model = contentType === 'post' ? Post : Comment;
        
        await Model.findByIdAndUpdate(contentId, {
            moderationStatus: decision.status,
            moderationReason: decision.reason,
            autoApproved: decision.autoApproved
        });

        await ModerationLog.create({
            userId, contentType, contentId,
            action: decision.action,
            reason: decision.reason || 'Approved'
        });

        if (decision.status === 'approved') {
            clearSpamCache(userId);
        }

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