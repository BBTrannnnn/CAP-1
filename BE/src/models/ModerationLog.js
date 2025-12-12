import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    contentType: {
        type: String,
        enum: ['post', 'comment'],
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'contentType'
    },
    action: {
        type: String,
        enum: [
            'auto_approved',
            'auto_rejected', 
            'pending_review',
            'moderator_approved',
            'moderator_rejected',
            'appeal_submitted',
            'appeal_approved',
            'appeal_rejected'
        ],
        required: true,
        index: true
    },
    reason: {
        type: String,
        required: true
    },
    scores: {
        profanity: { 
            type: Number, 
            min: 0, 
            max: 100 
        },
        nsfw: { 
            type: Number, 
            min: 0, 
            max: 1 
        },
        spam: { 
            type: Number, 
            min: 0, 
            max: 100 
        }
    },
    detectedIssues: [{
        type: {
            type: String,
            enum: ['profanity', 'nsfw', 'spam', 'url', 'duplicate']
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'severe']
        },
        details: String
    }],
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    reviewNotes: {
        type: String
    },
    // User appeal info
    appealedAt: {
        type: Date
    },
    appealReason: {
        type: String
    },
    // Trust score impact
    trustScoreChange: {
        type: Number
    }
}, {
    timestamps: true
});

// Indexes for queries
moderationLogSchema.index({ userId: 1, createdAt: -1 });
moderationLogSchema.index({ action: 1, createdAt: -1 });
moderationLogSchema.index({ contentType: 1, contentId: 1 });
moderationLogSchema.index({ reviewedBy: 1, createdAt: -1 });

// Static method: Get moderation stats
moderationLogSchema.statics.getStats = async function(startDate, endDate) {
    const stats = await this.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
                    $lte: endDate || new Date()
                }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        }
    ]);
    
    return stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
};

// Static method: Get top violators
moderationLogSchema.statics.getTopViolators = async function(limit = 10, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await this.aggregate([
        {
            $match: {
                action: { $in: ['auto_rejected', 'moderator_rejected'] },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$userId',
                violations: { $sum: 1 },
                lastViolation: { $max: '$createdAt' }
            }
        },
        {
            $sort: { violations: -1 }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                userId: '$_id',
                name: '$user.name',
                email: '$user.email',
                violations: 1,
                lastViolation: 1,
                trustScore: '$user.trustScore'
            }
        }
    ]);
};

export default mongoose.model('ModerationLog', moderationLogSchema);
