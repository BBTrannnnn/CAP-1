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
      control: 0.9
    };

    // Load trained model nếu có
    this.trainedModel = null;
    try {
      const modelPath = './src/Script/trained_model.json';
      const modelData = fs.readFileSync(modelPath, 'utf8');
      this.trainedModel = JSON.parse(modelData);
      console.log('🧠 Loaded trained_model.json successfully');
    } catch (err) {
      console.warn('⚠️ trained_model.json not found → using rule-based logic only');
    }

    // Organize habits by category
    this.habitsByCategory = {};
    this.habitSuggestions.forEach(habit => {
      const cat = habit.category;
      if (!this.habitsByCategory[cat]) {
        this.habitsByCategory[cat] = [];
      }
      this.habitsByCategory[cat].push(habit);
    });
  }

  /**
   * ================================
   * 1️⃣ Tính điểm theo category
   * ================================
   */
  calculateCategoryScores(answers) {
    const categoryScores = {};
    const categoryAnswers = {};

    // Group answers by category
    Object.entries(answers).forEach(([questionId, value]) => {
      const category = questionId.split('_')[0];
      if (!categoryAnswers[category]) {
        categoryAnswers[category] = [];
      }
      categoryAnswers[category].push(value);
    });

    // Calculate average scores
    Object.entries(categoryAnswers).forEach(([category, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      categoryScores[category] = parseFloat(avg.toFixed(2));
    });

    return categoryScores;
  }

  /**
   * ================================
   * 2️⃣ Tìm weak areas
   * ================================
   */
  findWeakAreas(categoryScores) {
    const weakAreas = [];

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score <= 2.5) {
        weakAreas.push({
          category,
          score,
          priority: (this.weights[category] || 1) * (3 - score) // Điểm thấp hơn = priority cao hơn
        });
      }
    });

    // Sort by priority (highest first)
    return weakAreas.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  /**
   * ================================
   * 3️⃣ Xác định persona
   * ================================
   */
  determinePersona(categoryScores) {
    const personaMap = {
      health: 'health-focused',
      productivity: 'productivity-driven',
      learning: 'knowledge-seeker',
      mindful: 'mindful-seeker',
      finance: 'finance-conscious',
      digital: 'balanced-lifestyle',
      social: 'social-connector',
      fitness: 'fitness-enthusiast',
      sleep: 'rest-prioritizer',
      energy: 'energy-optimizer',
      control: 'discipline-master'
    };

    // Tìm category có điểm CAO NHẤT
    const sortedByScore = Object.entries(categoryScores)
      .filter(([cat]) => personaMap[cat])
      .sort((a, b) => b[1] - a[1]);

    if (sortedByScore.length === 0) {
      return 'balanced-lifestyle';
    }

    const highestCategory = sortedByScore[0][0];
    const highestScore = sortedByScore[0][1];

    // Nếu điểm cao nhất >= 3.0 → persona theo category đó
    if (highestScore >= 3.0) {
      return personaMap[highestCategory];
    }

    // Nếu nhiều category < 3.0 → balanced-lifestyle
    const lowCount = Object.values(categoryScores).filter(v => v < 3.0).length;
    if (lowCount >= 6) {
      return 'balanced-lifestyle';
    }

    return personaMap[highestCategory];
  }

  /**
   * ================================
   * 4️⃣ Weighted Habit Selection
   * ================================
   */
  selectHabitsWithWeight(categoryScore, habits, numHabits, alreadySelected = []) {
    if (!habits || habits.length === 0) return [];

    // Calculate weight for each habit
    const weighted = habits.map(habit => {
      // Base weight: Điểm thấp = weight cao
      const scoreWeight = (4.0 - categoryScore) * 10;

      // Priority weight
      const priorityWeight = (habit.priority || 2) * 5;

      // Diversity penalty
      const sameCategory = alreadySelected.filter(h => h.category === habit.category).length;
      const diversityPenalty = sameCategory * 5;

      // ✅ Tracking mode bonus - ưu tiên count hơn check
      const trackingModeBonus = habit.trackingMode === 'count' ? 15 : 0;

      // Random factor
      const randomFactor = Math.random() * 3;

      return {
        ...habit,
        weight: scoreWeight + priorityWeight - diversityPenalty + trackingModeBonus + randomFactor
      };
    });

    // Sort by weight and return top N
    return weighted
      .sort((a, b) => b.weight - a.weight)
      .slice(0, numHabits);
  }

  /**
   * ================================
   * 5️⃣ Generate Habit Recommendations
   * ================================
   */
  generateHabitRecommendations(categoryScores, weakAreas, persona, maxHabits = 5) {
    const recommendedHabits = [];

    // 1️⃣ Lấy 2 habits từ PERSONA (điểm mạnh)
    const highestCategory = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])[0];

    if (highestCategory && this.habitsByCategory[highestCategory[0]]) {
      const personaHabits = this.selectHabitsWithWeight(
        highestCategory[1],
        this.habitsByCategory[highestCategory[0]],
        2,
        recommendedHabits
      );
      recommendedHabits.push(...personaHabits);
    }

    // 2️⃣ Lấy habits từ WEAK AREAS
    weakAreas.forEach((weakArea, index) => {
      if (recommendedHabits.length >= maxHabits) return;

      const category = weakArea.category;
      const numHabits = index === 0 ? 2 : 1; // Category yếu nhất lấy 2, còn lại 1

      if (this.habitsByCategory[category]) {
        const weakHabits = this.selectHabitsWithWeight(
          weakArea.score,
          this.habitsByCategory[category],
          numHabits,
          recommendedHabits
        );
        recommendedHabits.push(...weakHabits);
      }
    });

    // 3️⃣ Fallback: Nếu vẫn thiếu habits
    if (recommendedHabits.length < 3) {
      const allCategories = Object.keys(this.habitsByCategory);
      
      for (const cat of allCategories) {
        if (recommendedHabits.length >= maxHabits) break;
        
        const remaining = this.habitsByCategory[cat].filter(
          h => !recommendedHabits.some(r => r.name === h.name)
        );
        
        if (remaining.length > 0) {
          recommendedHabits.push(remaining[0]);
        }
      }
    }

    // 4️⃣ Remove duplicates và format output
    const uniqueHabits = [];
    const seen = new Set();

    for (const habit of recommendedHabits) {
      if (!seen.has(habit.name)) {
        seen.add(habit.name);
        
        // ✅ Format habit với đầy đủ thông tin tracking
        uniqueHabits.push({
          _id: habit._id,
          name: habit.name,
          description: habit.description,
          category: habit.category,
          difficulty: habit.difficulty,
          frequency: habit.frequency,
          icon: habit.icon,
          color: habit.color,
          tags: habit.tags,
          
          // ✅ Tracking info
          trackingMode: habit.trackingMode || 'check', // check hoặc count
          targetCount: habit.targetCount || null,      // Số lần nếu là count
          unit: habit.unit || null,                     // Đơn vị: lần, phút, ly, km...
          
          // Metadata
          targetPersonas: habit.targetPersonas,
          requiredScore: habit.requiredScore
        });
      }
    }

    return uniqueHabits.slice(0, maxHabits);
  }

  /**
   * ================================
   * 6️⃣ Generate Insights
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
      sleep: 'Giấc ngủ chất lượng là nền tảng cho một ngày năng động.',
      energy: 'Hãy chú ý đến nguồn năng lượng và nghỉ ngơi hợp lý.',
      control: 'Tự chủ và kỷ luật sẽ giúp bạn đạt được mục tiêu.'
    };

    return weakAreas.map(area => ({
      category: area.category,
      message: messages[area.category] || `Cần cải thiện ${area.category}`,
      priority: area.priority
    }));
  }

  /**
   * ================================
   * 7️⃣ Main Recommendation Function
   * ================================
   */
  recommend(answers, maxHabits = 5) {
    // 1. Calculate scores
    const categoryScores = this.calculateCategoryScores(answers);

    // 2. Find weak areas
    const weakAreas = this.findWeakAreas(categoryScores);

    // 3. Determine persona
    const persona = this.determinePersona(categoryScores);

    // 4. Generate habit recommendations
    const habits = this.generateHabitRecommendations(
      categoryScores,
      weakAreas,
      persona,
      maxHabits
    );

    // 5. Generate insights
    const insights = this.generateInsights(categoryScores, weakAreas);

    // 6. Return recommendations
    return {
      persona,
      categoryScores,
      weakAreas,
      insights,
      habits,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ================================
   * Helper Methods for Controller
   * ================================
   */
  getPersona(answers) {
    const categoryScores = this.calculateCategoryScores(answers);
    return this.determinePersona(categoryScores);
  }

  calculateScores(answers) {
    return this.calculateCategoryScores(answers);
  }

  findWeakAreasFromAnswers(answers) {
    const categoryScores = this.calculateCategoryScores(answers);
    return this.findWeakAreas(categoryScores);
  }
}

export { HabitRecommendationEngine };