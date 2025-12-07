import Friend from '../models/Friend.js';
import BlockedUser from '../models/BlockedUser.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// ========== FRIEND REQUESTS ==========

// Gửi lời mời kết bạn
export const sendFriendRequest = async (req, res, next) => {
    try {
        const userId = req.user.id; // từ auth middleware
        const { friendId } = req.body;

        // Validate friendId
        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        // Kiểm tra người dùng có tồn tại không
        const friendUser = await User.findById(friendId);
        if (!friendUser) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Không thể kết bạn với chính mình
        if (userId === friendId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể kết bạn với chính mình'
            });
        }

        // Kiểm tra có bị block không
        const isBlocked = await BlockedUser.findOne({
            $or: [
                { userId: userId, blockedUserId: friendId },
                { userId: friendId, blockedUserId: userId }
            ]
        });

        if (isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Không thể gửi lời mời kết bạn'
            });
        }

        // Kiểm tra đã có friendship chưa (cả 2 chiều)
        const existingFriend = await Friend.findOne({
            $or: [
                { userId: userId, friendId: friendId },
                { userId: friendId, friendId: userId }
            ]
        });

        if (existingFriend) {
            if (existingFriend.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'Các bạn đã là bạn bè rồi'
                });
            } else if (existingFriend.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Đã có lời mời kết bạn đang chờ xử lý'
                });
            }
        }

        // Tạo friend request (2 records để query dễ hơn)
        const friendRequest1 = await Friend.create({
            userId: userId,
            friendId: friendId,
            status: 'pending',
            requestedBy: userId
        });

        const friendRequest2 = await Friend.create({
            userId: friendId,
            friendId: userId,
            status: 'pending',
            requestedBy: userId
        });

        res.status(201).json({
            success: true,
            message: 'Đã gửi lời mời kết bạn',
            data: friendRequest1
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Lời mời kết bạn đã tồn tại'
            });
        }
        next(error);
    }
};

// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;

        // Tìm friend request (người kia gửi cho mình)
        const friendRequest = await Friend.findOne({
            userId: userId,
            friendId: friendId,
            status: 'pending',
            requestedBy: friendId // người kia là người gửi
        });

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lời mời kết bạn'
            });
        }

        // Update cả 2 records
        await Friend.updateMany(
            {
                $or: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId }
                ]
            },
            { status: 'accepted' }
        );

        res.status(200).json({
            success: true,
            message: 'Đã chấp nhận lời mời kết bạn'
        });
    } catch (error) {
        next(error);
    }
};

// Từ chối lời mời kết bạn
export const rejectFriendRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;

        const friendRequest = await Friend.findOne({
            userId: userId,
            friendId: friendId,
            status: 'pending',
            requestedBy: friendId
        });

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lời mời kết bạn'
            });
        }

        // Update cả 2 records
        await Friend.updateMany(
            {
                $or: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId }
                ]
            },
            { status: 'rejected' }
        );

        res.status(200).json({
            success: true,
            message: 'Đã từ chối lời mời kết bạn'
        });
    } catch (error) {
        next(error);
    }
};

// Hủy kết bạn
export const unfriend = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;

        const result = await Friend.deleteMany({
            $or: [
                { userId: userId, friendId: friendId },
                { userId: friendId, friendId: userId }
            ],
            status: 'accepted'
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mối quan hệ bạn bè'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã hủy kết bạn'
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách bạn bè
export const getFriends = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user.id;
        const { page = 1, limit = 20, search } = req.query;

        const query = {
            userId: userId,
            status: 'accepted'
        };

        const friends = await Friend.find(query)
            .populate({
                path: 'friendId',
                select: 'name email avatar bio',
                match: search ? { name: new RegExp(search, 'i') } : {}
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        // Filter out null populated friends (from search match)
        const validFriends = friends.filter(f => f.friendId != null);

        const total = await Friend.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                friends: validFriends,
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

// Lấy danh sách lời mời đang chờ
export const getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type = 'received' } = req.query; // received or sent

        let query;
        if (type === 'received') {
            // Lời mời người khác gửi cho mình
            query = {
                userId: userId,
                status: 'pending',
                requestedBy: { $ne: userId }
            };
        } else {
            // Lời mời mình đã gửi đi
            query = {
                userId: userId,
                status: 'pending',
                requestedBy: userId
            };
        }

        const requests = await Friend.find(query)
            .populate('friendId', 'name email avatar bio')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                requests,
                count: requests.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Kiểm tra trạng thái bạn bè
export const checkFriendStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.params;

        // Kiểm tra có bị block không
        const isBlocked = await BlockedUser.findOne({
            $or: [
                { userId: userId, blockedUserId: targetUserId },
                { userId: targetUserId, blockedUserId: userId }
            ]
        });

        if (isBlocked) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'blocked',
                    blockedBy: isBlocked.userId.equals(userId) ? 'you' : 'them'
                }
            });
        }

        // Kiểm tra friendship
        const friendship = await Friend.findOne({
            userId: userId,
            friendId: targetUserId
        });

        if (!friendship) {
            return res.status(200).json({
                success: true,
                data: { status: 'none' }
            });
        }

        let statusInfo = { status: friendship.status };
        
        if (friendship.status === 'pending') {
            statusInfo.sentBy = friendship.requestedBy.equals(userId) ? 'you' : 'them';
        }

        res.status(200).json({
            success: true,
            data: statusInfo
        });
    } catch (error) {
        next(error);
    }
};

// ========== BLOCKING ==========

// Chặn người dùng
export const blockUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { blockedUserId, reason } = req.body;

        // Validate
        if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ'
            });
        }

        if (userId === blockedUserId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể chặn chính mình'
            });
        }

        // Kiểm tra người dùng có tồn tại không
        const userToBlock = await User.findById(blockedUserId);
        if (!userToBlock) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Xóa friendship nếu có
        await Friend.deleteMany({
            $or: [
                { userId: userId, friendId: blockedUserId },
                { userId: blockedUserId, friendId: userId }
            ]
        });

        // Tạo block record
        const blocked = await BlockedUser.create({
            userId: userId,
            blockedUserId: blockedUserId,
            reason: reason || ''
        });

        res.status(201).json({
            success: true,
            message: 'Đã chặn người dùng',
            data: blocked
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Đã chặn người dùng này rồi'
            });
        }
        next(error);
    }
};

// Bỏ chặn người dùng
export const unblockUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { blockedUserId } = req.body;

        const result = await BlockedUser.deleteOne({
            userId: userId,
            blockedUserId: blockedUserId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng đã chặn'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã bỏ chặn người dùng'
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách người đã chặn
export const getBlockedUsers = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const blockedUsers = await BlockedUser.find({ userId: userId })
            .populate('blockedUserId', 'name email avatar')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await BlockedUser.countDocuments({ userId: userId });

        res.status(200).json({
            success: true,
            data: {
                blockedUsers,
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
