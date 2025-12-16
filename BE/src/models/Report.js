import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    // Người báo cáo
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Loại nội dung bị báo cáo
    contentType: {
        type: String,
        enum: ['post', 'comment', 'user'],
        required: true,
        index: true
    },
    
    // ID của nội dung bị báo cáo
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        refPath: 'contentType'
    },
    
    // Chủ sở hữu nội dung bị báo cáo
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Lý do báo cáo
    reason: {
        type: String,
        enum: [
            'spam',           // Spam
            'harassment',     // Quấy rối
            'hate_speech',    // Ngôn từ thù địch
            'violence',       // Bạo lực
            'nsfw',          // Nội dung 18+
            'misinformation', // Thông tin sai lệch
            'scam',          // Lừa đảo
            'copyright',     // Vi phạm bản quyền
            'other'          // Khác
        ],
        required: [true, 'Vui lòng chọn lý do báo cáo']
    },
    
    // Mô tả chi tiết (tùy chọn)
    description: {
        type: String,
        trim: true,
        maxLength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    
    // Trạng thái xử lý
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },
    
    // Moderator xử lý
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Hành động đã thực hiện
    action: {
        type: String,
        enum: ['none', 'content_removed', 'user_warned', 'user_banned', 'dismissed'],
        default: 'none'
    },
    
    // Ghi chú của moderator
    reviewNote: {
        type: String,
        trim: true,
        maxLength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
    },
    
    // Thời gian xử lý
    reviewedAt: {
        type: Date,
        default: null
    },
    
    // Độ ưu tiên (tự động tăng nếu nhiều người báo cáo cùng nội dung)
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    }
}, {
    timestamps: true // createdAt, updatedAt
});

// Index compound để tránh spam báo cáo
reportSchema.index({ reporterId: 1, contentType: 1, contentId: 1 }, { unique: true });

// Index để query hiệu quả
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ contentType: 1, status: 1 });
reportSchema.index({ reportedUserId: 1, createdAt: -1 });

// Virtual để populate nội dung bị báo cáo
reportSchema.virtual('content', {
    refPath: 'contentType',
    localField: 'contentId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtuals được include khi convert sang JSON
reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
