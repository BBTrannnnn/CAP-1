import mongoose from 'mongoose';

const dreamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  dreamText: {
    type: String,
    required: [true, 'Dream text is required'],
    trim: true,
    minlength: [10, 'Dream text must be at least 10 characters'],
    maxlength: [2000, 'Dream text cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: ['stress', 'fear', 'anxiety', 'sadness', 'happy', 'neutral', 'confusion'],
    index: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  probabilities: {
    stress: { type: Number, min: 0, max: 1 },
    fear: { type: Number, min: 0, max: 1 },
    anxiety: { type: Number, min: 0, max: 1 },
    sadness: { type: Number, min: 0, max: 1 },
    happy: { type: Number, min: 0, max: 1 },
    neutral: { type: Number, min: 0, max: 1 },
    confusion: { type: Number, min: 0, max: 1 },
  },
  interpretation: {
    type: String,
    required: true,
  },
  tips: {
    type: String,
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
dreamSchema.index({ userId: 1, analyzedAt: -1 });
dreamSchema.index({ userId: 1, category: 1 });

// Virtual for formatted date
dreamSchema.virtual('formattedDate').get(function() {
  return this.analyzedAt.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const Dream = mongoose.model('Dream', dreamSchema);

export default Dream;
