import { HabitRecommendationEngine } from '../utils/recommend.js';
import { HabitSuggestion, Question ,UserSurveySession} from '../models/Survey.js';
import asyncHandler from 'express-async-handler';

// Cache
let cachedHabits = null;
let cachedQuestions = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export const getHabitRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Lấy session completed gần nhất
  const session = await UserSurveySession.findOne({
    userId,
    isCompleted: true
  });

  if (!session || !session.answers || session.answers.size === 0) {
    return res.status(400).json({
      success: false,
      message: 'Chưa có câu trả lời để gợi ý thói quen. Vui lòng submit survey trước.'
    });
  }

  // Dùng cache để load habits & questions
  const now = Date.now();
  if (!cachedHabits || !cachedQuestions || now - cacheTime > CACHE_DURATION) {
    const [habitDocs, questionDocs] = await Promise.all([
      HabitSuggestion.find().lean(),
      Question.find().lean()
    ]);

    cachedHabits = habitDocs;
    cachedQuestions = questionDocs;
    cacheTime = now;
  }

  const answersObj = Object.fromEntries(session.answers);

  // Chỉ giữ lại các câu hỏi có trong phần trả lời
  const usedQuestions = cachedQuestions.filter(q => answersObj[q.id] !== undefined);

  // Tạo engine và generate recommendations
  const engine = new HabitRecommendationEngine(cachedHabits, usedQuestions);
  const limit = parseInt(req.query.limit, 10) || 5;
  const recommendations = engine.recommend(answersObj, limit);

  // Thêm metadata
  let metadata = {
    totalAnswered: Object.keys(answersObj).length,
    totalQuestions: usedQuestions.length,
    limit
  };

  try {
    if (typeof engine.getPersona === 'function') metadata.persona = engine.getPersona(answersObj);
    if (typeof engine.calculateScores === 'function') metadata.scores = engine.calculateScores(answersObj);
    if (typeof engine.findWeakAreasFromAnswers === 'function') metadata.weakAreas = engine.findWeakAreasFromAnswers(answersObj);
  } catch (metaErr) {
    console.warn('⚠️ Could not get metadata:', metaErr.message);
  }

  res.json({
    success: true,
    recommendations,
    metadata
  });
});