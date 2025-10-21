import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxLength: 100 },
    description: { type: String, maxLength: 500 },
    
    // UI Elements
    icon: { 
        type: String, 
        default: '🎯',
        enum: ['🍎', '🏃', '⏰', '💝', '📚', '💻', '📱', '🧘', '💰', '😊', '💤', '⚡', '🎯', '📖', '✏️', '🏠', '🎵','🍵','💧','🥬','🏥','👟','👥']
    },
    color: { 
        type: String, 
        default: '#3B82F6',
        enum: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1', '#EF4444', '#22C55E', '#FF6B35', '#8B5CF6', '#6B7280']
    },
    
    // Frequency & Schedule
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
    },
    customFrequency: {
        times: { type: Number, default: 1 },
        period: { type: String, enum: ['day', 'week', 'month'], default: 'day' }
    },
  
    // Category & Type
    category: {
        type: String,
        required: true,
        enum: ['health', 'fitness', 'learning', 'mindful', 'finance', 'digital', 'social', 'control', 'sleep', 'energy']
    },
    habitType: {
        type: String,
        enum: ['build', 'quit'],
        default: 'build'
    },
    
    trackingMode: { type: String, enum: ['check', 'count'], default: 'check' }, // check = chỉ hoàn thành 1 lần/ngày
    targetCount: { type: Number, default: 1 }, // ví dụ 5 ly nước
    unit: { type: String, maxLength: 20 }, // ví dụ: "ly", "bước"
    
    // Tracking
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    targetDays: { type: Number, default: 21 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    
    // Reminders
    reminders: [{
        time: { type: String },
        days: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
        isEnabled: { type: Boolean, default: true }
    }],
    

    // Stats
    completionRate: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    
    // Metadata
    isFromSuggestion: { type: Boolean, default: false },
    suggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitSuggestion' },
    order: { type: Number, default: 0 }
}, { 
    timestamps: true 
});

const habitTrackingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  
  date: { type: Date, required: true }, // vẫn để 00:00 để gom theo ngày
  status: { type: String, enum: ['in-progress', 'completed', 'skipped', 'failed'], default: 'in-progress' },

  // ✅ THÊM MỚI
  targetCount: { type: Number, default: 1 }, // ví dụ: 5 ly nước/ngày
  completedCount: { type: Number, default: 0 }, // hiện đã xong mấy lần

  notes: { type: String, maxlength: 200 }

}, { 
    timestamps: true 
});

const HabitSubTrackingSchema = new mongoose.Schema({
  habitTrackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitTracking', required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date }, 
  quantity: { type: Number, default: 1, min: 1 }, // ví dụ: số ly, số lần
  note: { type: String, maxlength: 200 }
}, { timestamps: true });

habitTrackingSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
HabitSubTrackingSchema.index({ userId: 1, habitId: 1, timestamp: -1 });

const habitTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['health', 'fitness', 'learning', 'mindful', 'finance', 'digital', 'social', 'control', 'sleep', 'energy']
    },
    defaultIcon: { type: String, default: '🎯' },
    defaultColor: { type: String, default: '#3B82F6' },
    suggestedFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    estimatedTime: { type: Number },
    tips: [String],
    commonObstacles: [String],
    benefits: [String],
    isPopular: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 }
});
habitSchema.pre('findOneAndDelete', async function(next) {
  const habitId = this.getQuery()._id;
  
  // Tự động xóa tất cả tracking của habit này
  await mongoose.model('HabitTracking').deleteMany({ habitId });
  
  next();
});

habitSchema.pre('deleteOne', async function(next) {
  const habitId = this.getQuery()._id;
  
  await mongoose.model('HabitTracking').deleteMany({ habitId });
  
  next();
});

const Habit = mongoose.model('Habit', habitSchema);
const HabitTracking = mongoose.model('HabitTracking', habitTrackingSchema);
const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);
const HabitSubTracking = mongoose.model('HabitSubTracking', HabitSubTrackingSchema);

export {
    Habit,
    HabitTracking,
    HabitTemplate,
    HabitSubTracking
};
