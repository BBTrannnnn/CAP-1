// Trust Score Service
// Manages user reputation and trust scoring system

import User from '../models/User.js';
import ModerationLog from '../models/ModerationLog.js';

// Trust score thresholds
export const TRUST_LEVELS = {
    UNTRUSTED: 20,      // Below this = auto-ban risk
    LOW: 50,            // New users, strict moderation
    MEDIUM: 70,         // Regular users
    HIGH: 85            // Trusted users, relaxed moderation
};

/**
 * Get user's moderation policy based on trust score and account age
 * @param {Object} user - User document
 * @returns {Object} Moderation policy
 */
export function getUserModerationPolicy(user) {
    const trustScore = user.trustScore || 70;
    const accountAgeDays = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    
    // New accounts (< 7 days): Very strict
    if (accountAgeDays < 7) {
        return {
            level: 'new_user',
            needsReview: trustScore < 70,
            maxPostsPerDay: 5,
            maxCommentsPerDay: 20,
            canUploadImages: trustScore > 60,
            canUploadMultipleImages: false,
            autoApproveThreshold: 20, // Only auto-approve if profanity score < 20%
            description: 'Tài khoản mới - Kiểm duyệt nghiêm ngặt'
        };
    }
    
    // Low trust (20-50): Strict moderation
    if (trustScore < TRUST_LEVELS.LOW) {
        return {
            level: 'low_trust',
            needsReview: true,
            maxPostsPerDay: 3,
            maxCommentsPerDay: 10,
            canUploadImages: trustScore > 30,
            canUploadMultipleImages: false,
            autoApproveThreshold: 10,
            description: 'Tài khoản có lịch sử vi phạm - Chờ kiểm duyệt'
        };
    }
    
    // Medium trust (50-85): Normal moderation
    if (trustScore < TRUST_LEVELS.HIGH) {
        return {
            level: 'medium_trust',
            needsReview: false,
            maxPostsPerDay: 10,
            maxCommentsPerDay: 50,
            canUploadImages: true,
            canUploadMultipleImages: true,
            autoApproveThreshold: 60, // Auto-approve if score < 60%
            description: 'Thành viên thường - Kiểm duyệt tự động'
        };
    }
    
    // High trust (85-100): Relaxed moderation
    return {
        level: 'high_trust',
        needsReview: false,
        maxPostsPerDay: 20,
        maxCommentsPerDay: 100,
        canUploadImages: true,
        canUploadMultipleImages: true,
        autoApproveThreshold: 80, // Auto-approve if score < 80%
        description: 'Thành viên đáng tin cậy - Ưu tiên'
    };
}

/**
 * Update user trust score
 * @param {string} userId - User ID
 * @param {string} action - Action type
 * @param {Object} details - Additional details
 * @returns {Promise<Object>} Updated user
 */
export async function updateTrustScore(userId, action, details = {}) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    let scoreChange = 0;
    let violationIncrement = 0;

    switch (action) {
        case 'violation_severe':
            scoreChange = -15;
            violationIncrement = 1;
            break;
            
        case 'violation_moderate':
            scoreChange = -10;
            violationIncrement = 1;
            break;
            
        case 'violation_minor':
            scoreChange = -5;
            break;
            
        case 'reported':
            scoreChange = -8;
            user.reportCount += 1;
            break;
            
        case 'post_approved_with_likes':
            // Reward for quality content
            const likes = details.likeCount || 0;
            if (likes > 10) scoreChange = 3;
            else if (likes > 5) scoreChange = 2;
            else scoreChange = 1;
            break;
            
        case 'helpful_comment':
            scoreChange = 2;
            break;
            
        case 'appeal_approved':
            // Restore some points if AI was wrong
            scoreChange = 5;
            violationIncrement = -1; // Remove violation
            break;
            
        case 'no_violations_30_days':
            // Reward for good behavior
            scoreChange = 5;
            break;
            
        default:
            break;
    }

    // Apply changes
    user.trustScore = Math.max(0, Math.min(100, user.trustScore + scoreChange));
    user.violations = Math.max(0, user.violations + violationIncrement);

    // Add to moderation history
    if (scoreChange !== 0 || violationIncrement !== 0) {
        user.moderationHistory.push({
            type: action,
            content: details.content || '',
            score: details.score,
            action: details.moderationAction,
            timestamp: new Date()
        });

        // Keep only last 50 entries
        if (user.moderationHistory.length > 50) {
            user.moderationHistory = user.moderationHistory.slice(-50);
        }
    }

    // Auto-ban logic
    if (user.trustScore < TRUST_LEVELS.UNTRUSTED || user.violations >= 5) {
        if (!user.isBanned) {
            user.isBanned = true;
            user.bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            user.bannedReason = user.violations >= 5 
                ? 'Nhiều lần vi phạm nội quy cộng đồng'
                : 'Điểm uy tín quá thấp';
            
            console.log(`🚫 User ${userId} auto-banned: ${user.bannedReason}`);
        }
    }

    await user.save();

    return {
        userId: user._id,
        trustScore: user.trustScore,
        scoreChange,
        violations: user.violations,
        isBanned: user.isBanned,
        bannedUntil: user.bannedUntil
    };
}

/**
 * Check if user is banned
 * @param {Object} user - User document
 * @returns {Object} { banned: boolean, reason: string, until: Date }
 */
export function checkUserBanStatus(user) {
    if (!user.isBanned) {
        return { banned: false };
    }

    // Check if temporary ban expired
    if (user.bannedUntil && user.bannedUntil < new Date()) {
        // Unban user
        user.isBanned = false;
        user.bannedUntil = null;
        user.save();
        
        return { banned: false };
    }

    return {
        banned: true,
        reason: user.bannedReason || 'Vi phạm nội quy cộng đồng',
        until: user.bannedUntil,
        permanent: !user.bannedUntil
    };
}

/**
 * Get trust level badge/label
 * @param {number} trustScore - Trust score (0-100)
 * @returns {Object} Badge info
 */
export function getTrustBadge(trustScore) {
    if (trustScore >= 90) {
        return {
            label: 'Thành viên xuất sắc',
            icon: '🌟',
            color: '#FFD700'
        };
    }
    if (trustScore >= 80) {
        return {
            label: 'Thành viên đáng tin cậy',
            icon: '✅',
            color: '#4CAF50'
        };
    }
    if (trustScore >= 60) {
        return {
            label: 'Thành viên tốt',
            icon: '👍',
            color: '#2196F3'
        };
    }
    if (trustScore >= 40) {
        return {
            label: 'Thành viên mới',
            icon: '👤',
            color: '#9E9E9E'
        };
    }
    return {
        label: 'Cần thận trọng',
        icon: '⚠️',
        color: '#FF9800'
    };
}

/**
 * Calculate overall moderation decision
 * @param {Object} user - User document
 * @param {Object} moderationResults - Results from content checks
 * @returns {Object} { status: string, reason: string, autoApproved: boolean }
 */
export function calculateModerationDecision(user, moderationResults) {
    const policy = getUserModerationPolicy(user);
    const { textCheck, imageCheck, urlCheck, spamCheck } = moderationResults;

    // Instant block conditions
    if (textCheck?.blocked || imageCheck?.blocked || urlCheck?.blocked || spamCheck?.blocked) {
        return {
            status: 'rejected',
            reason: textCheck?.reason || imageCheck?.reason || urlCheck?.reason || spamCheck?.reason,
            autoApproved: false,
            action: 'auto_rejected'
        };
    }

    // Calculate combined risk score
    const textScore = textCheck?.score || 0;
    const imageScore = imageCheck?.needsReview ? 50 : 0;
    const combinedScore = Math.max(textScore, imageScore);

    // High trust users: More lenient (auto-approve unless severe issues)
    if (policy.level === 'high_trust') {
        // Only manual review if text profanity is high OR image definitely needs review
        if (textScore >= 70 || (imageCheck?.needsReview && !imageCheck?.autoCheckPassed)) {
            return {
                status: 'pending',
                reason: 'Nội dung cần được kiểm duyệt',
                autoApproved: false,
                action: 'pending_review',
                scores: { text: textScore, image: imageScore, combined: combinedScore }
            };
        }
        // High trust: Auto-approve most content
        return {
            status: 'approved',
            reason: 'Thành viên đáng tin cậy',
            autoApproved: true,
            action: 'auto_approved',
            scores: { text: textScore, image: imageScore, combined: combinedScore }
        };
    }

    // Medium trust users: Balanced approach
    if (policy.level === 'medium_trust') {
        // Auto-approve if clean text + (no images OR images passed auto-check)
        if (textScore < 40 && (!imageCheck?.needsReview || imageCheck?.autoCheckPassed)) {
            return {
                status: 'approved',
                reason: null,
                autoApproved: true,
                action: 'auto_approved',
                scores: { text: textScore, image: imageScore, combined: combinedScore }
            };
        }
    }

    // Low trust / New users: Strict moderation
    // Check if needs manual review
    if (combinedScore > policy.autoApproveThreshold || textCheck?.needsReview || imageCheck?.needsReview) {
        return {
            status: 'pending',
            reason: 'Nội dung cần được kiểm duyệt',
            autoApproved: false,
            action: 'pending_review',
            scores: {
                text: textScore,
                image: imageScore,
                combined: combinedScore
            }
        };
    }

    // Auto approve
    return {
        status: 'approved',
        reason: null,
        autoApproved: true,
        action: 'auto_approved',
        scores: {
            text: textScore,
            image: imageScore,
            combined: combinedScore
        }
    };
}

/**
 * Periodic cleanup: Reward users with no violations
 */
export async function rewardCleanUsers() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Find users with no recent violations
    const cleanUsers = await User.find({
        'moderationHistory.timestamp': { $lt: thirtyDaysAgo },
        trustScore: { $lt: 100 },
        isBanned: false
    });

    for (const user of cleanUsers) {
        await updateTrustScore(user._id, 'no_violations_30_days');
    }

    console.log(`✅ Rewarded ${cleanUsers.length} clean users with trust score bonus`);
}

export default {
    TRUST_LEVELS,
    getUserModerationPolicy,
    updateTrustScore,
    checkUserBanStatus,
    getTrustBadge,
    calculateModerationDecision,
    rewardCleanUsers
};
