import mongoose from 'mongoose';

/* ==================== HABIT SCHEMA ==================== */
const habitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxLength: 100 },
    description: { type: String, maxLength: 500 },

    // UI Elements
    icon: {
        type: String,
    },
    color: {
        type: String,
    },

    // Frequency & Schedule
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly','yearly','custom'], default: 'daily' },
    customFrequency: {
        times: { type: Number, default: 1 },
        period: { type: String, enum: ['day', 'week', 'month'], default: 'day' }
    },

    // Category & Type
    category: {
        type: String,
        required: true,
        enum: ['health', 'fitness', 'learning', 'mindful','productivity', 'finance', 'digital', 'social', 'control', 'sleep', 'energy']
    },
    habitType: { type: String, enum: ['build', 'quit'], default: 'build' },

    // Tracking Mode
    trackingMode: { type: String, enum: ['check', 'count'], default: 'check' },
    targetCount: { type: Number, default: 1, min: 1 },
    unit: { type: String, maxLength: 20, default: '' },

    // Tracking
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    targetDays: { type: Number },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },

    // Stats
    completionRate: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },

    // Metadata
    isFromSuggestion: { type: Boolean, default: false },
    suggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitTemplate' },
    order: { type: Number, default: 0 },

    streakProtection: {
    // Shield protection
    isProtected: { type: Boolean, default: false },
    protectedUntil: Date,
    protectedBy: String, // 'shield', 'auto', 'manual'
    
    // Warning status
    warningDate: Date,
    warningSent: { type: Boolean, default: false },
    
    // Freeze status
    isFrozen: { type: Boolean, default: false },
    frozenStartDate: Date,
    frozenEndDate: Date,
    frozenDaysRemaining: { type: Number, default: 0 }
  },

}, { timestamps: true });


/* ==================== HABIT GOAL SCHEMA ==================== */
const habitGoalSchema = new mongoose.Schema({
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
        type: String,
        enum: ['total_completions', 'streak', 'weekly_target', 'monthly_target', 'custom'],
        required: true
    },
    target: { type: Number, required: true, min: 1 },
    current: { type: Number, default: 0 },
    unit: { type: String, default: 'lần', maxLength: 50 },
    description: { type: String, maxLength: 200 },
    deadline: Date,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
    reward: { type: String, maxLength: 200 }
}, { timestamps: true });


/* ==================== HABIT REMINDER SCHEMA ==================== */
const habitReminderSchema = new mongoose.Schema({
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    time: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    days: [{ type: Number, min: 0, max: 6 }], // 0=CN,...6=T7
    message: { type: String, maxLength: 200 },
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });


/* ==================== HABIT TRACKING SCHEMA ==================== */
const habitTrackingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'skipped', 'failed','frozen'],
        default: 'pending'
    },
    isProtected: { 
    type: Boolean, 
    default: false 
  },
    targetCount: { type: Number, default: 1 },
    completedCount: { type: Number, default: 0 },
    completedAt: Date,
    notes: { type: String, maxlength: 200 },
    mood: { type: String, enum: ['great', 'good', 'okay', 'bad'], default: null }
}, { timestamps: true });


/* ==================== SUB TRACKING SCHEMA ==================== */
const habitSubTrackingSchema = new mongoose.Schema({
    habitTrackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'HabitTracking', required: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
      isProtected: { 
    type: Boolean, 
    default: false 
  },
    quantity: { type: Number, default: 1, min: 1 },
    note: { type: String, maxlength: 200 }
}, { timestamps: true });


/* ==================== HABIT TEMPLATE SCHEMA ==================== */
const habitTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['health', 'fitness', 'learning', 'mindful', 'finance', 'digital', 'productivity','social', 'control', 'sleep', 'energy']
    },
    icon: {
        type: String,
    },
    color: {
        type: String,
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly','yearly'],
        default: 'daily',
        alias: 'suggestedFrequency'
    },
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
        maxlength: 20
    },

    // Habit Type
    habitType: {
        type: String,
        enum: ['build', 'quit'],
        default: 'build'
    },

    // Difficulty
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },

    // Guidance
    tips: [{
        type: String,
        maxlength: 200
    }],
    commonObstacles: [{
        type: String,
        maxlength: 200
    }],
    benefits: [{
        type: String,
        maxlength: 200
    }],

    // Popularity & Usage
    isPopular: {
        type: Boolean,
        default: false
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });


/* ==================== INDEXES ==================== */
habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, category: 1 });
habitGoalSchema.index({ userId: 1, habitId: 1 });
habitReminderSchema.index({ userId: 1, habitId: 1, isActive: 1 });
habitTrackingSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
habitSubTrackingSchema.index({ habitTrackingId: 1 });


/* ==================== MIDDLEWARE ==================== */
// Auto-disable expired habits
habitSchema.pre('save', async function (next) {
    if (this.endDate && this.endDate < new Date()) this.isActive = false;
    next();
});


habitSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const HabitTracking = mongoose.model('HabitTracking');
        const HabitSubTracking = mongoose.model('HabitSubTracking');
        const UserAchievement = mongoose.model('UserAchievement');
        const HabitGoal = mongoose.model('HabitGoal');
        const HabitReminder = mongoose.model('HabitReminder');
        
        await HabitTracking.deleteMany({ userId: this._id });
        await HabitSubTracking.deleteMany({ userId: this._id });
        await UserAchievement.deleteMany({ userId: this._id });
        await HabitGoal.deleteMany({ userId: this._id });
        await HabitReminder.deleteMany({ userId: this._id });
        
        next();
    } catch (error) {
        next(error);
    }
});

// Auto-delete related data when habit removed
habitSchema.pre('findOneAndDelete', async function (next) {
    const habitId = this.getQuery()._id;
    await Promise.all([
        mongoose.model('HabitGoal').deleteMany({ habitId }),
        mongoose.model('HabitReminder').deleteMany({ habitId }),
        mongoose.model('HabitTracking').deleteMany({ habitId }),
        mongoose.model('HabitSubTracking').deleteMany({ habitId }),
        mongoose.model('UserAchievement').deleteMany({ habitId })
    ]);
    next();
});


/* ==================== MODELS ==================== */
const Habit = mongoose.model('Habit', habitSchema);
const HabitGoal = mongoose.model('HabitGoal', habitGoalSchema);
const HabitReminder = mongoose.model('HabitReminder', habitReminderSchema);
const HabitTracking = mongoose.model('HabitTracking', habitTrackingSchema);
const HabitSubTracking = mongoose.model('HabitSubTracking', habitSubTrackingSchema);
const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);

export {
    Habit,
    HabitGoal,
    HabitReminder,
    HabitTracking,
    HabitSubTracking,
    HabitTemplate
};
