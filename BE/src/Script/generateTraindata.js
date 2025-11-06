import fs from 'fs';
import { habitSuggestions } from './seedSurvey.js';

function safeAvg(answers, fields) {
  const valid = fields.map(f => answers[f]).filter(v => v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

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

// 📚 Tổ chức habits theo category
const habitLibrary = {};

habitSuggestions.forEach(habit => {
  const category = habit.category;
  
  if (!habitLibrary[category]) {
    habitLibrary[category] = [];
  }
  
  habitLibrary[category].push(habit);
});

// ✅ FIX: Special health subtypes - filter theo category thực tế
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

// -------------------------------
// 🎲 TẠO DỮ LIỆU TRAINING
// -------------------------------

function generateTrainingData(numSamples = 1000) {
  const allQuestions = [
    // Health (6 questions)
    'health_1', 'health_2', 'health_3', 'health_4', 'health_5', 'health_6',
    // Productivity (6 questions)
    'productivity_1', 'productivity_2', 'productivity_3', 'productivity_4', 'productivity_5', 'productivity_6',
    // Learning (5 questions)
    'learning_1', 'learning_2', 'learning_3', 'learning_4', 'learning_5',
    // Mindful (6 questions)
    'mindful_1', 'mindful_2', 'mindful_3', 'mindful_4', 'mindful_5', 'mindful_6',
    // Finance (5 questions)
    'finance_1', 'finance_2', 'finance_3', 'finance_4', 'finance_5',
    // Digital (6 questions)
    'digital_1', 'digital_2', 'digital_3', 'digital_4', 'digital_5', 'digital_6',
    // Social (5 questions)
    'social_1', 'social_2', 'social_3', 'social_4', 'social_5',
    // Fitness (6 questions)
    'fitness_1', 'fitness_2', 'fitness_3', 'fitness_4', 'fitness_5', 'fitness_6',
    // Sleep (5 questions)
    'sleep_1', 'sleep_2', 'sleep_3', 'sleep_4', 'sleep_5',
    // Energy (6 questions)
    'energy_1', 'energy_2', 'energy_3', 'energy_4', 'energy_5', 'energy_6',
    // Control (5 questions)
    'control_1', 'control_2', 'control_3', 'control_4', 'control_5'
  ];

  const data = [];

  function shuffle(array) {
  const arr = [...array]; // copy mảng gốc
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]; // Hoán đổi ngẫu nhiên
  }
  return arr;
}

  for (let i = 0; i < numSamples; i++) {
    // Chọn ngẫu nhiên 20-35 câu hỏi (từ 61 câu)
    const numQuestions = 12;
    const selected = shuffle(allQuestions).slice(0, numQuestions);

    // Gán giá trị trả lời
    const answers = {};
    allQuestions.forEach(q => {
      if (selected.includes(q)) {
        answers[q] = Math.floor(Math.random() * 4) + 1; // 1–4
      } else {
        answers[q] = undefined;
      }
    });

    // -------------------------------
    // 4️⃣ TÍNH ĐIỂM THEO CATEGORY
    // -------------------------------
    const score = {
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

    // -------------------------------
    // 5️⃣ XÁC ĐỊNH PERSONA (dựa trên điểm CAO)
    // -------------------------------
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
    const sortedByScore = Object.entries(score)
      .filter(([cat]) => personaMap[cat])
      .sort((a, b) => b[1] - a[1]);

    const highestCategory = sortedByScore[0][0];
    const highestScore = sortedByScore[0][1];

    let persona;
    if (highestScore >= 3.0) {
      persona = personaMap[highestCategory];
    } else {
      const lowCount = Object.values(score).filter(v => v < 3.0).length;
      persona = lowCount >= 6 ? 'balanced-lifestyle' : personaMap[highestCategory];
    }

    // -------------------------------
    // 6️⃣ GỢI Ý HABITS - MIX từ PERSONA + WEAK AREAS
    // -------------------------------
    
    // Tìm weak areas (điểm <= 2.5)
    const lowestCategories = Object.entries(score)
      .filter(([, val]) => val <= 2.5)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([key]) => key);

    // Nếu không có weak areas, lấy 2 điểm thấp nhất
    if (lowestCategories.length === 0) {
      lowestCategories.push(
        ...Object.entries(score)
          .sort((a, b) => a[1] - b[1])
          .slice(0, 2)
          .map(([key]) => key)
      );
    }

    let recommendedHabits = [];
    // We will store full habit objects in recommendedHabits to include trackingMode and related fields

    // 🔥 1️⃣ Lấy 2 HABITS TỪ PERSONA (điểm mạnh)
    if (habitLibrary[highestCategory] && habitLibrary[highestCategory].length > 0) {
      const personaHabits = habitLibrary[highestCategory]
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      recommendedHabits.push(...personaHabits);
    }

    // 🔥 2️⃣ Lấy 2-3 HABITS TỪ WEAK AREAS (để cải thiện)
    lowestCategories.forEach((cat, index) => {
      if (recommendedHabits.length >= 5) return;
      
      const numHabits = index === 0 ? 2 : 1;
      
      // Special handling cho health
      if (cat === 'health') {
        const subtype = getHealthSubtype(answers);
        const healthHabits = habitLibrary.health_subtypes?.[subtype] || habitLibrary.health || [];
        
        const chosen = healthHabits
          .sort(() => Math.random() - 0.5)
          .slice(0, numHabits);
        recommendedHabits.push(...chosen);
      } 
      // Các categories khác
      else if (habitLibrary[cat] && habitLibrary[cat].length > 0) {
        const chosen = habitLibrary[cat]
          .sort(() => Math.random() - 0.5)
          .slice(0, numHabits);
        recommendedHabits.push(...chosen);
      }
    });

    // Fallback nếu vẫn thiếu habits
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

    // Loại bỏ duplicates theo tên và giới hạn
    const uniqueByName = [];
    const seen = new Set();
    for (const h of recommendedHabits) {
      if (!seen.has(h.name)) {
        seen.add(h.name);
        uniqueByName.push(h);
      }
    }
    recommendedHabits = uniqueByName.slice(0, 5);

    data.push({
      userId: `user${String(i).padStart(4, '0')}`,
      answers,
      score,
      highestCategory,
      highestScore,
      lowestCategories,
      // Store full habit objects so downstream knows check/count and targets
      recommendedHabits,
      persona,
      timestamp: new Date().toISOString()
    });
  }

  return data;
}

// -------------------------------
// 📊 EXPORT VÀ VALIDATION
// -------------------------------

function exportTrainingData() {
  const data = generateTrainingData(1000);

  console.log('✅ Đã tạo', data.length, 'mẫu dữ liệu\n');

  // Thống kê persona
  const personaStats = {};
  data.forEach(item => {
    personaStats[item.persona] = (personaStats[item.persona] || 0) + 1;
  });

  console.log('📊 Phân bố Persona:');
  Object.entries(personaStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([persona, count]) => {
      const pct = ((count / data.length) * 100).toFixed(1);
      console.log(`   ${persona.padEnd(25)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  // Thống kê habits được recommend
  const habitStats = {};
  data.forEach(item => {
    item.recommendedHabits.forEach(habit => {
        const key = `${habit.name} | ${habit.trackingMode}${habit.trackingMode === 'count' && habit.unit ? `(${habit.targetCount} ${habit.unit})` : ''}`;
        habitStats[key] = (habitStats[key] || 0) + 1;
      });
  });

  console.log('\n📊 Top 10 habits được recommend nhiều nhất:');
  Object.entries(habitStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([habit, count]) => {
      console.log(`   ${habit.padEnd(40)} ${count.toString().padStart(4)} lần`);
    });

  // Ví dụ mẫu đầu tiên
  console.log('\n📝 Ví dụ mẫu đầu tiên:');
  console.log(JSON.stringify({
    ...data[0],
    // Map recommendedHabits to a concise view for console
    recommendedHabits: data[0].recommendedHabits.map(h => ({
      name: h.name,
      category: h.category,
      trackingMode: h.trackingMode,
      targetCount: h.targetCount,
      unit: h.unit
    }))
  }, null, 2));

  // Lưu file với đường dẫn tuyệt đối
  const path = './src/Script/training_data.json';
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('\n💾 Đã lưu vào', path);

  return data;
}

// Chạy script
exportTrainingData();