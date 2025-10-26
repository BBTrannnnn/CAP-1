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
    
    // Tracking Mode
    trackingMode: { 
        type: String, 
        enum: ['check', 'count'], 
        default: 'check' 
    },
    targetCount: { 
        type: Number, 
        default: 1,
        min: 1
    },
    unit: { 
        type: String, 
        maxLength: 20,
        default: ''
    },
    
    // Tracking
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    targetDays: { type: Number, default: 21 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    
    // 🎯 GOALS & MILESTONES - MỚI
    goals: [{
        type: {
            type: String,
            enum: ['total_completions', 'streak', 'weekly_target', 'monthly_target', 'custom'],
            required: true
        },
        target: {
            type: Number,
            required: true,
            min: 1
        },
        current: {
            type: Number,
            default: 0
        },
        unit: {
            type: String,
            maxLength: 50,
            default: 'lần'
        },
        description: {
            type: String,
            maxLength: 200
        },
        deadline: Date,
        isCompleted: {
            type: Boolean,
            default: false
        },
        completedAt: Date,
        reward: {
            type: String,
            maxLength: 200
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // 🔔 REMINDERS - CẢI TIẾN
    reminders: [{
        time: { 
            type: String, 
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/  // Validate HH:MM format
        },
        days: [{
            type: Number,
            min: 0,
            max: 6
            // 0=Chủ nhật, 1=Thứ 2, 2=Thứ 3, ..., 6=Thứ 7
        }],
        message: {
            type: String,
            maxLength: 200
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        soundEnabled: {
            type: Boolean,
            default: true
        },
        vibrationEnabled: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Stats
    completionRate: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    
    // Metadata
    isFromSuggestion: { type: Boolean, default: false },
    suggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitTemplate' },
    order: { type: Number, default: 0 }
}, { 
    timestamps: true 
});

// ==================== HABIT TRACKING SCHEMA ====================
const habitTrackingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    
    date: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'completed', 'skipped', 'failed'], 
        default: 'pending' 
    },
    
    // Cho tracking mode = 'count'
    targetCount: { type: Number, default: 1 },
    completedCount: { type: Number, default: 0 },
    
    completedAt: Date,
    notes: { type: String, maxlength: 200 },
    mood: { type: String, enum: ['great', 'good', 'okay', 'bad'], default: null }
}, { 
    timestamps: true 
});

// ==================== SUB TRACKING SCHEMA ====================
const habitSubTrackingSchema = new mongoose.Schema({
    habitTrackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitTracking', required: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    quantity: { type: Number, default: 1, min: 1 },
    note: { type: String, maxlength: 200 }
}, { 
    timestamps: true 
});

// ==================== HABIT TEMPLATE SCHEMA ====================
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
}, {
    timestamps: true
});

// ==================== INDEXES ====================
habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, category: 1 });
habitSchema.index({ userId: 1, 'goals.isCompleted': 1 });

habitTrackingSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
habitTrackingSchema.index({ userId: 1, date: -1 });

habitSubTrackingSchema.index({ userId: 1, habitId: 1, createdAt: -1 });
habitSubTrackingSchema.index({ habitTrackingId: 1 });

// ==================== VIRTUALS ====================
habitSchema.virtual('hasActiveGoals').get(function() {
    return this.goals && this.goals.some(goal => !goal.isCompleted);
});

habitSchema.virtual('hasActiveReminders').get(function() {
    return this.reminders && this.reminders.some(reminder => reminder.isActive);
});

habitSchema.virtual('progressToday').get(function() {
    // Sẽ được populate từ tracking data
    return {
        completed: this.completedCount || 0,
        target: this.targetCount || 1
    };
});

// ==================== MIDDLEWARE ====================
// Tự động xóa tracking khi xóa habit
habitSchema.pre('findOneAndDelete', async function(next) {
    const habitId = this.getQuery()._id;
    
    await mongoose.model('HabitTracking').deleteMany({ habitId });
    await mongoose.model('HabitSubTracking').deleteMany({ habitId });
    
    next();
});

habitSchema.pre('deleteOne', async function(next) {
    const habitId = this.getQuery()._id;
    
    await mongoose.model('HabitTracking').deleteMany({ habitId });
    await mongoose.model('HabitSubTracking').deleteMany({ habitId });
    
    next();
});

// Tự động xóa sub-tracking khi xóa tracking
habitTrackingSchema.pre('findOneAndDelete', async function(next) {
    const trackingId = this.getQuery()._id;
    
    await mongoose.model('HabitSubTracking').deleteMany({ habitTrackingId: trackingId });
    
    next();
});

// ==================== MODELS ====================
const Habit = mongoose.model('Habit', habitSchema);
const HabitTracking = mongoose.model('HabitTracking', habitTrackingSchema);
const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);
const HabitSubTracking = mongoose.model('HabitSubTracking', habitSubTrackingSchema);

export {
    Habit,
    HabitTracking,
    HabitTemplate,
    HabitSubTracking
};
