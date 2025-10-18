import { HabitRecommendationEngine } from '../utils/recommend.js';
import { HabitSuggestion, Question } from '../models/Survey.js';

export const getHabitRecommendations = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({
        message: 'answers phải là object dạng {questionId: value}',
        received: answers
      });
    }

    const [habitDocs, questionDocs] = await Promise.all([
      HabitSuggestion.find().lean(),
      Question.find().lean()
    ]);

    if (!habitDocs.length || !questionDocs.length) {
      return res.status(404).json({
        message: 'Không có dữ liệu habits hoặc questions',
        habitsCount: habitDocs.length,
        questionsCount: questionDocs.length
      });
    }

    const habits = habitDocs.map(h => ({ ...h, triggerConditions: h.triggerConditions || {} }));
    const engine = new HabitRecommendationEngine(habits, questionDocs);
    const limit = parseInt(req.query.limit, 10) || 5;
    const recommendations = engine.recommend(answers, limit);

    return res.json({ recommendations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi gợi ý thói quen', error: err.message });
  }
};
