import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: [true, 'Nội dung bài viết không được để trống'],
        trim: true,
        maxLength: [5000, 'Nội dung không được vượt quá 5000 ký tự']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: String, // Cloudinary public ID để xóa
        caption: String
    }],
    hashtags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    visibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0
    },
    commentCount: {
        type: Number,
        default: 0,
        min: 0
    },
    shareCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Bài viết được share từ bài gốc
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    // Nếu là bài share, có thể thêm caption
    shareCaption: {
        type: String,
        maxLength: [500, 'Caption không được vượt quá 500 ký tự']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Báo cáo vi phạm
    reportCount: {
        type: Number,
        default: 0
    },
    isReported: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index cho performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ visibility: 1, isActive: 1, createdAt: -1 });

// Virtual để lấy likes
postSchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'targetId',
    match: { targetType: 'post' }
});

// Virtual để lấy comments
postSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'postId'
});

// Middleware: Extract hashtags từ content trước khi save
postSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
        const matches = this.content.match(hashtagRegex);
        if (matches) {
            this.hashtags = [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
        }
    }
    next();
});

// Method: Kiểm tra user có quyền edit không
postSchema.methods.canEdit = function(userId) {
    return this.userId.equals(userId);
};

const Post = mongoose.model('Post', postSchema);

export default Post;
