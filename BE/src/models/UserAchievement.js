import mongoose from 'mongoose';

const UserAchievementSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  achievementId: { 
    type: String, 
    required: true 
  },
  habitId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Habit' 
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

// Index để tránh duplicate
UserAchievementSchema.index({ userId: 1, achievementId: 1, habitId: 1 }, { unique: true });

const UserAchievement = mongoose.model('UserAchievement', UserAchievementSchema);

export default  UserAchievement;