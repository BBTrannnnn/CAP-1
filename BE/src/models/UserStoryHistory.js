import mongoose from 'mongoose';

const userStoryHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SleepContent', required: true, index: true },
  lastPosition: { type: Number, default: 0 }, // seconds
  completedAt: { type: Date },
  lastViewedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('UserStoryHistory', userStoryHistorySchema);
