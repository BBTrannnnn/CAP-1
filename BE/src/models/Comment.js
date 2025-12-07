import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: [true, 'Nội dung bình luận không được để trống'],
        trim: true,
        maxLength: [1000, 'Bình luận không được vượt quá 1000 ký tự']
    },
    // Reply to comment (nested comments)
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0
    },
    replyCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index cho performance
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });

// Virtual để lấy replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentCommentId'
});

// Virtual để lấy likes
commentSchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'targetId',
    match: { targetType: 'comment' }
});

// Method: Kiểm tra user có quyền edit không
commentSchema.methods.canEdit = function(userId) {
    return this.userId.equals(userId);
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
