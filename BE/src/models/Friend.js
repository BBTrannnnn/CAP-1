import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Compound index để tránh duplicate friend requests
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Đảm bảo không tự kết bạn với chính mình
friendSchema.pre('save', function(next) {
    if (this.userId.equals(this.friendId)) {
        next(new Error('Không thể kết bạn với chính mình'));
    } else {
        next();
    }
});

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;
