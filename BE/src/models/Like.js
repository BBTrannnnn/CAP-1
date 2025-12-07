import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    targetType: {
        type: String,
        enum: ['post', 'comment'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetModel'
    },
    // Dynamic reference
    targetModel: {
        type: String,
        required: true,
        enum: ['Post', 'Comment']
    }
}, {
    timestamps: true
});

// Compound unique index: 1 user chỉ like 1 lần cho 1 target
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// Index cho query
likeSchema.index({ targetId: 1, targetType: 1 });

// Static method: Toggle like (like/unlike)
likeSchema.statics.toggleLike = async function(userId, targetType, targetId) {
    const targetModel = targetType === 'post' ? 'Post' : 'Comment';
    
    const existingLike = await this.findOne({
        userId,
        targetType,
        targetId
    });

    if (existingLike) {
        // Unlike
        await existingLike.deleteOne();
        return { action: 'unliked', liked: false };
    } else {
        // Like
        await this.create({
            userId,
            targetType,
            targetId,
            targetModel
        });
        return { action: 'liked', liked: true };
    }
};

// Static method: Kiểm tra user đã like chưa
likeSchema.statics.isLikedBy = async function(userId, targetType, targetId) {
    const like = await this.findOne({
        userId,
        targetType,
        targetId
    });
    return !!like;
};

const Like = mongoose.model('Like', likeSchema);

export default Like;
