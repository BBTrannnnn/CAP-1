import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Friend from '../models/Friend.js';
import BlockedUser from '../models/BlockedUser.js';
import mongoose from 'mongoose';

// ========== POST CRUD ==========

// Tạo bài viết mới
export const createPost = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { content, images, visibility } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung bài viết không được để trống'
            });
        }

        const post = await Post.create({
            userId,
            content: content.trim(),
            images: images || [],
            visibility: visibility || 'public'
        });

        // Populate user info
        await post.populate('userId', 'name avatar badge');

        res.status(201).json({
            success: true,
            message: 'Tạo bài viết thành công',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Lấy feed (bài viết của bạn bè và của mình)
export const getFeed = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, visibility = 'all' } = req.query;

        // Lấy danh sách bạn bè
        const friends = await Friend.find({
            userId: userId,
            status: 'accepted'
        }).select('friendId');

        const friendIds = friends.map(f => f.friendId);

        // Lấy danh sách đã chặn
        const blockedUsers = await BlockedUser.find({
            userId: userId
        }).select('blockedUserId');

        const blockedUserIds = blockedUsers.map(b => b.blockedUserId);

        // Query posts
        let query = {
            isActive: true,
            userId: { $nin: blockedUserIds } // Loại bỏ người đã chặn
        };

        // Filter theo visibility
        if (visibility === 'all') {
            query.$or = [
                { userId: userId }, // Bài của mình
                { userId: { $in: friendIds }, visibility: { $in: ['public', 'friends'] } }, // Bài của bạn bè
                { visibility: 'public' } // Bài public của mọi người
            ];
        } else if (visibility === 'friends') {
            query.userId = { $in: [...friendIds, userId] };
            query.visibility = { $in: ['public', 'friends'] };
        } else if (visibility === 'public') {
            query.visibility = 'public';
        }

        const posts = await Post.find(query)
            .populate('userId', 'name avatar badge bio')
            .populate('originalPost')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Check liked status cho mỗi post
        const postsWithLikeStatus = await Promise.all(
            posts.map(async (post) => {
                const isLiked = await Like.isLikedBy(userId, 'post', post._id);
                return {
                    ...post.toObject(),
                    isLiked
                };
            })
        );

        const total = await Post.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                posts: postsWithLikeStatus,
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

// Lấy bài viết của 1 user cụ thể
export const getUserPosts = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Kiểm tra có bị chặn không
        const isBlocked = await BlockedUser.findOne({
            $or: [
                { userId: currentUserId, blockedUserId: userId },
                { userId: userId, blockedUserId: currentUserId }
            ]
        });

        if (isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Không thể xem bài viết của người dùng này'
            });
        }

        // Kiểm tra friendship
        const areFriends = await Friend.findOne({
            userId: currentUserId,
            friendId: userId,
            status: 'accepted'
        });

        let query = {
            userId: userId,
            isActive: true
        };

        // Nếu không phải bạn bè, chỉ xem public
        if (!areFriends && currentUserId !== userId) {
            query.visibility = 'public';
        } else if (areFriends) {
            query.visibility = { $in: ['public', 'friends'] };
        }
        // Nếu là chính mình thì xem tất cả

        const posts = await Post.find(query)
            .populate('userId', 'name avatar badge bio')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const postsWithLikeStatus = await Promise.all(
            posts.map(async (post) => {
                const isLiked = await Like.isLikedBy(currentUserId, 'post', post._id);
                return {
                    ...post.toObject(),
                    isLiked
                };
            })
        );

        const total = await Post.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                posts: postsWithLikeStatus,
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

// Lấy chi tiết 1 bài viết
export const getPostById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'ID bài viết không hợp lệ'
            });
        }

        const post = await Post.findById(postId)
            .populate('userId', 'name avatar badge bio')
            .populate('originalPost');

        if (!post || !post.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Check permission
        if (post.visibility === 'private' && !post.userId._id.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem bài viết này'
            });
        }

        if (post.visibility === 'friends') {
            const areFriends = await Friend.findOne({
                userId: userId,
                friendId: post.userId._id,
                status: 'accepted'
            });

            if (!areFriends && !post.userId._id.equals(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem bài viết này'
                });
            }
        }

        const isLiked = await Like.isLikedBy(userId, 'post', post._id);

        res.status(200).json({
            success: true,
            data: {
                ...post.toObject(),
                isLiked
            }
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật bài viết
export const updatePost = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const { content, images, visibility } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        if (!post.canEdit(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa bài viết này'
            });
        }

        if (content) post.content = content.trim();
        if (images) post.images = images;
        if (visibility) post.visibility = visibility;

        await post.save();
        await post.populate('userId', 'name avatar badge');

        res.status(200).json({
            success: true,
            message: 'Cập nhật bài viết thành công',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Xóa bài viết (soft delete)
export const deletePost = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        if (!post.canEdit(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bài viết này'
            });
        }

        post.isActive = false;
        await post.save();

        res.status(200).json({
            success: true,
            message: 'Đã xóa bài viết'
        });
    } catch (error) {
        next(error);
    }
};

// ========== LIKE/UNLIKE ==========

// Toggle like bài viết
export const toggleLikePost = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;

        const post = await Post.findById(postId);

        if (!post || !post.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        const result = await Like.toggleLike(userId, 'post', postId);

        // Update like count
        if (result.action === 'liked') {
            post.likeCount += 1;
        } else {
            post.likeCount = Math.max(0, post.likeCount - 1);
        }
        await post.save();

        res.status(200).json({
            success: true,
            message: result.action === 'liked' ? 'Đã thích bài viết' : 'Đã bỏ thích',
            data: {
                liked: result.liked,
                likeCount: post.likeCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách người like bài viết
export const getPostLikes = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const likes = await Like.find({
            targetType: 'post',
            targetId: postId
        })
        .populate('userId', 'name avatar badge')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

        const total = await Like.countDocuments({
            targetType: 'post',
            targetId: postId
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

// ========== SHARE POST ==========

// Share bài viết
export const sharePost = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const { shareCaption, visibility } = req.body;

        const originalPost = await Post.findById(postId);

        if (!originalPost || !originalPost.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Tạo bài share mới
        const sharedPost = await Post.create({
            userId,
            content: shareCaption || '',
            originalPost: postId,
            shareCaption,
            visibility: visibility || 'public'
        });

        // Tăng share count của bài gốc
        originalPost.shareCount += 1;
        await originalPost.save();

        await sharedPost.populate([
            { path: 'userId', select: 'name avatar badge' },
            { path: 'originalPost', populate: { path: 'userId', select: 'name avatar badge' } }
        ]);

        res.status(201).json({
            success: true,
            message: 'Đã chia sẻ bài viết',
            data: sharedPost
        });
    } catch (error) {
        next(error);
    }
};

// ========== TRENDING & HASHTAGS ==========

// Lấy trending hashtags
export const getTrendingHashtags = async (req, res, next) => {
    try {
        const { limit = 10, days = 7 } = req.query;

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        const trending = await Post.aggregate([
            {
                $match: {
                    isActive: true,
                    visibility: 'public',
                    createdAt: { $gte: dateLimit }
                }
            },
            { $unwind: '$hashtags' },
            {
                $group: {
                    _id: '$hashtags',
                    count: { $sum: 1 },
                    totalLikes: { $sum: '$likeCount' },
                    totalComments: { $sum: '$commentCount' }
                }
            },
            {
                $addFields: {
                    score: {
                        $add: [
                            '$count',
                            { $multiply: ['$totalLikes', 2] },
                            { $multiply: ['$totalComments', 3] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    hashtag: '$_id',
                    postCount: '$count',
                    totalLikes: 1,
                    totalComments: 1,
                    score: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: trending
        });
    } catch (error) {
        next(error);
    }
};

// Tìm bài viết theo hashtag
export const getPostsByHashtag = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { hashtag } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const posts = await Post.find({
            hashtags: hashtag.toLowerCase(),
            isActive: true,
            visibility: 'public'
        })
        .populate('userId', 'name avatar badge')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        const postsWithLikeStatus = await Promise.all(
            posts.map(async (post) => {
                const isLiked = await Like.isLikedBy(userId, 'post', post._id);
                return {
                    ...post.toObject(),
                    isLiked
                };
            })
        );

        const total = await Post.countDocuments({
            hashtags: hashtag.toLowerCase(),
            isActive: true,
            visibility: 'public'
        });

        res.status(200).json({
            success: true,
            data: {
                posts: postsWithLikeStatus,
                hashtag: hashtag.toLowerCase(),
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
