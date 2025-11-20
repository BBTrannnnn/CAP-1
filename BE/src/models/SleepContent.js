import mongoose from 'mongoose';

// Nội dung âm thanh thư giãn + truyện ru ngủ dùng chung 1 collection
// type: 'sound', 'story' (truyện kể)
const sleepContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sound', 'story'],
    required: true
  },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  description: { type: String },
  duration: { type: Number, required: true },
  displayDuration: { type: String },
  audioUrl: { type: String, required: true },
  thumbnail: { type: String },
  icon: { type: String },
  category: { type: String }, //rain, ocean, forest, white-noise, adventure
  tags: [{ type: String }],
  language: { type: String, default: 'vi' },
  playCount: { type: Number, default: 0 },
  viewType: { type: String },
  rating: { type: Number, min: 0, max: 5 },
  isLoopRecommended: { type: Boolean, default: false },
  premium: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

sleepContentSchema.index({ type: 1, active: 1, sortOrder: 1 });
sleepContentSchema.index({ tags: 1 });

export default mongoose.model('SleepContent', sleepContentSchema);

/*
type: Loại nội dung, gồm sound hoặc story.
name: Tên nội dung
slug: Định danh duy nhất viết thường dùng cho URL, "tieng-mua-roi".
description: Mô tả ngắn về nội dung
duration: Thời lượng nội dung (giây
displayDuration: Thời lượng hiển thị (dạng chuỗi, ví dụ "10 phút")
audioUrl: Đường dẫn file âm thanh
thumbnail: Ảnh đại diện cho nội dung
icon: Biểu tượng nhỏ cho nội dung
category: Phân loại, ví dụ "rain", "ocean", "forest"
tags: Các từ khóa liên quan, giúp tìm kiếm
language: Ngôn ngữ nội dung, mặc định là "vi" 
playCount: Số lần đã phát nội dung
viewType: Kiểu hiển thị nội dung 
rating: Đánh giá chất lượng (từ 0 đến 5)
isLoopRecommended: Có khuyến nghị phát lặp lại không
premium: Nội dung cao cấp (có trả phí)
sortOrder: Thứ tự sắp xếp hiển thị
active: Trạng thái hoạt động (có hiển thị cho người dùng không)
*/