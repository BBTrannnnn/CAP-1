import mongoose from 'mongoose';

const UserAchievementSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  achievementId: { 
    type: String, 
    required: true,
    index: true
  },
  habitId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Habit',
    required: true
    // ⚠️ Lưu habitId để biết achievement được unlock từ habit nào
    // NHƯNG KHÔNG dùng trong unique index
  },
  
  title: { type: String, required: true },
  description: String,
  icon: String,
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  rewards: {
    streakShields: { type: Number, default: 0 },
    freezeTokens: { type: Number, default: 0 },
    reviveTokens: { type: Number, default: 0 }
  },
  
  unlockedAt: { type: Date, default: Date.now }
  
}, { timestamps: true });

UserAchievementSchema.index(
  { userId: 1, achievementId: 1 }, 
  { unique: true }
);

UserAchievementSchema.index({ habitId: 1 });
UserAchievementSchema.index({ unlockedAt: -1 });

const UserAchievement = mongoose.model('UserAchievement', UserAchievementSchema);

export default UserAchievement;