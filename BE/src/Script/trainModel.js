import fs from 'fs';

// 🔧 Hàm xác định category dựa trên tên habit
const detectCategory = (habitName) => {
  const name = habitName.toLowerCase();

  if (name.includes("ngủ") || name.includes("giấc")) return "sleep";
  if (name.includes("tập") || name.includes("chạy") || name.includes("vận động")) return "fitness";
  if (name.includes("ăn") || name.includes("uống") || name.includes("dinh dưỡng") || name.includes("sức khỏe")) return "health";
  if (name.includes("bạn bè") || name.includes("xã hội") || name.includes("giao tiếp") || name.includes("kết nối")) return "social";
  if (name.includes("kế hoạch") || name.includes("kiểm soát") || name.includes("mục tiêu") || name.includes("kỷ luật")) return "control";
  if (name.includes("học") || name.includes("đọc") || name.includes("kiến thức") || name.includes("podcast")) return "learning";
  if (name.includes("tiết kiệm") || name.includes("chi tiêu") || name.includes("tài chính")) return "finance";
  if (name.includes("thiền") || name.includes("cảm ơn") || name.includes("biết ơn") || name.includes("chánh niệm")) return "mindful";
  if (name.includes("năng lượng") || name.includes("mệt") || name.includes("vui vẻ")) return "energy";
  if (name.includes("hiệu suất") || name.includes("to-do") || name.includes("trì hoãn")) return "productivity";

  return "general";
};

// 📦 Hàm huấn luyện mô hình
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
        weakCategories: {},
      };
    }

    stats[persona].count++;

    // Tính điểm trung bình cho từng category
    Object.entries(item.score).forEach(([cat, val]) => {
      if (!stats[persona].avgScores[cat]) stats[persona].avgScores[cat] = [];
      stats[persona].avgScores[cat].push(val);
    });

    // Đếm tần suất các habit được gợi ý
    // recommendedHabits là object đầy đủ: { name, category, trackingMode, targetCount, unit, ... }
    item.recommendedHabits.forEach(h => {
      // Tạo key đơn giản từ name + category + trackingMode
      const key = `${h.name}|${h.category}|${h.trackingMode}`;
      if (!stats[persona].habits[key]) {
        // Lưu object đầu tiên để có đầy đủ thông tin
        stats[persona].habits[key] = {
          count: 0,
          habit: {
            name: h.name,
            category: h.category,
            trackingMode: h.trackingMode,
            targetCount: h.targetCount ?? null,
            unit: h.unit ?? null
          }
        };
      }
      stats[persona].habits[key].count += 1;
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
  
  console.log('✅ Kết quả huấn luyện:\n');
  
  Object.entries(stats).forEach(([persona, info]) => {
    model[persona] = {
      sampleCount: info.count,
      avgScores: {},
      topHabits: [],
      commonWeakAreas: [],
    };

    // Tính điểm trung bình
    for (const [cat, vals] of Object.entries(info.avgScores)) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      model[persona].avgScores[cat] = parseFloat(avg.toFixed(2));
    }

    // ✅ Top 10 habits + lấy category từ seed (không dùng detectCategory)
    const topHabits = Object.entries(info.habits)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, data]) => {
        const { name, category, trackingMode, targetCount, unit } = data.habit;
        const count = data.count;
        const target = trackingMode === 'count' && targetCount != null 
          ? `${targetCount}${unit ? ' ' + unit : ''}`
          : undefined;
        return {
          name,
          category,
          trackingMode,
          target,
          frequency: count,
          percentage: ((count / info.count) * 100).toFixed(1) + '%'
        };
      });

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
    console.log(`   Top 5 habits: ${topHabits.slice(0, 5).map(h => h.name).join(', ')}`);
    console.log(`   Weak areas: ${commonWeakAreas.map(w => w.category).join(', ')}\n`);
  });

  // 4️⃣ Validation: Kiểm tra logic
  console.log('\n✅ Validation:');
  const personaCategoryMap = {
    'health-focused': 'health',
    'productivity-driven': 'productivity',
    'knowledge-seeker': 'learning',
    'mindful-seeker': 'mindful',
    'finance-conscious': 'finance',
    'balanced-lifestyle': ['digital', 'health', 'productivity'],
    'social-connector': 'social',
    'fitness-enthusiast': 'fitness',
    'rest-prioritizer': 'sleep',
    'energy-optimizer': 'energy',
    'discipline-master': 'control'
  };

  Object.entries(model).forEach(([persona, data]) => {
    const highestScore = Object.entries(data.avgScores)
      .sort((a, b) => b[1] - a[1])[0];
    
    const expectedCategory = personaCategoryMap[persona];
    let isValid = false;
    if (Array.isArray(expectedCategory)) {
      isValid = expectedCategory.includes(highestScore[0]);
    } else {
      isValid = highestScore[0] === expectedCategory;
    }
    
    console.log(`   ${persona.padEnd(25)}: ${highestScore[0]}=${highestScore[1]} ${isValid ? '✅' : '⚠️'}`);
  });

  // 5️⃣ Lưu model
  fs.writeFileSync('./src/Script/trained_model.json', JSON.stringify(model, null, 2));
  console.log('\n💾 Đã lưu mô hình vào trained_model.json');

  // 6️⃣ Thống kê tổng quan
  const totalSamples = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
  console.log(`\n📊 Tổng quan:`);
  console.log(`   - Tổng samples: ${totalSamples}`);
  console.log(`   - Số personas: ${Object.keys(model).length}`);

  // Phân bố personas
  console.log(`\n📊 Phân bố personas:`);
  Object.entries(model)
    .sort((a, b) => b[1].sampleCount - a[1].sampleCount)
    .forEach(([persona, data]) => {
      const pct = ((data.sampleCount / totalSamples) * 100).toFixed(1);
      console.log(`   ${persona.padEnd(25)} ${data.sampleCount.toString().padStart(4)} (${pct}%)`);
    });

  // Top habits tổng thể
  console.log(`\n📊 Top 15 habits phổ biến nhất:`);
  const allHabits = {};
  Object.values(stats).forEach(info => {
    Object.entries(info.habits).forEach(([key, data]) => {
      if (!allHabits[key]) {
        allHabits[key] = { count: 0, habit: data.habit };
      }
      allHabits[key].count += data.count;
    });
  });
  Object.entries(allHabits)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .forEach(([key, data], index) => {
      if (!data || !data.habit) {
        console.log(`   ${(index + 1).toString().padStart(2)}. [Invalid habit data]`);
        return;
      }
      const { name, trackingMode, targetCount, unit } = data.habit;
      const count = data.count;
      const target = trackingMode === 'count' && targetCount != null ? `(${targetCount}${unit ? ' ' + unit : ''})` : '';
      const pct = ((count / totalSamples) * 100).toFixed(1);
      console.log(`   ${(index + 1).toString().padStart(2)}. ${name.padEnd(35)} ${trackingMode.padEnd(6)} ${target.padEnd(12)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  // Weak areas tổng thể
  console.log(`\n📊 Weak areas phổ biến nhất:`);
  const allWeakAreas = {};
  Object.values(stats).forEach(info => {
    Object.entries(info.weakCategories).forEach(([cat, count]) => {
      allWeakAreas[cat] = (allWeakAreas[cat] || 0) + count;
    });
  });
  Object.entries(allWeakAreas)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / totalSamples) * 100).toFixed(1);
      console.log(`   ${cat.padEnd(15)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  console.log('\n✅ Huấn luyện hoàn tất!');
  return model;
};

trainModel();
