import express from 'express';
import authenticateToken from '../../middlewares/auth.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
    getFriends,
    getPendingRequests,
    checkFriendStatus,
    blockUser,
    unblockUser,
    getBlockedUsers
} from '../controllers/Social_controller.js';

const router = express.Router();

// ========== FRIEND ROUTES ==========

// Gửi lời mời kết bạn
router.post('/friends/request', authenticateToken, sendFriendRequest);

// Chấp nhận lời mời kết bạn
router.post('/friends/accept', authenticateToken, acceptFriendRequest);

// Từ chối lời mời kết bạn
router.post('/friends/reject', authenticateToken, rejectFriendRequest);

// Hủy kết bạn
router.delete('/friends/unfriend', authenticateToken, unfriend);

// Lấy danh sách bạn bè của mình
router.get('/friends', authenticateToken, getFriends);

// Lấy danh sách bạn bè của user khác
router.get('/friends/:userId', authenticateToken, getFriends);

// Lấy danh sách lời mời đang chờ (received/sent)
router.get('/friends-requests', authenticateToken, getPendingRequests);

// Kiểm tra trạng thái bạn bè với một user cụ thể
router.get('/friends/status/:targetUserId', authenticateToken, checkFriendStatus);

// ========== BLOCK ROUTES ==========

// Chặn người dùng
router.post('/block', authenticateToken, blockUser);

// Bỏ chặn người dùng
router.delete('/unblock', authenticateToken, unblockUser);

// Lấy danh sách người đã chặn
router.get('/blocked', authenticateToken, getBlockedUsers);

export default router;
