import fs from 'fs';

// Hàm huấn luyện mô hình từ training_data.json
const trainModel = () => {
  // 1️⃣ Đọc dữ liệu
  const rawData = fs.readFileSync('training_data.json', 'utf8');
  const dataset = JSON.parse(rawData);

  console.log(`📚 Đang huấn luyện trên ${dataset.length} mẫu dữ liệu...\n`);

  // 2️⃣ Gom dữ liệu theo từng loại persona
  const stats = {};

  dataset.forEach(item => {
    const persona = item.persona;
    if (!stats[persona]) {
      stats[persona] = {
        count: 0,
        avgScores: {},
        habits: {},
        weakCategories: {}, // Thêm: Đếm weak categories
      };
    }

    stats[persona].count++;

    // Tính điểm trung bình cho từng category
    Object.entries(item.score).forEach(([cat, val]) => {
      if (!stats[persona].avgScores[cat]) stats[persona].avgScores[cat] = [];
      stats[persona].avgScores[cat].push(val);
    });

    // Đếm tần suất các habit được gợi ý
    item.recommendedHabits.forEach(habit => {
      stats[persona].habits[habit] = (stats[persona].habits[habit] || 0) + 1;
    });

    // Đếm weak categories
    if (item.lowestCategories) {
      item.lowestCategories.forEach(cat => {
        stats[persona].weakCategories[cat] = (stats[persona].weakCategories[cat] || 0) + 1;
      });
    }
  });

  // 3️⃣ Tính toán model
  const model = {};
  
  console.log(' Kết quả huấn luyện:\n');
  
  Object.entries(stats).forEach(([persona, info]) => {
    model[persona] = {
      sampleCount: info.count,
      avgScores: {},
      topHabits: [],
      commonWeakAreas: [], // Thêm: Weak areas phổ biến
    };

    // Tính điểm trung bình
    for (const [cat, vals] of Object.entries(info.avgScores)) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      model[persona].avgScores[cat] = parseFloat(avg.toFixed(2));
    }

    // Top 10 habits phổ biến nhất (tăng từ 5 lên 10)
    const topHabits = Object.entries(info.habits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([habit, count]) => ({
        name: habit,
        frequency: count,
        percentage: ((count / info.count) * 100).toFixed(1) + '%'
      }));

    model[persona].topHabits = topHabits;

    // Top 3 weak areas phổ biến
    const commonWeakAreas = Object.entries(info.weakCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, count]) => ({
        category: cat,
        frequency: count,
        percentage: ((count / info.count) * 100).toFixed(1) + '%'
      }));

    model[persona].commonWeakAreas = commonWeakAreas;

    // In thống kê
    console.log(`📌 ${persona} (${info.count} samples):`);
    console.log(`   Điểm cao nhất: ${Object.entries(model[persona].avgScores).sort((a,b) => b[1]-a[1])[0].join('=')}`);
    console.log(`   Top habits: ${topHabits.slice(0, 3).map(h => h.name).join(', ')}`);
    console.log(`   Weak areas: ${commonWeakAreas.map(w => w.category).join(', ')}\n`);
  });

  // 4️⃣ Validation: Kiểm tra logic
  console.log('\n Validation:');
  Object.entries(model).forEach(([persona, data]) => {
    const highestScore = Object.entries(data.avgScores)
      .sort((a, b) => b[1] - a[1])[0];
    
    const personaCategoryMap = {
      'health-focused': 'health',
      'fitness-driven': 'fitness',
      'productivity-driven': 'productivity',
      'knowledge-seeker': 'learning',
      'mindful-seeker': 'mindful',
      'finance-conscious': 'finance',
      'community-oriented': 'social',
      'balanced-lifestyle': 'digital'
    };

    const expectedCategory = personaCategoryMap[persona];
    const isValid = highestScore[0] === expectedCategory || persona === 'balanced-lifestyle';
    
    console.log(`   ${persona}: ${highestScore[0]}=${highestScore[1]} ${isValid ? '✅' : '⚠️'}`);
  });

  // 5️⃣ Lưu model
  fs.writeFileSync('trained_model.json', JSON.stringify(model, null, 2));
  console.log('\n Đã lưu mô hình vào trained_model.json');
  
  // Thống kê tổng quan
  const totalSamples = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
  console.log(`\n📊 Tổng: ${totalSamples} samples, ${Object.keys(model).length} personas`);
};

trainModel();