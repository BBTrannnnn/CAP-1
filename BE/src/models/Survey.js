import mongoose from 'mongoose';

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
});

const surveyResponseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: String, required: true },
    selectedOptions: [String],
    score: { type: Number, default: 0 },
    category: { type: String, required: true }
}, { timestamps: true });

const userAnalysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalScore: { type: Number, default: 0 },
    categoryScores: {
        health: { type: Number, default: 0 },
        productivity: { type: Number, default: 0 },
        learning: { type: Number, default: 0 },
        finance: { type: Number, default: 0 },
        relationships: { type: Number, default: 0 },
        mindfulness: { type: Number, default: 0 }
    },
    userPersona: { type: String },
    completedAt: { type: Date, default: Date.now },
    needsUpdate: { type: Boolean, default: false }
}, { timestamps: true });

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
    targetPersonas: [String]
});

const Question = mongoose.model('Question', questionSchema);
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);
const UserAnalysis = mongoose.model('UserAnalysis', userAnalysisSchema);
const HabitSuggestion = mongoose.model('HabitSuggestion', habitSuggestionSchema);

export {
    Question,
    SurveyResponse,
    UserAnalysis,
    HabitSuggestion
};