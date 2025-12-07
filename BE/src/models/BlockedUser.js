import mongoose from 'mongoose';

const blockedUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    blockedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reason: {
        type: String,
        maxLength: 500
    }
}, {
    timestamps: true
});

// Compound index để tránh duplicate blocks
blockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

// Đảm bảo không tự block chính mình
blockedUserSchema.pre('save', function(next) {
    if (this.userId.equals(this.blockedUserId)) {
        next(new Error('Không thể chặn chính mình'));
    } else {
        next();
    }
});

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

export default BlockedUser;
