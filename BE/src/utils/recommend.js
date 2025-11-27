import fs from 'fs';

class HabitRecommendationEngine {
  constructor(habitSuggestions, questions) {
    this.habitSuggestions = habitSuggestions;
    this.questions = questions;

    // ⚙️ Base category weights
    this.categoryWeights = {
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

    // 🎯 Demographics-based category preferences
    this.demographicPreferences = {
      ageGroup: {
        teens: {
          fitness: 1.3,
          learning: 1.4,
          social: 1.3,
          digital: 1.2,
          mindful: 0.7,
          finance: 0.6
        },
        young_adult: {
          productivity: 1.3,
          learning: 1.2,
          finance: 1.1,
          fitness: 1.2,
          social: 1.1,
          health: 1.0
        },
        adult: {
          productivity: 1.4,
          finance: 1.3,
          health: 1.3,
          control: 1.2,
          sleep: 1.1,
          learning: 1.0
        },
        middle_aged: {
          health: 1.5,
          finance: 1.3,
          mindful: 1.3,
          sleep: 1.3,
          energy: 1.2,
          fitness: 1.1
        }
      },
      gender: {
        male: {
          fitness: 1.2,
          productivity: 1.1,
          control: 1.1,
          finance: 1.1
        },
        female: {
          mindful: 1.3,
          social: 1.2,
          health: 1.2,
          learning: 1.1
        }
      }
    };

    // 🎓 Experience level detection thresholds
    this.experienceThresholds = {
      beginner: { avgScore: 2.0, difficulty: ['easy'] },
      intermediate: { avgScore: 2.5, difficulty: ['easy', 'medium'] },
      advanced: { avgScore: 3.0, difficulty: ['easy', 'medium', 'hard'] }
    };

    // 📊 Tracking mode preferences by experience
    this.trackingModePreferences = {
      beginner: { check: 1.5, count: 0.8 },
      intermediate: { check: 1.0, count: 1.2 },
      advanced: { check: 0.8, count: 1.5 }
    };

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

  calculatePersonalizedScore(habit, userProfile, categoryScore, experienceLevel) {
    let score = 0;

    const weaknessWeight = (4.0 - categoryScore) * 10;
    score += weaknessWeight;

    const demographicsScore = this.calculateDemographicsScore(habit, userProfile);
    score += demographicsScore;

    const difficultyScore = this.calculateDifficultyScore(habit, experienceLevel);
    score += difficultyScore;

    const trackingScore = this.calculateTrackingScore(habit, experienceLevel);
    score += trackingScore;

    const priorityScore = (habit.priority || 2) * 5;
    score += priorityScore;

    score += Math.random() * 3;

    return score;
  }

  calculateDemographicsScore(habit, userProfile) {
    let score = 0;

    if (userProfile.ageGroup && habit.targetAgeGroups) {
      if (habit.targetAgeGroups.includes(userProfile.ageGroup)) {
        score += 20;

        const agePrefs = this.demographicPreferences.ageGroup[userProfile.ageGroup] || {};
        const categoryBonus = (agePrefs[habit.category] || 1.0) * 10;
        score += categoryBonus;
      } else {
        score -= 10;
      }
    }

    if (userProfile.gender && habit.targetGenders) {
      if (habit.targetGenders.includes(userProfile.gender)) {
        score += 15;

        const genderPrefs = this.demographicPreferences.gender[userProfile.gender] || {};
        const categoryBonus = (genderPrefs[habit.category] || 1.0) * 8;
        score += categoryBonus;
      } else {
        score -= 5;
      }
    }

    return score;
  }

  calculateDifficultyScore(habit, experienceLevel) {
    const allowedDifficulties = this.experienceThresholds[experienceLevel].difficulty;

    if (allowedDifficulties.includes(habit.difficulty)) {
      if (experienceLevel === 'beginner' && habit.difficulty === 'easy') {
        return 25;
      }
      if (experienceLevel === 'intermediate' && habit.difficulty === 'medium') {
        return 20;
      }
      if (experienceLevel === 'advanced' && habit.difficulty === 'hard') {
        return 15;
      }
      return 10;
    }

    return -15;
  }

  calculateTrackingScore(habit, experienceLevel) {
    const trackingMode = habit.trackingMode || 'check';
    const preferences = this.trackingModePreferences[experienceLevel];
    
    const baseScore = (preferences[trackingMode] || 1.0) * 12;
    
    if (trackingMode === 'count' && habit.targetCount) {
      return baseScore + 8;
    }
    
    return baseScore;
  }

  determineExperienceLevel(categoryScores) {
    const scores = Object.values(categoryScores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const highScoreCount = scores.filter(s => s >= 3.0).length;

    if (avgScore >= 3.2 && highScoreCount >= 6) {
      return 'advanced';
    } else if (avgScore >= 2.5 || (avgScore >= 2.3 && highScoreCount >= 4)) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  calculateCategoryScores(answers) {
    const categoryScores = {};
    const categoryAnswers = {};

    Object.entries(answers).forEach(([questionId, value]) => {
      const category = questionId.split('_')[0];
      if (!categoryAnswers[category]) {
        categoryAnswers[category] = [];
      }
      categoryAnswers[category].push(value);
    });

    Object.entries(categoryAnswers).forEach(([category, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      categoryScores[category] = parseFloat(avg.toFixed(2));
    });

    return categoryScores;
  }

  findWeakAreas(categoryScores, userProfile) {
    const weakAreas = [];

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score <= 2.5) {
        let demographicWeight = 1.0;
        
        if (userProfile.ageGroup) {
          const agePrefs = this.demographicPreferences.ageGroup[userProfile.ageGroup] || {};
          demographicWeight *= (agePrefs[category] || 1.0);
        }
        
        if (userProfile.gender) {
          const genderPrefs = this.demographicPreferences.gender[userProfile.gender] || {};
          demographicWeight *= (genderPrefs[category] || 1.0);
        }

        const basePriority = (this.categoryWeights[category] || 1) * (3 - score);
        const adjustedPriority = basePriority * demographicWeight;

        weakAreas.push({
          category,
          score,
          priority: adjustedPriority,
          demographicWeight
        });
      }
    });

    return weakAreas.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  determinePersona(categoryScores, userProfile) {
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

    const adjustedScores = {};
    Object.entries(categoryScores).forEach(([category, score]) => {
      let adjustment = 1.0;
      
      if (userProfile.ageGroup) {
        const agePrefs = this.demographicPreferences.ageGroup[userProfile.ageGroup] || {};
        adjustment *= (agePrefs[category] || 1.0);
      }
      
      if (userProfile.gender) {
        const genderPrefs = this.demographicPreferences.gender[userProfile.gender] || {};
        adjustment *= (genderPrefs[category] || 1.0);
      }
      
      adjustedScores[category] = score * adjustment;
    });

    const sortedByScore = Object.entries(adjustedScores)
      .filter(([cat]) => personaMap[cat])
      .sort((a, b) => b[1] - a[1]);

    if (sortedByScore.length === 0) {
      return 'balanced-lifestyle';
    }

    const highestCategory = sortedByScore[0][0];
    const highestScore = sortedByScore[0][1];

    if (highestScore >= 3.0) {
      return personaMap[highestCategory];
    }

    const lowCount = Object.values(categoryScores).filter(v => v < 3.0).length;
    if (lowCount >= 6) {
      return 'balanced-lifestyle';
    }

    return personaMap[highestCategory];
  }

  selectPersonalizedHabits(categoryScore, habits, numHabits, userProfile, experienceLevel, alreadySelected = []) {
    if (!habits || habits.length === 0) return [];

    const scoredHabits = habits.map(habit => {
      const personalizedScore = this.calculatePersonalizedScore(
        habit,
        userProfile,
        categoryScore,
        experienceLevel
      );

      const sameCategory = alreadySelected.filter(h => h.category === habit.category).length;
      const diversityPenalty = sameCategory * 8;

      return {
        ...habit,
        personalizedScore: personalizedScore - diversityPenalty
      };
    });

    return scoredHabits
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, numHabits);
  }

  generatePersonalizedRecommendations(categoryScores, weakAreas, persona, userProfile, experienceLevel, maxHabits = 5) {
    const recommendedHabits = [];

    // 🔧 FIXED: Dynamic balance dựa trên avgScore
    const avgScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.values(categoryScores).length;
    
    let personaHabitsCount, weakHabitsPerArea;
    
    if (avgScore >= 3.0) {
      // User overall tốt → Maintain strengths
      personaHabitsCount = 2;
      weakHabitsPerArea = [1, 1, 1]; // 1 habit mỗi weak area
    } else if (avgScore >= 2.5) {
      // User trung bình → Balance
      personaHabitsCount = 1;
      weakHabitsPerArea = [2, 1, 1];
    } else {
      // User yếu → Focus improve
      personaHabitsCount = 1;
      weakHabitsPerArea = [2, 2, 0]; // Focus top 2 weak areas
    }

    // 1️⃣ Lấy habits từ PERSONA
    const highestCategory = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])[0];

    if (highestCategory && this.habitsByCategory[highestCategory[0]]) {
      const personaHabits = this.selectPersonalizedHabits(
        highestCategory[1],
        this.habitsByCategory[highestCategory[0]],
        personaHabitsCount,
        userProfile,
        experienceLevel,
        recommendedHabits
      );
      recommendedHabits.push(...personaHabits);
    }

    // 2️⃣ Lấy habits từ WEAK AREAS
    weakAreas.forEach((weakArea, index) => {
      if (recommendedHabits.length >= maxHabits) return;
      
      const numHabits = weakHabitsPerArea[index] || 0;
      if (numHabits === 0) return;

      const category = weakArea.category;

      if (this.habitsByCategory[category]) {
        const weakHabits = this.selectPersonalizedHabits(
          weakArea.score,
          this.habitsByCategory[category],
          numHabits,
          userProfile,
          experienceLevel,
          recommendedHabits
        );
        recommendedHabits.push(...weakHabits);
      }
    });

    // 3️⃣ Fallback nếu thiếu habits
    if (recommendedHabits.length < 3) {
      const allCategories = Object.keys(this.habitsByCategory);
      
      for (const cat of allCategories) {
        if (recommendedHabits.length >= maxHabits) break;
        
        const remaining = this.habitsByCategory[cat].filter(
          h => !recommendedHabits.some(r => r.name === h.name)
        );
        
        if (remaining.length > 0) {
          const scored = remaining.map(habit => ({
            ...habit,
            score: this.calculatePersonalizedScore(
              habit,
              userProfile,
              categoryScores[cat] || 2.5,
              experienceLevel
            )
          }));
          
          scored.sort((a, b) => b.score - a.score);
          recommendedHabits.push(scored[0]);
        }
      }
    }

    // 4️⃣ Remove duplicates & format
    const uniqueHabits = [];
    const seen = new Set();

    for (const habit of recommendedHabits) {
      if (!seen.has(habit.name)) {
        seen.add(habit.name);
        
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
          trackingMode: habit.trackingMode || 'check',
          targetCount: habit.targetCount || null,
          unit: habit.unit || null,
          targetPersonas: habit.targetPersonas,
          requiredScore: habit.requiredScore,
          
          personalizedScore: habit.personalizedScore,
          matchReason: this.getMatchReason(habit, userProfile, experienceLevel)
        });
      }
    }

    return uniqueHabits.slice(0, maxHabits);
  }

  /**
   * ================================
   * 💬 GET MATCH REASON (UPDATED)
   * ================================
   */
  getMatchReason(habit, userProfile, experienceLevel) {
    const reasons = [];

    // 🆕 AGE & GENDER LABELS
    const ageLabels = {
      teens: 'thanh thiếu niên (13-17 tuổi)',
      young_adult: 'thanh niên (18-29 tuổi)',
      adult: 'trưởng thành (30-49 tuổi)',
      middle_aged: 'trung niên (50+ tuổi)'
    };

    const genderLabels = {
      male: 'nam',
      female: 'nữ'
    };

    // Age match với label đẹp
    if (habit.targetAgeGroups && habit.targetAgeGroups.includes(userProfile.ageGroup)) {
      const ageLabel = ageLabels[userProfile.ageGroup] || userProfile.ageGroup;
      reasons.push(`Phù hợp với độ tuổi ${ageLabel}`);
    }

    // Gender match với label đẹp
    if (habit.targetGenders && habit.targetGenders.includes(userProfile.gender)) {
      const genderLabel = genderLabels[userProfile.gender] || userProfile.gender;
      reasons.push(`Phù hợp với giới tính ${genderLabel}`);
    }

    // Difficulty match
    if (experienceLevel === 'beginner' && habit.difficulty === 'easy') {
      reasons.push('Dễ bắt đầu cho người mới');
    } else if (experienceLevel === 'intermediate' && habit.difficulty === 'medium') {
      reasons.push('Phù hợp với trình độ trung bình');
    } else if (experienceLevel === 'advanced' && habit.difficulty === 'hard') {
      reasons.push('Thử thách phù hợp với trình độ cao');
    }

    // Tracking mode
    if (habit.trackingMode === 'count' && habit.targetCount) {
      reasons.push(`Mục tiêu rõ ràng: ${habit.targetCount} ${habit.unit || 'lần'}`);
    }

    // Nếu không có reason nào, return fallback
    if (reasons.length === 0) {
      return 'Thói quen được gợi ý cho bạn';
    }

    return reasons.join(' • ');
  }

  /**
   * ================================
   * 🤖 GENERATE AI-POWERED INSIGHTS (GROQ API)
   * ================================
   */
  async generatePersonalizedInsights(categoryScores, weakAreas, userProfile, experienceLevel, recommendedHabits) {
    try {
      // Build context cho AI
      const ageLabels = {
        teens: 'thanh thiếu niên (13-17 tuổi)',
        young_adult: 'thanh niên (18-29 tuổi)',
        adult: 'trưởng thành (30-49 tuổi)',
        middle_aged: 'trung niên (50+ tuổi)'
      };

      const genderLabels = {
        male: 'nam',
        female: 'nữ'
      };

      const experienceLevelLabels = {
        beginner: 'người mới bắt đầu',
        intermediate: 'trình độ trung bình',
        advanced: 'trình độ cao'
      };

      const prompt = `Bạn là chuyên gia tư vấn thói quen sống. Hãy tạo 3-5 insights (lời khuyên) ngắn gọn, thân thiện, và thực tế cho user sau:

**Thông tin user:**
- Độ tuổi: ${ageLabels[userProfile.ageGroup] || userProfile.ageGroup}
- Giới tính: ${genderLabels[userProfile.gender] || userProfile.gender}
- Trình độ: ${experienceLevelLabels[experienceLevel] || experienceLevel}

**Điểm số categories (1-4):**
${Object.entries(categoryScores).map(([cat, score]) => `- ${cat}: ${score}`).join('\n')}

**Top 3 điểm yếu cần cải thiện:**
${weakAreas.map((area, i) => `${i + 1}. ${area.category} (điểm ${area.score})`).join('\n')}

**Habits được gợi ý:**
${recommendedHabits.map((h, i) => `${i + 1}. ${h.name} (${h.category})`).join('\n')}

**YÊU CẦU:**
- Trả về JSON array với format: [{"category": "string", "message": "string", "priority": number}]
- Mỗi insight: 1-2 câu ngắn gọn, động viên, dễ hiểu
- Ưu tiên insights cho weak areas
- Thêm 1-2 insights chung về demographics (tuổi/giới tính)
- Priority: 1-5 (5 = quan trọng nhất)
- CHỈ trả về JSON, KHÔNG có text khác

**VÍ DỤ OUTPUT:**
[
  {"category": "mindful", "message": "Hãy thử thiền 5-10 phút mỗi ngày để giảm căng thẳng và tăng sự tập trung.", "priority": 5},
  {"category": "fitness", "message": "Bắt đầu với vận động nhẹ nhàng như đi bộ 20-30 phút mỗi ngày.", "priority": 4},
  {"category": "general", "message": "Ở độ tuổi của bạn, hãy xây dựng thói quen bền vững cho sự nghiệp và sức khỏe lâu dài.", "priority": 3}
]`;

      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // Fast & good model
          messages: [
            {
              role: 'system',
              content: 'Bạn là chuyên gia tư vấn thói quen sống. Luôn trả về JSON hợp lệ, ngắn gọn, thực tế, và động viên.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
          top_p: 1
        })
      });

      if (!response.ok) {
        console.error('❌ Groq API error:', response.status);
        return this.getFallbackInsights(weakAreas, userProfile, experienceLevel);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '[]';
      
      // Parse JSON từ AI response
      // Remove markdown code blocks nếu có
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const insights = JSON.parse(cleanedResponse);
      
      // Validate insights
      if (!Array.isArray(insights) || insights.length === 0) {
        console.warn('⚠️ Invalid AI insights format, using fallback');
        return this.getFallbackInsights(weakAreas, userProfile, experienceLevel);
      }

      console.log('✅ AI-generated insights:', insights.length);
      return insights;

    } catch (error) {
      console.error('❌ Error generating AI insights:', error.message);
      return this.getFallbackInsights(weakAreas, userProfile, experienceLevel);
    }
  }

  /**
   * ================================
   * 🔄 FALLBACK INSIGHTS (nếu AI fails)
   * ================================
   */
  getFallbackInsights(weakAreas, userProfile, experienceLevel) {
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

    const insights = weakAreas.map(area => ({
      category: area.category,
      message: messages[area.category] || `Cần cải thiện ${area.category}`,
      priority: area.priority
    }));

    if (userProfile.ageGroup === 'young_adult') {
      insights.push({
        category: 'general',
        message: 'Ở tuổi của bạn, hãy tập trung xây dựng thói quen bền vững cho sự nghiệp và tài chính.',
        priority: 5
      });
    } else if (userProfile.ageGroup === 'middle_aged') {
      insights.push({
        category: 'general',
        message: 'Sức khỏe và cân bằng cuộc sống là ưu tiên hàng đầu ở giai đoạn này.',
        priority: 5
      });
    }

    if (experienceLevel === 'beginner') {
      insights.push({
        category: 'tips',
        message: 'Bắt đầu với những thói quen đơn giản và dễ thực hiện. Hãy kiên trì!',
        priority: 4
      });
    }

    return insights;
  }

  async recommend(answers, userProfile, maxHabits = 5) {
    const categoryScores = this.calculateCategoryScores(answers);
    const experienceLevel = this.determineExperienceLevel(categoryScores);
    const weakAreas = this.findWeakAreas(categoryScores, userProfile);
    const persona = this.determinePersona(categoryScores, userProfile);

    const habits = this.generatePersonalizedRecommendations(
      categoryScores,
      weakAreas,
      persona,
      userProfile,
      experienceLevel,
      maxHabits
    );

    // 🤖 Generate AI-powered insights
    const insights = await this.generatePersonalizedInsights(
      categoryScores,
      weakAreas,
      userProfile,
      experienceLevel,
      habits
    );

    return {
      persona,
      experienceLevel,
      categoryScores,
      weakAreas,
      insights,
      habits,
      userProfile,
      timestamp: new Date().toISOString(),
      
      personalizationSummary: {
        ageGroup: userProfile.ageGroup,
        gender: userProfile.gender,
        experienceLevel,
        totalHabits: habits.length,
        avgDifficulty: this.calculateAvgDifficulty(habits),
        trackingModes: this.getTrackingModeDistribution(habits)
      }
    };
  }

  calculateAvgDifficulty(habits) {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const avg = habits.reduce((sum, h) => sum + (difficultyMap[h.difficulty] || 2), 0) / habits.length;
    return avg < 1.5 ? 'easy' : avg < 2.5 ? 'medium' : 'hard';
  }

  getTrackingModeDistribution(habits) {
    const dist = { check: 0, count: 0 };
    habits.forEach(h => {
      dist[h.trackingMode || 'check']++;
    });
    return dist;
  }
}

export { HabitRecommendationEngine };