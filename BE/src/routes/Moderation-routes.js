import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import { requireModerator } from '../../middlewares/requireModerator.js';
import {
    getPendingPosts,
    getPendingComments,
    getContentForReview,
    approveContent,
    rejectContent,
    submitAppeal,
    getAppeals,
    banUser,
    unbanUser
} from '../controllers/Moderation_controller.js';
import {
    getModerationStats,
    getModerationOverview
} from '../controllers/Admin_controller.js';

const router = express.Router();

// ========== REVIEW QUEUE (Moderator/Admin only) ==========

// Get pending posts
router.get('/pending/posts', authenticateToken, requireModerator, getPendingPosts);

// Get pending comments
router.get('/pending/comments', authenticateToken, requireModerator, getPendingComments);

// Get content details for review
router.get('/review/:contentType/:contentId', authenticateToken, requireModerator, getContentForReview);

// ========== MODERATION ACTIONS (Moderator/Admin only) ==========

// Approve content
router.post('/approve/:contentType/:contentId', authenticateToken, requireModerator, approveContent);

// Reject content
router.post('/reject/:contentType/:contentId', authenticateToken, requireModerator, rejectContent);

// ========== APPEALS ==========

// Submit appeal (User)
router.post('/appeal/:contentType/:contentId', authenticateToken, submitAppeal);

// Get appeals queue (Moderator/Admin only)
router.get('/appeals', authenticateToken, requireModerator, getAppeals);

// ========== USER MANAGEMENT (Moderator/Admin) ==========

// Ban user (Moderator/Admin)
router.post('/ban/:userId', authenticateToken, requireModerator, banUser);

// Unban user (Moderator/Admin)
router.post('/unban/:userId', authenticateToken, requireModerator, unbanUser);

// ========== STATISTICS (Moderator/Admin) ==========

// Get moderation statistics (Moderator/Admin)
router.get('/stats', authenticateToken, requireModerator, getModerationStats);

// Get moderation overview chart (Moderator/Admin)
router.get('/overview', authenticateToken, requireModerator, getModerationOverview);

export default router;
