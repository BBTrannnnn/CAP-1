import mongoose from 'mongoose';

// =============================
// 📋 QUESTION SCHEMA
// =============================
const questionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['single', 'multiple', 'scale'], required: true },
    category: { type: String, required: true },
    options: [{
        id: String,
        text: String,
        value: Number
    }]
}, { _id: false });

// =============================
// 📋 SURVEY RESPONSE SCHEMA
// =============================
const surveyResponseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: String, required: true },
    selectedOptions: [String],
    score: { type: Number, default: 0 },
    category: { type: String, required: true }
}, { timestamps: true });

// =============================
// 📊 USER ANALYSIS SCHEMA
// =============================
const userAnalysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalScore: { type: Number, default: 0 },
    categoryScores: {
        health: { type: Number, default: 0 },
        productivity: { type: Number, default: 0 },
        learning: { type: Number, default: 0 },
        finance: { type: Number, default: 0 },
        // Chú ý: Cần thêm các category còn thiếu nếu có trong engine (ví dụ: fitness, sleep, energy, control)
        relationships: { type: Number, default: 0 }, 
        mindfulness: { type: Number, default: 0 }
    },
    userPersona: { type: String },
    completedAt: { type: Date, default: Date.now },
    needsUpdate: { type: Boolean, default: false }
}, { timestamps: true });

// =============================
// 💡 HABIT SUGGESTION SCHEMA
// =============================
const habitSuggestionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    estimatedTime: { type: Number },
    icon: { type: String },
    color: { type: String },
    tags: [String],
    requiredScore: { type: Number, default: 0 },
    targetPersonas: [String],
    trackingMode: { type: String, enum: ['check', 'count'], default: 'check' },
    targetCount: { type: Number, default: null },
    unit: { type: String, default: null }
}, { timestamps: true });

// ===========================================
// 🧠 USER SURVEY SESSION SCHEMA (ĐÃ SỬA LỖI E11000)
// ===========================================
const userSurveySessionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        // ✅ ĐÃ BỎ: unique: true
    },
    questions: {
        type: [questionSchema],
        required: true,
        default: []
    },
    strategy: { 
        type: String, 
        default: 'stratified' 
    },
    answers: { 
        type: Map, 
        of: Number, 
        default: {} 
    },
    isCompleted: { 
        type: Boolean, 
        default: false 
    },
    completedAt: Date,
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
    }
}, { 
    timestamps: true,
    minimize: false,
    strict: true
});

// 🛠️ ĐIỂM SỬA LỖI CHÍNH: Thêm Unique Index với Partial Filter
// Index này đảm bảo CHỈ có MỘT document với cùng userId mà có isCompleted: false
userSurveySessionSchema.index(
    { userId: 1 }, 
    { 
        unique: true,
        partialFilterExpression: { isCompleted: false } 
    }
);

// Index tự động xóa session hết hạn
userSurveySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// =============================
// 📤 MODEL EXPORTS
// =============================
const Question = mongoose.model('Question', questionSchema);
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);
const UserAnalysis = mongoose.model('UserAnalysis', userAnalysisSchema);
const HabitSuggestion = mongoose.model('HabitSuggestion', habitSuggestionSchema);
const UserSurveySession = mongoose.model('UserSurveySession', userSurveySessionSchema);

export {
    Question,
    SurveyResponse,
    UserAnalysis,
    HabitSuggestion,
    UserSurveySession
};