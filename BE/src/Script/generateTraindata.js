import fs from 'fs';
import { habitSuggestions } from './seedSurvey.js';

// Trung bình an toàn (bỏ qua undefined)
function safeAvg(answers, fields) {
  const valid = fields.map(f => answers[f]).filter(v => v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function getHealthSubtype(answers) {
  const inactive = safeAvg(answers, ['fitness_1', 'fitness_2']) <= 2;
  const poorSleep = (answers.health_2 ?? 3) <= 2;
  const poorDiet = (answers.health_3 ?? 3) <= 2;
  const stressRelated = (answers.health_4 ?? 3) <= 2 || (answers.mindful_1 ?? 3) <= 2;

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
  
  habitLibrary[category].push(habit.name);
});

// Special health subtypes
habitLibrary.health_subtypes = {
  inactive: habitLibrary.fitness || habitLibrary.health || [],
  poor_sleep: habitLibrary.health?.filter(h => 
    h.toLowerCase().includes('ngủ') || h.toLowerCase().includes('sleep')
  ) || [],
  poor_diet: habitLibrary.health?.filter(h => 
    h.toLowerCase().includes('ăn') || h.toLowerCase().includes('uống') || h.toLowerCase().includes('nước')
  ) || [],
  stress_related: habitLibrary.mindful || [],
  general: habitLibrary.health || []
};

console.log('📚 Đã load habits từ seedSurvey.js:');
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
    'health_1', 'health_2', 'health_3', 'health_4',
    'productivity_1', 'productivity_2', 'productivity_3',
    'learning_1', 'learning_2', 'learning_3',
    'mindful_1', 'mindful_2', 'mindful_3',
    'finance_1', 'finance_2',
    'digital_1', 'digital_2',
    'social_1', 'social_2',
    'fitness_1', 'fitness_2'
  ];

  const data = [];

  for (let i = 0; i < numSamples; i++) {
    // Chọn ngẫu nhiên 12-18 câu hỏi
    const numQuestions = Math.floor(Math.random() * 7) + 12;
    const selected = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, numQuestions);

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
      health: parseFloat((safeAvg(answers, ['health_1', 'health_2', 'health_3', 'health_4']) ?? 2.5).toFixed(2)),
      productivity: parseFloat((safeAvg(answers, ['productivity_1', 'productivity_2', 'productivity_3']) ?? 2.5).toFixed(2)),
      learning: parseFloat((safeAvg(answers, ['learning_1', 'learning_2', 'learning_3']) ?? 2.5).toFixed(2)),
      mindful: parseFloat((safeAvg(answers, ['mindful_1', 'mindful_2', 'mindful_3']) ?? 2.5).toFixed(2)),
      finance: parseFloat((safeAvg(answers, ['finance_1', 'finance_2']) ?? 2.5).toFixed(2)),
      digital: parseFloat((safeAvg(answers, ['digital_1', 'digital_2']) ?? 2.5).toFixed(2)),
      social: parseFloat((safeAvg(answers, ['social_1', 'social_2']) ?? 2.5).toFixed(2)),
      fitness: parseFloat((safeAvg(answers, ['fitness_1', 'fitness_2']) ?? 2.5).toFixed(2))
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
      social: 'community-oriented',
      fitness: 'fitness-driven'
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
    
    // Tìm weak areas
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
        !k.includes('_subtypes') && habitLibrary[k].length > 0
      );
      
      for (const cat of allCategories) {
        if (recommendedHabits.length >= 5) break;
        
        const remaining = habitLibrary[cat].filter(h => !recommendedHabits.includes(h));
        if (remaining.length > 0) {
          recommendedHabits.push(remaining[0]);
        }
      }
    }

    // Loại bỏ duplicates và giới hạn
    recommendedHabits = [...new Set(recommendedHabits)].slice(0, 5);

    data.push({
      userId: `user${String(i).padStart(4, '0')}`,
      answers,
      score,
      highestCategory,
      highestScore,
      lowestCategories,
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

  // 🔍 VALIDATION: Kiểm tra habits có từ persona không
  console.log('\n🔍 Validation - Kiểm tra 5 mẫu đầu:\n');
  let validCount = 0;
  
  data.slice(0, 5).forEach((item, i) => {
    const hasPersonaHabit = item.recommendedHabits.some(habit => 
      habitLibrary[item.highestCategory]?.includes(habit)
    );
    
    if (hasPersonaHabit) validCount++;
    
    console.log(`${i + 1}. ${item.persona} (${item.highestCategory}=${item.highestScore})`);
    console.log(`   ${hasPersonaHabit ? '✅' : '❌'} Có habit từ ${item.highestCategory}`);
    console.log(`   Weak: ${item.lowestCategories.join(', ')}`);
    console.log(`   Habits: ${item.recommendedHabits.slice(0, 2).join(', ')}, ...`);
    console.log('');
  });

  console.log(`Tổng kết: ${validCount}/5 mẫu có habits từ persona\n`);

  // Ví dụ chi tiết
  console.log('📝 Chi tiết mẫu đầu tiên:\n');
  console.log(JSON.stringify(data[0], null, 2));

  // Lưu file
  fs.writeFileSync('training_data.json', JSON.stringify(data, null, 2));
  console.log('\n💾 Đã lưu vào training_data.json');

  return data;
}

// Chạy script
exportTrainingData();