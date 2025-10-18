import fs from 'fs';

class HabitRecommendationEngine {
  constructor(habitSuggestions, questions) {
    this.habitSuggestions = habitSuggestions;
    this.questions = questions;

    // ⚙️ Trọng số ưu tiên theo danh mục
    this.weights = {
      health: 1.2,
      fitness: 1.1,
      productivity: 1.0,
      learning: 0.9,
      mindful: 1.0,
      finance: 0.8,
      digital: 0.9,
      social: 0.8,
      sleep: 1.1,
      energy: 0.9,
    };

    this.trainedModel = {};
    try {
      const modelData = fs.readFileSync('src/Script/trained_model.json', 'utf8');
      this.trainedModel = JSON.parse(modelData);
      console.log('🧠 Đã tải trained_model.json thành công');
    } catch (err) {
      console.warn('⚠️ Không tìm thấy trained_model.json → dùng rule-based logic');
    }
  }

  /**
   * ================================
   * 1️⃣ Phân tích câu trả lời người dùng
   * ================================
   */
  analyzeAnswers(answers) {
    const categoryScores = {};
    const weakAreas = {};

    // Gom điểm theo category
    Object.entries(answers).forEach(([questionId, value]) => {
      const category = questionId.split('_')[0];
      if (!categoryScores[category]) categoryScores[category] = [];
      categoryScores[category].push(value);
    });

    // Tính trung bình và xác định điểm yếu
    const result = {};
    Object.entries(categoryScores).forEach(([category, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      result[category] = Number(avg.toFixed(2));

      if (avg <= 2) {
        weakAreas[category] = {
          category,
          score: avg,
          priority: this.weights[category] || 1,
        };
      }
    });

    const sortedWeak = Object.values(weakAreas).sort((a, b) => b.priority - a.priority);
    return { categoryScores: result, weakAreas: sortedWeak };
  }

  /**
   * ================================
   * 2️⃣ Xác định persona
   * ================================
   */
  determinePersona(categoryScores) {
    const personaScores = {
      'health-focused': 0,
      'productivity-driven': 0,
      'knowledge-seeker': 0,
      'mindful-seeker': 0,
      'finance-conscious': 0,
      'balanced-lifestyle': 0,
      'fitness-driven': 0,
      'community-oriented': 0,
    };

    if (categoryScores.health <= 2 || categoryScores.fitness <= 2)
      personaScores['health-focused'] += 30;

    if (categoryScores.productivity <= 2)
      personaScores['productivity-driven'] += 30;

    if (categoryScores.learning <= 2)
      personaScores['knowledge-seeker'] += 30;

    if (categoryScores.mindful <= 2)
      personaScores['mindful-seeker'] += 30;

    if (categoryScores.finance <= 2)
      personaScores['finance-conscious'] += 30;

    if (categoryScores.social <= 2)
      personaScores['community-oriented'] += 25;

    const mediumCount = Object.values(categoryScores).filter(
      (v) => v > 2 && v < 3.5
    ).length;

    if (mediumCount >= 5) personaScores['balanced-lifestyle'] += 25;

    if (categoryScores.fitness <= 2)
      personaScores['fitness-driven'] += 20;

    return Object.entries(personaScores).sort(([, a], [, b]) => b - a)[0][0];
  }

  /**
   * ================================
   * 3️⃣ Tìm habit phù hợp (Rule-based)
   * ================================
   */
  findMatchingHabits(answers, categoryScores) {
    const matchingHabits = [];

    this.habitSuggestions.forEach((habit) => {
      let score = 0;
      let matchedConditions = 0;

      Object.entries(habit.triggerConditions).forEach(([questionId, targetValues]) => {
        if (answers[questionId] && targetValues.includes(answers[questionId])) {
          matchedConditions++;
          score += 10;
        }
      });

      const category = habit.category;
      const userScore = categoryScores[category] ?? 3;

      if (userScore <= 2) score += 20;
      else if (userScore <= 2.5) score += 10;

      const diffBonus = { easy: 15, medium: 10, hard: 5 };
      score += diffBonus[habit.difficulty] || 0;

      if (matchedConditions > 0)
        matchingHabits.push({ ...habit, score, matchedConditions });
    });

    return matchingHabits.sort((a, b) => b.score - a.score);
  }

  /**
   * ================================
   * 4️⃣ Đa dạng danh mục thói quen
   * ================================
   */
  diversifyRecommendations(habits, max = 5) {
    const selected = [];
    const count = {};

    for (const h of habits) {
      const c = h.category;
      if ((count[c] || 0) < 2) {
        selected.push(h);
        count[c] = (count[c] || 0) + 1;
      }
      if (selected.length >= max) break;
    }

    if (selected.length < max) {
      for (const h of habits) {
        if (!selected.includes(h)) selected.push(h);
        if (selected.length >= max) break;
      }
    }
    return selected;
  }

  /**
   * ================================
   * 5️⃣ Sinh insights cá nhân
   * ================================
   */
  generateInsights(categoryScores, weakAreas) {
    const messages = {
      health: 'Hãy chú ý đến sức khỏe. Uống đủ nước và ngủ sớm hơn nhé.',
      productivity: 'Thử lập kế hoạch ngày và áp dụng Pomodoro để làm việc hiệu quả.',
      learning: 'Dành ít nhất 20 phút mỗi ngày để học hoặc đọc sách.',
      mindful: 'Hãy thử thiền, hít thở sâu và thư giãn đầu óc.',
      finance: 'Theo dõi chi tiêu hàng ngày giúp bạn quản lý tài chính tốt hơn.',
      digital: 'Giảm thời gian màn hình sẽ giúp bạn tập trung và ngủ ngon hơn.',
      social: 'Tăng cường kết nối với bạn bè, gia đình giúp bạn cân bằng cảm xúc.',
      fitness: 'Hãy vận động nhẹ nhàng mỗi ngày để duy trì năng lượng.',
    };

    return weakAreas.map((a) => ({
      category: a.category,
      message: messages[a.category],
      priority: a.priority,
    }));
  }

  /**
   * ================================
   * 6️⃣ Hàm chính: Gợi ý thói quen
   * ================================
   */
  recommend(answers, maxHabits = 5) {
    const { categoryScores, weakAreas } = this.analyzeAnswers(answers);
    const persona = this.determinePersona(categoryScores);

    let recommendations = this.findMatchingHabits(answers, categoryScores);
    let selectedHabits = this.diversifyRecommendations(recommendations, maxHabits);

    // ✅ Kết hợp với AI model
    if (this.trainedModel[persona]) {
      const aiHabits = this.trainedModel[persona].topHabits.map((name) => ({
        name,
        source: 'ai-model',
        score: 100,
        category: 'general',
      }));
      selectedHabits = [...selectedHabits, ...aiHabits];
    }

    const insights = this.generateInsights(categoryScores, weakAreas);

    return {
      persona,
      categoryScores,
      weakAreas,
      insights,
      habits: selectedHabits.slice(0, maxHabits),
      timestamp: new Date().toISOString(),
    };
  }
}

export { HabitRecommendationEngine };