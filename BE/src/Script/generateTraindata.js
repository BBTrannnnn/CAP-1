import fs from 'fs';
import { habitSuggestions } from './seedSurvey.js';

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

function safeAvg(answers, fields) {
  const valid = fields.map(f => answers[f]).filter(v => v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Tính pattern trả lời (để làm features cho ML sau này)
function calculateAnswerPattern(answers) {
  const values = Object.values(answers).filter(v => v !== undefined);
  if (values.length === 0) return { mean: 0, std: 0, lowCount: 0 };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  const lowCount = values.filter(v => v <= 2).length;
  
  return {
    mean: parseFloat(mean.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    lowCount,
    totalAnswered: values.length
  };
}

// ============================================
// 📚 HABIT LIBRARY ORGANIZATION
// ============================================

const habitLibrary = {};

habitSuggestions.forEach(habit => {
  const category = habit.category;
  
  if (!habitLibrary[category]) {
    habitLibrary[category] = [];
  }
  
  habitLibrary[category].push(habit);
});

// Special health subtypes
function getHealthSubtype(answers) {
  const inactive = safeAvg(answers, ['fitness_1', 'fitness_2']) <= 2;
  const poorSleep = (answers.sleep_1 ?? 3) <= 2 || (answers.health_2 ?? 3) <= 2;
  const poorDiet = (answers.health_3 ?? 3) <= 2 || (answers.health_4 ?? 3) <= 2;
  const stressRelated = (answers.mindful_1 ?? 3) <= 2 || (answers.energy_1 ?? 3) <= 2;

  if (inactive) return 'inactive';
  if (poorSleep) return 'poor_sleep';
  if (poorDiet) return 'poor_diet';
  if (stressRelated) return 'stress_related';
  return 'general';
}

habitLibrary.health_subtypes = {
  inactive: [
    ...(habitLibrary.fitness || []),
    ...(habitLibrary.health || []).filter(h => 
      h.name.toLowerCase().includes('tập') || h.name.toLowerCase().includes('vận động')
    )
  ],
  poor_sleep: [
    ...(habitLibrary.sleep || []),
    ...(habitLibrary.health || []).filter(h => 
      h.name.toLowerCase().includes('ngủ')
    )
  ],
  poor_diet: [
    ...(habitLibrary.health || []).filter(h => 
      h.name.toLowerCase().includes('ăn') || 
      h.name.toLowerCase().includes('uống') || 
      h.name.toLowerCase().includes('nước')
    )
  ],
  stress_related: [
    ...(habitLibrary.mindful || []),
    ...(habitLibrary.energy || [])
  ],
  general: habitLibrary.health || []
};

console.log('📚 Đã load habits từ habitSuggestions.js:');
Object.entries(habitLibrary).forEach(([cat, habits]) => {
  if (Array.isArray(habits) && cat !== 'health_subtypes') {
    console.log(`   ${cat}: ${habits.length} habits`);
  }
});
console.log('');

// ============================================
// 🎯 WEIGHTED HABIT SELECTION
// ============================================

/**
 * Chọn habits với trọng số dựa trên:
 * - Score của category (điểm thấp hơn = ưu tiên cao hơn)
 * - Priority của habit (nếu có trong data)
 * - Diversity (tránh quá nhiều habits từ 1 category)
 */
function weightedHabitSelection(habits, categoryScore, numHabits, alreadySelected = []) {
  if (!habits || habits.length === 0) return [];
  
  // Tính weight cho mỗi habit
  const weighted = habits.map(habit => {
    // Base weight: Điểm category thấp = weight cao
    const scoreWeight = (4.0 - categoryScore) * 10;
    
    // Priority weight (giả sử priority từ 1-3, mặc định là 2)
    const priorityWeight = (habit.priority || 2) * 5;
    
    // Diversity penalty: Đã có habits cùng category rồi
    const sameCategory = alreadySelected.filter(h => h.category === habit.category).length;
    const diversityPenalty = sameCategory * 5;
    
    return {
      ...habit,
      weight: scoreWeight + priorityWeight - diversityPenalty + Math.random() * 3 // Random nhẹ
    };
  });
  
  // Sort theo weight và lấy top
  return weighted
    .sort((a, b) => b.weight - a.weight)
    .slice(0, numHabits);
}

/**
 * Đảm bảo diversity: Tối đa 2 habits/category
 */
function ensureDiversity(habits, maxPerCategory = 2) {
  const byCategory = {};
  const result = [];
  
  for (const habit of habits) {
    const cat = habit.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    
    if (byCategory[cat] <= maxPerCategory) {
      result.push(habit);
    }
  }
  
  return result;
}

// ============================================
// 🤖 RECOMMENDATION ENGINE
// ============================================

function generateRecommendations(answers, scores) {
  // 1️⃣ Xác định persona (điểm CAO nhất)
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

  const sortedByScore = Object.entries(scores)
    .filter(([cat]) => personaMap[cat])
    .sort((a, b) => b[1] - a[1]);

  const highestCategory = sortedByScore[0][0];
  const highestScore = sortedByScore[0][1];

  let persona;
  if (highestScore >= 3.0) {
    persona = personaMap[highestCategory];
  } else {
    const lowCount = Object.values(scores).filter(v => v < 3.0).length;
    persona = lowCount >= 6 ? 'balanced-lifestyle' : personaMap[highestCategory];
  }

  // 2️⃣ Tìm weak areas (điểm <= 2.5)
  let lowestCategories = Object.entries(scores)
    .filter(([, val]) => val <= 2.5)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key]) => key);

  // Fallback: Nếu không có weak areas, lấy 2 điểm thấp nhất
  if (lowestCategories.length === 0) {
    lowestCategories = Object.entries(scores)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([key]) => key);
  }

  let recommendedHabits = [];

  // 3️⃣ Lấy 2 habits từ PERSONA (điểm mạnh - để duy trì)
  if (habitLibrary[highestCategory] && habitLibrary[highestCategory].length > 0) {
    const personaHabits = weightedHabitSelection(
      habitLibrary[highestCategory],
      highestScore,
      2,
      recommendedHabits
    );
    recommendedHabits.push(...personaHabits);
  }

  // 4️⃣ Lấy habits từ WEAK AREAS (để cải thiện)
  lowestCategories.forEach((cat, index) => {
    if (recommendedHabits.length >= 5) return;
    
    const numHabits = index === 0 ? 2 : 1; // Category yếu nhất lấy 2, còn lại 1
    
    // Special handling cho health
    if (cat === 'health') {
      const subtype = getHealthSubtype(answers);
      const healthHabits = habitLibrary.health_subtypes?.[subtype] || habitLibrary.health || [];
      
      const chosen = weightedHabitSelection(
        healthHabits,
        scores[cat],
        numHabits,
        recommendedHabits
      );
      recommendedHabits.push(...chosen);
    } 
    // Các categories khác
    else if (habitLibrary[cat] && habitLibrary[cat].length > 0) {
      const chosen = weightedHabitSelection(
        habitLibrary[cat],
        scores[cat],
        numHabits,
        recommendedHabits
      );
      recommendedHabits.push(...chosen);
    }
  });

  // 5️⃣ Fallback: Nếu vẫn thiếu habits
  if (recommendedHabits.length < 3) {
    const allCategories = Object.keys(habitLibrary).filter(k => 
      !k.includes('_subtypes') && Array.isArray(habitLibrary[k]) && habitLibrary[k].length > 0
    );
    
    for (const cat of allCategories) {
      if (recommendedHabits.length >= 5) break;
      
      const remaining = habitLibrary[cat]
        .filter(h => !recommendedHabits.some(r => r.name === h.name));
      
      if (remaining.length > 0) {
        recommendedHabits.push(remaining[0]);
      }
    }
  }

  // 6️⃣ Đảm bảo diversity và remove duplicates
  recommendedHabits = ensureDiversity(recommendedHabits, 2);
  
  // Remove duplicates theo tên
  const uniqueByName = [];
  const seen = new Set();
  for (const h of recommendedHabits) {
    if (!seen.has(h.name)) {
      seen.add(h.name);
      uniqueByName.push(h);
    }
  }
  
  return {
    habits: uniqueByName.slice(0, 5),
    persona,
    highestCategory,
    highestScore,
    lowestCategories
  };
}

// ============================================
// 🎲 TRAINING DATA GENERATION
// ============================================

function generateTrainingData(numSamples = 1000) {
  const allQuestions = [
    'health_1', 'health_2', 'health_3', 'health_4', 'health_5', 'health_6',
    'productivity_1', 'productivity_2', 'productivity_3', 'productivity_4', 'productivity_5', 'productivity_6',
    'learning_1', 'learning_2', 'learning_3', 'learning_4', 'learning_5',
    'mindful_1', 'mindful_2', 'mindful_3', 'mindful_4', 'mindful_5', 'mindful_6',
    'finance_1', 'finance_2', 'finance_3', 'finance_4', 'finance_5',
    'digital_1', 'digital_2', 'digital_3', 'digital_4', 'digital_5', 'digital_6',
    'social_1', 'social_2', 'social_3', 'social_4', 'social_5',
    'fitness_1', 'fitness_2', 'fitness_3', 'fitness_4', 'fitness_5', 'fitness_6',
    'sleep_1', 'sleep_2', 'sleep_3', 'sleep_4', 'sleep_5',
    'energy_1', 'energy_2', 'energy_3', 'energy_4', 'energy_5', 'energy_6',
    'control_1', 'control_2', 'control_3', 'control_4', 'control_5'
  ];

  const data = [];

  // 🎯 Stratified Sampling: Đảm bảo mỗi category có ít nhất 1 câu
  function stratifiedSelection() {
    const priorityCategories = [
      'health', 'productivity', 'learning', 'mindful', 
      'fitness', 'sleep', 'energy', 'digital', 
      'finance', 'social', 'control'
    ];
    
    const selected = [];
    
    // Lấy 1 câu từ mỗi category (11 câu)
    priorityCategories.forEach(cat => {
      const catQuestions = allQuestions.filter(q => q.startsWith(cat + '_'));
      if (catQuestions.length > 0) {
        const randomQ = catQuestions[Math.floor(Math.random() * catQuestions.length)];
        selected.push(randomQ);
      }
    });
    
    // Thêm 1 câu random nữa để đủ 12 câu
    const remaining = allQuestions.filter(q => !selected.includes(q));
    if (remaining.length > 0 && selected.length < 12) {
      selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }
    
    // Shuffle để không theo thứ tự category
    return shuffle(selected);
  }

  for (let i = 0; i < numSamples; i++) {
    // Stratified sampling: 1 câu/category + 1 random
    const selected = stratifiedSelection();

    // Gán giá trị trả lời
    const answers = {};
    allQuestions.forEach(q => {
      if (selected.includes(q)) {
        answers[q] = Math.floor(Math.random() * 4) + 1; // 1–4
      } else {
        answers[q] = undefined;
      }
    });

    // Tính điểm theo category
    const scores = {
      health: parseFloat((safeAvg(answers, ['health_1', 'health_2', 'health_3', 'health_4', 'health_5', 'health_6']) ?? 2.5).toFixed(2)),
      productivity: parseFloat((safeAvg(answers, ['productivity_1', 'productivity_2', 'productivity_3', 'productivity_4', 'productivity_5', 'productivity_6']) ?? 2.5).toFixed(2)),
      learning: parseFloat((safeAvg(answers, ['learning_1', 'learning_2', 'learning_3', 'learning_4', 'learning_5']) ?? 2.5).toFixed(2)),
      mindful: parseFloat((safeAvg(answers, ['mindful_1', 'mindful_2', 'mindful_3', 'mindful_4', 'mindful_5', 'mindful_6']) ?? 2.5).toFixed(2)),
      finance: parseFloat((safeAvg(answers, ['finance_1', 'finance_2', 'finance_3', 'finance_4', 'finance_5']) ?? 2.5).toFixed(2)),
      digital: parseFloat((safeAvg(answers, ['digital_1', 'digital_2', 'digital_3', 'digital_4', 'digital_5', 'digital_6']) ?? 2.5).toFixed(2)),
      social: parseFloat((safeAvg(answers, ['social_1', 'social_2', 'social_3', 'social_4', 'social_5']) ?? 2.5).toFixed(2)),
      fitness: parseFloat((safeAvg(answers, ['fitness_1', 'fitness_2', 'fitness_3', 'fitness_4', 'fitness_5', 'fitness_6']) ?? 2.5).toFixed(2)),
      sleep: parseFloat((safeAvg(answers, ['sleep_1', 'sleep_2', 'sleep_3', 'sleep_4', 'sleep_5']) ?? 2.5).toFixed(2)),
      energy: parseFloat((safeAvg(answers, ['energy_1', 'energy_2', 'energy_3', 'energy_4', 'energy_5', 'energy_6']) ?? 2.5).toFixed(2)),
      control: parseFloat((safeAvg(answers, ['control_1', 'control_2', 'control_3', 'control_4', 'control_5']) ?? 2.5).toFixed(2))
    };

    // Generate recommendations
    const recommendation = generateRecommendations(answers, scores);
    
    // Calculate answer pattern
    const answerPattern = calculateAnswerPattern(answers);

    // 📊 Cấu trúc data chuẩn cho ML
    data.push({
      userId: `user${String(i).padStart(4, '0')}`,
      
      // ✅ Input Features (cho ML training)
      features: {
        scores,
        answerPattern,
        numQuestionsAnswered: selected.length
      },
      
      // ✅ Output Labels (cho ML training)
      labels: {
        persona: recommendation.persona,
        topCategories: [recommendation.highestCategory, ...recommendation.lowestCategories],
        recommendedHabitIds: recommendation.habits.map(h => h.id || h.name),
        recommendedHabitCategories: recommendation.habits.map(h => h.category)
      },
      
      // ✅ Metadata (để debug/analyze)
      metadata: {
        answers,
        selectedQuestions: selected,
        highestCategory: recommendation.highestCategory,
        highestScore: recommendation.highestScore,
        lowestCategories: recommendation.lowestCategories,
        recommendedHabits: recommendation.habits, // Full objects
        timestamp: new Date().toISOString()
      }
    });
  }

  return data;
}

// ============================================
// ✅ VALIDATION
// ============================================

function validateRecommendations(data) {
  const issues = [];
  
  data.forEach((item, idx) => {
    const habits = item.metadata.recommendedHabits;
    const lowestCategories = item.metadata.lowestCategories;
    
    // Check 1: Có đủ habits không?
    if (habits.length < 3) {
      issues.push(`Sample ${idx}: Only ${habits.length} habits`);
    }
    
    // Check 2: Có habits từ weak areas không?
    const habitCategories = habits.map(h => h.category);
    const hasWeakAreaHabits = lowestCategories.some(cat => 
      habitCategories.includes(cat)
    );
    if (!hasWeakAreaHabits && lowestCategories.length > 0) {
      issues.push(`Sample ${idx}: No habits from weak areas ${lowestCategories.join(', ')}`);
    }
    
    // Check 3: Có quá nhiều habits từ 1 category không?
    const categoryCounts = {};
    habitCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(categoryCounts));
    if (maxCount > 2) {
      issues.push(`Sample ${idx}: ${maxCount} habits from same category`);
    }
    
    // Check 4: Có duplicate habits không?
    const uniqueNames = new Set(habits.map(h => h.name));
    if (uniqueNames.size !== habits.length) {
      issues.push(`Sample ${idx}: Has duplicate habits`);
    }
  });
  
  return issues;
}

// ============================================
// 📊 EXPORT & STATISTICS
// ============================================

function exportTrainingData() {
  const data = generateTrainingData(1000);

  console.log('✅ Đã tạo', data.length, 'mẫu dữ liệu\n');

  // Validation
  const issues = validateRecommendations(data);
  if (issues.length > 0) {
    console.log('⚠️  Phát hiện', issues.length, 'vấn đề:');
    issues.slice(0, 5).forEach(issue => console.log(`   ${issue}`));
    if (issues.length > 5) {
      console.log(`   ... và ${issues.length - 5} vấn đề khác`);
    }
    console.log('');
  } else {
    console.log('✅ Validation: Tất cả samples đều hợp lệ\n');
  }

  // Thống kê persona
  const personaStats = {};
  data.forEach(item => {
    personaStats[item.labels.persona] = (personaStats[item.labels.persona] || 0) + 1;
  });

  console.log('📊 Phân bố Persona:');
  Object.entries(personaStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([persona, count]) => {
      const pct = ((count / data.length) * 100).toFixed(1);
      console.log(`   ${persona.padEnd(25)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  // Thống kê habits
  const habitStats = {};
  data.forEach(item => {
    item.metadata.recommendedHabits.forEach(habit => {
      const key = `${habit.name} | ${habit.trackingMode}`;
      habitStats[key] = (habitStats[key] || 0) + 1;
    });
  });

  console.log('\n📊 Top 10 habits được recommend nhiều nhất:');
  Object.entries(habitStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([habit, count]) => {
      const pct = ((count / data.length) * 100).toFixed(1);
      console.log(`   ${habit.padEnd(50)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  // Thống kê diversity
  const diversityStats = data.map(item => {
    const categories = item.metadata.recommendedHabits.map(h => h.category);
    return new Set(categories).size;
  });
  const avgDiversity = diversityStats.reduce((a, b) => a + b, 0) / diversityStats.length;
  
  console.log('\n📊 Diversity Score:');
  console.log(`   Trung bình: ${avgDiversity.toFixed(2)} categories/recommendation`);
  console.log(`   Min: ${Math.min(...diversityStats)} | Max: ${Math.max(...diversityStats)}`);

  // Ví dụ mẫu
  console.log('\n📝 Ví dụ sample:');
  const sample = data[0];
  console.log(JSON.stringify({
    features: sample.features,
    labels: sample.labels,
    metadata: {
      ...sample.metadata,
      recommendedHabits: sample.metadata.recommendedHabits.map(h => ({
        name: h.name,
        category: h.category,
        trackingMode: h.trackingMode
      }))
    }
  }, null, 2));

  // Lưu file
  const path = './src/Script/training_data.json';
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('\n💾 Đã lưu vào', path);

  return data;
}

// Chạy script
exportTrainingData();