import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxLength: 100 },
    description: { type: String, maxLength: 500 },
    
    // UI Elements
    icon: { 
        type: String, 
        default: '🎯',
        enum: ['🍎', '🏃', '⏰', '💝', '📚', '💻', '📱', '🧘', '💰', '😊', '💤', '⚡', '🎯', '📖', '✏️', '🏠', '🎵']
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
    specificDays: [{ 
        type: String, 
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] 
    }],
    
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
    
    // Tracking
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
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
    
    // Motivation
    motivation: { type: String, maxLength: 200 },
    reward: { type: String, maxLength: 100 },
    
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
    date: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['completed', 'skipped', 'failed'], 
        required: true 
    },
    completedAt: { type: Date },
    notes: { type: String, maxLength: 200 },
    mood: { 
        type: String, 
        enum: ['great', 'good', 'okay', 'bad'] 
    }
}, { 
    timestamps: true 
});

habitTrackingSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

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

const Habit = mongoose.model('Habit', habitSchema);
const HabitTracking = mongoose.model('HabitTracking', habitTrackingSchema);
const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);

export {
    Habit,
    HabitTracking,
    HabitTemplate
};
