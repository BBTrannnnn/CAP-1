import { HabitRecommendationEngine } from '../utils/recommend.js';
import { HabitSuggestion, Question } from '../models/Survey.js';

// Cache
let cachedHabits = null;
let cachedQuestions = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export const getHabitRecommendations = async (req, res) => {
  try {
    const { answers } = req.body;

    // 1️⃣ Validate input cơ bản
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'answers phải là object dạng {questionId: value}',
        example: { health_1: 3, productivity_2: 4 }
      });
    }

    const answeredQuestionIds = Object.keys(answers);

    // 2️⃣ Kiểm tra số lượng câu trả lời
    if (answeredQuestionIds.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Cần trả lời ít nhất 3 câu hỏi',
        received: answeredQuestionIds.length
      });
    }

    // 3️⃣ Validate giá trị câu trả lời
    const invalidAnswers = Object.entries(answers).filter(
      ([, value]) => !Number.isInteger(value) || value < 1 || value > 4
    );

    if (invalidAnswers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị câu trả lời phải là số nguyên từ 1-4',
        invalidAnswers: invalidAnswers.map(([key, val]) => ({ [key]: val }))
      });
    }

    // 4️⃣ Load dữ liệu (dùng cache)
    const now = Date.now();
    if (!cachedHabits || !cachedQuestions || now - cacheTime > CACHE_DURATION) {
      const [habitDocs, questionDocs] = await Promise.all([
        HabitSuggestion.find().lean(),
        Question.find().lean()
      ]);

      if (!habitDocs.length || !questionDocs.length) {
        return res.status(404).json({
          success: false,
          message: 'Không có dữ liệu habits hoặc questions trong database',
          habitsCount: habitDocs.length,
          questionsCount: questionDocs.length
        });
      }

      cachedHabits = habitDocs;
      cachedQuestions = questionDocs;
      cacheTime = now;
      console.log('✅ Cache habits & questions refreshed');
    }

    // 5️⃣ Chỉ giữ lại các câu hỏi có trong phần trả lời
    const usedQuestions = cachedQuestions.filter(q => answeredQuestionIds.includes(q.id));

    // 6️⃣ Chuẩn bị danh sách habits
    const habits = cachedHabits.map(h => ({
      ...h,
      triggerConditions: h.triggerConditions || {}
    }));

    // 7️⃣ Chạy recommendation engine
    const engine = new HabitRecommendationEngine(habits, usedQuestions);
    const limit = parseInt(req.query.limit, 10) || 5;
    const recommendations = engine.recommend(answers, limit);

    // 8️⃣ Thêm metadata
    let metadata = {
      totalAnswered: answeredQuestionIds.length,
      totalQuestions: usedQuestions.length,
      limit
    };

    try {
      if (typeof engine.getPersona === 'function') {
        metadata.persona = engine.getPersona(answers);
      }
      if (typeof engine.calculateScores === 'function') {
        metadata.scores = engine.calculateScores(answers);
      }
      if (typeof engine.findWeakAreas === 'function') {
        metadata.weakAreas = engine.findWeakAreas(answers);
      }
    } catch (metaErr) {
      console.warn('⚠️ Could not get metadata:', metaErr.message);
    }

    // 9️⃣ Trả kết quả
    return res.json({
      success: true,
      recommendations,
      metadata
    });

  } catch (err) {
    console.error('❌ Error in getHabitRecommendations:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gợi ý thói quen',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
