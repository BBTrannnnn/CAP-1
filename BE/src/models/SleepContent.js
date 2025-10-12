import mongoose from 'mongoose';

// Nội dung âm thanh thư giãn + truyện ru ngủ dùng chung 1 collection
// type: 'sound' (tiếng mưa, sóng biển, white noise...) | 'story' (truyện kể)
const sleepContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sound', 'story'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  description: { type: String },
  // Thời lượng tính bằng giây để chính xác, FE có thể hiển thị displayDuration
  durationSec: { type: Number, required: true },
  displayDuration: { type: String },
  audioUrl: { type: String, required: true },
  coverImage: { type: String },
  category: { type: String }, // ví dụ: rain, ocean, forest, white-noise, adventure
  tags: [{ type: String }],
  language: { type: String, default: 'vi' },
  isLoopRecommended: { type: Boolean, default: false },
  premium: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

sleepContentSchema.index({ type: 1, active: 1, sortOrder: 1 });
sleepContentSchema.index({ tags: 1 });

export default mongoose.model('SleepContent', sleepContentSchema);
