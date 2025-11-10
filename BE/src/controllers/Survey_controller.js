import asyncHandler from "express-async-handler";
import { surveyQuestions } from '../Script/seedSurvey.js';
import { 
  UserSurveySession, 
  HabitSuggestion, 
  UserAnalysis 
} from '../models/Survey.js';
import { HabitRecommendationEngine } from '../utils/recommend.js';

// ==========================================
// 📋 PUBLIC: Get ALL survey questions
// ==========================================
const getSurveyQuestions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    questions: surveyQuestions,
    totalQuestions: surveyQuestions.length,
    categories: {
      health: surveyQuestions.filter(q => q.category === 'health').length,
      productivity: surveyQuestions.filter(q => q.category === 'productivity').length,
      learning: surveyQuestions.filter(q => q.category === 'learning').length,
      mindful: surveyQuestions.filter(q => q.category === 'mindful').length,
      finance: surveyQuestions.filter(q => q.category === 'finance').length,
      digital: surveyQuestions.filter(q => q.category === 'digital').length,
      social: surveyQuestions.filter(q => q.category === 'social').length,
      fitness: surveyQuestions.filter(q => q.category === 'fitness').length,
      sleep: surveyQuestions.filter(q => q.category === 'sleep').length,
      energy: surveyQuestions.filter(q => q.category === 'energy').length,
      control: surveyQuestions.filter(q => q.category === 'control').length
    }
  });
});

// ==========================================
// 🔒 PROTECTED: Get random questions (legacy)
// ==========================================
const getRandomSurveyQuestions = asyncHandler(async (req, res) => {
  const numQuestions = parseInt(req.query.count) || 12;
  const strategy = req.query.strategy || 'stratified';

  const questionsByCategory = {
    health: [], productivity: [], learning: [], mindful: [],
    finance: [], digital: [], social: [], fitness: [],
    sleep: [], energy: [], control: []
  };

  surveyQuestions.forEach(q => {
    if (questionsByCategory[q.category]) {
      questionsByCategory[q.category].push(q);
    }
  });

  const categories = Object.keys(questionsByCategory);
  let selectedQuestions = [];

  switch (strategy) {
    case 'stratified':
      categories.forEach(category => {
        const categoryQuestions = questionsByCategory[category];
        if (categoryQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
          selectedQuestions.push(categoryQuestions[randomIndex]);
        }
      });

      const remainingCount = numQuestions - selectedQuestions.length;
      if (remainingCount > 0) {
        const selectedIds = new Set(selectedQuestions.map(q => q.id));
        const remainingQuestions = surveyQuestions
          .filter(q => !selectedIds.has(q.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, remainingCount);
        selectedQuestions.push(...remainingQuestions);
      }
      break;

    case 'balanced':
      const questionsPerCategory = Math.floor(numQuestions / categories.length);
      const extraQuestions = numQuestions % categories.length;

      categories.forEach((cat, index) => {
        const questions = questionsByCategory[cat];
        const numToTake = questionsPerCategory + (index < extraQuestions ? 1 : 0);
        const shuffled = questions.sort(() => Math.random() - 0.5);
        selectedQuestions.push(...shuffled.slice(0, Math.min(numToTake, questions.length)));
      });
      break;

    case 'weighted':
      const weights = {
        health: 2, productivity: 2, learning: 1.5, mindful: 1.5,
        fitness: 1.5, sleep: 1.5, energy: 1.5, finance: 1,
        digital: 1, social: 1, control: 1
      };

      const weightedQuestions = surveyQuestions.map(q => ({
        ...q,
        weight: (weights[q.category] || 1) * Math.random()
      }));

      selectedQuestions = weightedQuestions
        .sort((a, b) => b.weight - a.weight)
        .slice(0, numQuestions);
      break;

    case 'random':
    default:
      selectedQuestions = surveyQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, numQuestions);
      break;
  }

  const finalQuestions = selectedQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, numQuestions);

  const categoriesIncluded = [...new Set(finalQuestions.map(q => q.category))];
  const questionsPerCategory = categoriesIncluded.reduce((acc, cat) => {
    acc[cat] = finalQuestions.filter(q => q.category === cat).length;
    return acc;
  }, {});

  res.json({
    success: true,
    strategy,
    questions: finalQuestions,
    totalQuestions: finalQuestions.length,
    categoriesIncluded,
    coverageInfo: {
      totalCategories: categories.length,
      coveredCategories: categoriesIncluded.length,
      coverage: `${categoriesIncluded.length}/${categories.length}`,
      percentage: ((categoriesIncluded.length / categories.length) * 100).toFixed(1) + '%',
      questionsPerCategory
    },
    message: `${strategy} sampling: ${categoriesIncluded.length}/${categories.length} categories covered`
  });
});

// ==========================================
// 🔒 NEW: Get or Create User Survey Session
// ==========================================
const getUserSurveySession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const numQuestions = parseInt(req.query.count) || 12;
  const strategy = req.query.strategy || 'stratified';

  // Tìm session chưa complete
  let session = await UserSurveySession.findOne({ 
    userId, 
    isCompleted: false 
  });

  // Nếu không có → tạo mới
  if (!session) {
    const selectedQuestions = selectQuestionsByStrategy(
      surveyQuestions, 
      numQuestions, 
      strategy
    );

    session = await UserSurveySession.create({
      userId,
      questions: selectedQuestions,
      strategy,
      answers: {},
      isCompleted: false
    });
  }

  res.json({
    success: true,
    sessionId: session._id,
    questions: session.questions,
    totalQuestions: session.questions.length,
    strategy: session.strategy,
    answeredCount: Object.keys(session.answers.toObject()).length,
    isCompleted: session.isCompleted,
    createdAt: session.createdAt,
    message: session.createdAt.getTime() === session.updatedAt.getTime()
      ? 'Bộ câu hỏi mới đã được tạo cho bạn'
      : 'Tiếp tục bộ câu hỏi đang làm dở'
  });
});

// ==========================================
// 🔒 NEW: Submit Survey Answers
// ==========================================
const submitSurveyAnswers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { answers } = req.body; // { "health_1": 4, "productivity_1": 3, ... }

  // Tìm session active
  const session = await UserSurveySession.findOne({ 
    userId, 
    isCompleted: false 
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy bộ câu hỏi. Vui lòng tạo session mới.'
    });
  }

  // Validate answers
  const questionIds = session.questions.map(q => q.id);
  const invalidAnswers = Object.keys(answers).filter(
    qId => !questionIds.includes(qId)
  );

  if (invalidAnswers.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Có câu hỏi không hợp lệ',
      invalidAnswers
    });
  }

  // Lưu answers vào session
  session.answers = new Map(Object.entries(answers));
  session.isCompleted = true;
  session.completedAt = new Date();
  await session.save();

  res.json({
    success: true,
    message: 'Hoàn thành khảo sát!',
    sessionId: session._id,
    totalAnswers: Object.keys(answers).length,
    completedAt: session.completedAt
  });
});

// ==========================================
// 🔒 NEW: Get Survey Results + Recommendations
// ==========================================
const getUserSurveyResults = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Tìm session completed gần nhất
  const session = await UserSurveySession.findOne({ 
    userId, 
    isCompleted: true 
  }).sort({ completedAt: -1 });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Chưa hoàn thành khảo sát nào'
    });
  }

  // Convert Map → Object
  const answersObj = Object.fromEntries(session.answers);

  // Chạy recommendation engine
  const allHabits = await HabitSuggestion.find();
  const engine = new HabitRecommendationEngine(allHabits, surveyQuestions);
  const recommendations = engine.recommend(answersObj, 5);

  // Lưu vào UserAnalysis
  await UserAnalysis.findOneAndUpdate(
    { userId },
    {
      totalScore: Object.values(recommendations.categoryScores)
        .reduce((a, b) => a + b, 0),
      categoryScores: recommendations.categoryScores,
      userPersona: recommendations.persona,
      completedAt: session.completedAt,
      needsUpdate: false
    },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    sessionId: session._id,
    completedAt: session.completedAt,
    results: recommendations
  });
});

// ==========================================
// 🔒 BONUS: Reset Survey Session
// ==========================================
const resetSurveySession = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await UserSurveySession.deleteOne({ 
    userId, 
    isCompleted: false 
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Không có session nào để xóa'
    });
  }

  res.json({
    success: true,
    message: 'Session đã được reset. Bạn có thể tạo bộ câu hỏi mới.'
  });
});

// ==========================================
// 🔒 BONUS: Get User History
// ==========================================
const getUserSurveyHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sessions = await UserSurveySession.find({ 
    userId 
  }).sort({ createdAt: -1 });

  const analysis = await UserAnalysis.findOne({ userId });

  res.json({
    success: true,
    totalSessions: sessions.length,
    completedSessions: sessions.filter(s => s.isCompleted).length,
    currentPersona: analysis?.userPersona || null,
    sessions: sessions.map(s => ({
      sessionId: s._id,
      strategy: s.strategy,
      totalQuestions: s.questions.length,
      isCompleted: s.isCompleted,
      completedAt: s.completedAt,
      createdAt: s.createdAt
    }))
  });
});

// ==========================================
// 🛠 Helper Function: Select Questions by Strategy
// ==========================================
function selectQuestionsByStrategy(questions, numQuestions, strategy) {
  const questionsByCategory = {
    health: [], productivity: [], learning: [], mindful: [],
    finance: [], digital: [], social: [], fitness: [],
    sleep: [], energy: [], control: []
  };

  questions.forEach(q => {
    if (questionsByCategory[q.category]) {
      questionsByCategory[q.category].push(q);
    }
  });

  const categories = Object.keys(questionsByCategory);
  let selectedQuestions = [];

  if (strategy === 'stratified') {
    // Mỗi category lấy 1 câu
    categories.forEach(category => {
      const categoryQuestions = questionsByCategory[category];
      if (categoryQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
        selectedQuestions.push(categoryQuestions[randomIndex]);
      }
    });

    // Lấy thêm câu random để đủ numQuestions
    const remainingCount = numQuestions - selectedQuestions.length;
    if (remainingCount > 0) {
      const selectedIds = new Set(selectedQuestions.map(q => q.id));
      const remainingQuestions = questions
        .filter(q => !selectedIds.has(q.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount);
      selectedQuestions.push(...remainingQuestions);
    }
  } else {
    // Random thuần
    selectedQuestions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, numQuestions);
  }

  return selectedQuestions.sort(() => Math.random() - 0.5);
}

// ==========================================
// 📤 EXPORTS
// ==========================================
export {
  // Public
  getSurveyQuestions,
  
  // Legacy (keep for backward compatibility)
  getRandomSurveyQuestions,
  
  // New User Survey System
  getUserSurveySession,
  submitSurveyAnswers,
  getUserSurveyResults,
  resetSurveySession,
  getUserSurveyHistory
};