import fs from 'fs';

// ============================================
// 🎯 TRAIN MODEL FROM GENERATED DATA
// ============================================

/**
 * Huấn luyện model từ training_data.json
 * Output: trained_model.json với structure chuẩn cho production
 */
function trainModel() {
  console.log('🚀 Bắt đầu huấn luyện model...\n');
  
  // 1️⃣ Load training data
  const rawData = fs.readFileSync('./src/Script/training_data.json', 'utf8');
  const dataset = JSON.parse(rawData);
  
  console.log(`📚 Loaded ${dataset.length} training samples\n`);

  // 2️⃣ Aggregate data theo persona
  const personaStats = aggregateByPersona(dataset);
  
  // 3️⃣ Build model từ aggregated data
  const model = buildModel(personaStats);
  
  // 4️⃣ Validate model
  validateModel(model);
  
  // 5️⃣ Print statistics
  printStatistics(model, personaStats, dataset.length);
  
  // 6️⃣ Save model
  const modelPath = './src/Script/trained_model.json';
  fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
  console.log(`\n💾 Model saved to ${modelPath}`);
  
  return model;
}

// ============================================
// 📊 AGGREGATE DATA BY PERSONA
// ============================================

function aggregateByPersona(dataset) {
  const stats = {};

  dataset.forEach(sample => {
    const persona = sample.labels.persona;
    
    if (!stats[persona]) {
      stats[persona] = {
        count: 0,
        scores: {},        // Tích lũy scores để tính avg
        habits: {},        // Đếm habits
        weakAreas: {},     // Đếm weak categories
        answerPatterns: [] // Lưu answer patterns
      };
    }

    stats[persona].count++;

    // Aggregate scores
    Object.entries(sample.features.scores).forEach(([category, score]) => {
      if (!stats[persona].scores[category]) {
        stats[persona].scores[category] = [];
      }
      stats[persona].scores[category].push(score);
    });

    // Aggregate habits (lấy từ metadata để có full info)
    sample.metadata.recommendedHabits.forEach(habit => {
      const key = `${habit.name}|${habit.category}`;
      
      if (!stats[persona].habits[key]) {
        stats[persona].habits[key] = {
          count: 0,
          data: {
            name: habit.name,
            category: habit.category,
            trackingMode: habit.trackingMode,
            targetCount: habit.targetCount ?? null,
            unit: habit.unit ?? null,
            id: habit.id ?? habit.name
          }
        };
      }
      stats[persona].habits[key].count++;
    });

    // Aggregate weak areas
    sample.metadata.lowestCategories.forEach(category => {
      stats[persona].weakAreas[category] = (stats[persona].weakAreas[category] || 0) + 1;
    });

    // Store answer patterns
    stats[persona].answerPatterns.push(sample.features.answerPattern);
  });

  return stats;
}

// ============================================
// 🏗️ BUILD MODEL STRUCTURE
// ============================================

function buildModel(personaStats) {
  const model = {
    version: '1.0.0',
    trainedAt: new Date().toISOString(),
    totalSamples: Object.values(personaStats).reduce((sum, s) => sum + s.count, 0),
    personas: {}
  };

  Object.entries(personaStats).forEach(([persona, stats]) => {
    // Calculate average scores
    const avgScores = {};
    Object.entries(stats.scores).forEach(([category, values]) => {
      avgScores[category] = parseFloat(
        (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      );
    });

    // Get top habits (top 10 với đầy đủ info)
    const topHabits = Object.entries(stats.habits)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, habitData]) => {
        const h = habitData.data;
        return {
          id: h.id,
          name: h.name,
          category: h.category,
          trackingMode: h.trackingMode,
          targetCount: h.targetCount,
          unit: h.unit,
          frequency: habitData.count,
          percentage: parseFloat(((habitData.count / stats.count) * 100).toFixed(1))
        };
      });

    // Get common weak areas (top 5)
    const commonWeakAreas = Object.entries(stats.weakAreas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        frequency: count,
        percentage: parseFloat(((count / stats.count) * 100).toFixed(1))
      }));

    // Calculate answer pattern statistics
    const answerPatternStats = calculatePatternStats(stats.answerPatterns);

    // Identify strongest category
    const strongestCategory = Object.entries(avgScores)
      .sort((a, b) => b[1] - a[1])[0];

    model.personas[persona] = {
      sampleCount: stats.count,
      percentage: parseFloat(((stats.count / model.totalSamples) * 100).toFixed(1)),
      
      // Category scores
      avgScores,
      strongestCategory: {
        name: strongestCategory[0],
        score: strongestCategory[1]
      },
      
      // Habit recommendations
      topHabits,
      
      // Weak areas
      commonWeakAreas,
      
      // Answer pattern characteristics
      answerPatternStats,
      
      // Metadata
      characteristics: generateCharacteristics(persona, avgScores, commonWeakAreas)
    };
  });

  return model;
}

// ============================================
// 📈 CALCULATE PATTERN STATISTICS
// ============================================

function calculatePatternStats(patterns) {
  if (patterns.length === 0) return null;

  const means = patterns.map(p => p.mean);
  const stds = patterns.map(p => p.std);
  const lowCounts = patterns.map(p => p.lowCount);

  return {
    avgMean: parseFloat((means.reduce((a, b) => a + b, 0) / means.length).toFixed(2)),
    avgStd: parseFloat((stds.reduce((a, b) => a + b, 0) / stds.length).toFixed(2)),
    avgLowCount: parseFloat((lowCounts.reduce((a, b) => a + b, 0) / lowCounts.length).toFixed(1))
  };
}

// ============================================
// 📝 GENERATE CHARACTERISTICS
// ============================================

function generateCharacteristics(persona, avgScores, weakAreas) {
  const characteristics = [];
  
  // Từ persona name
  const personaDescriptions = {
    'health-focused': 'Quan tâm sức khỏe, thể chất',
    'productivity-driven': 'Hướng đến hiệu suất, hoàn thành mục tiêu',
    'knowledge-seeker': 'Ham học hỏi, phát triển bản thân',
    'mindful-seeker': 'Tìm kiếm sự tỉnh thức, cân bằng nội tâm',
    'finance-conscious': 'Quan tâm tài chính, tiết kiệm',
    'balanced-lifestyle': 'Cân bằng nhiều lĩnh vực trong cuộc sống',
    'social-connector': 'Xây dựng mối quan hệ, giao tiếp',
    'fitness-enthusiast': 'Đam mê thể thao, rèn luyện sức khỏe',
    'rest-prioritizer': 'Ưu tiên nghỉ ngơi, phục hồi',
    'energy-optimizer': 'Tối ưu năng lượng, sức sống',
    'discipline-master': 'Kỷ luật, kiểm soát bản thân'
  };
  
  characteristics.push(personaDescriptions[persona] || persona);
  
  // Từ weak areas
  const weakAreaDescriptions = {
    health: 'Cần cải thiện sức khỏe tổng thể',
    productivity: 'Cần tăng hiệu suất làm việc',
    learning: 'Cần phát triển kiến thức',
    mindful: 'Cần chánh niệm, giảm stress',
    finance: 'Cần quản lý tài chính tốt hơn',
    digital: 'Cần cân bằng sử dụng công nghệ',
    social: 'Cần phát triển mối quan hệ',
    fitness: 'Cần tăng cường vận động',
    sleep: 'Cần cải thiện giấc ngủ',
    energy: 'Cần tăng năng lượng',
    control: 'Cần tăng tự chủ, kỷ luật'
  };
  
  weakAreas.slice(0, 2).forEach(area => {
    if (weakAreaDescriptions[area.category]) {
      characteristics.push(weakAreaDescriptions[area.category]);
    }
  });
  
  return characteristics;
}

// ============================================
// ✅ VALIDATE MODEL
// ============================================

function validateModel(model) {
  console.log('\n✅ Validating model...\n');
  
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

  let validCount = 0;
  let totalCount = 0;

  Object.entries(model.personas).forEach(([persona, data]) => {
    totalCount++;
    
    const strongestCat = data.strongestCategory.name;
    const expectedCat = personaCategoryMap[persona];
    
    let isValid = false;
    if (Array.isArray(expectedCat)) {
      isValid = expectedCat.includes(strongestCat);
    } else {
      isValid = strongestCat === expectedCat;
    }
    
    if (isValid) validCount++;
    
    const status = isValid ? '✅' : '⚠️';
    console.log(`   ${persona.padEnd(25)}: ${strongestCat}=${data.strongestCategory.score} ${status}`);
  });

  const accuracy = ((validCount / totalCount) * 100).toFixed(1);
  console.log(`\n   Validation Accuracy: ${validCount}/${totalCount} (${accuracy}%)`);
  
  return accuracy >= 70; // Model tốt nếu >= 70% accuracy
}

// ============================================
// 📊 PRINT STATISTICS
// ============================================

function printStatistics(model, personaStats, totalSamples) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MODEL STATISTICS');
  console.log('='.repeat(80));

  // Overview
  console.log('\n📈 Overview:');
  console.log(`   Total samples: ${totalSamples}`);
  console.log(`   Total personas: ${Object.keys(model.personas).length}`);
  console.log(`   Trained at: ${model.trainedAt}`);

  // Persona distribution
  console.log('\n📊 Persona Distribution:');
  Object.entries(model.personas)
    .sort((a, b) => b[1].sampleCount - a[1].sampleCount)
    .forEach(([persona, data]) => {
      console.log(`   ${persona.padEnd(25)} ${data.sampleCount.toString().padStart(4)} (${data.percentage}%)`);
    });

  // Top habits overall
  console.log('\n📊 Top 15 Most Recommended Habits:');
  const allHabits = {};
  
  Object.values(personaStats).forEach(stats => {
    Object.entries(stats.habits).forEach(([key, habitData]) => {
      if (!allHabits[key]) {
        allHabits[key] = { count: 0, data: habitData.data };
      }
      allHabits[key].count += habitData.count;
    });
  });

  Object.entries(allHabits)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .forEach(([key, habitData], index) => {
      const h = habitData.data;
      const count = habitData.count;
      const pct = ((count / totalSamples) * 100).toFixed(1);
      
      const target = h.trackingMode === 'count' && h.targetCount 
        ? `(${h.targetCount}${h.unit ? ' ' + h.unit : ''})`
        : '';
      
      console.log(
        `   ${(index + 1).toString().padStart(2)}. ` +
        `${h.name.padEnd(40)} ` +
        `${h.trackingMode.padEnd(6)} ` +
        `${target.padEnd(12)} ` +
        `${count.toString().padStart(4)} (${pct}%)`
      );
    });

  // Common weak areas
  console.log('\n📊 Most Common Weak Areas:');
  const allWeakAreas = {};
  
  Object.values(personaStats).forEach(stats => {
    Object.entries(stats.weakAreas).forEach(([category, count]) => {
      allWeakAreas[category] = (allWeakAreas[category] || 0) + count;
    });
  });

  Object.entries(allWeakAreas)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const pct = ((count / totalSamples) * 100).toFixed(1);
      console.log(`   ${category.padEnd(15)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Training completed successfully!');
  console.log('='.repeat(80) + '\n');
}

// ============================================
// 🚀 RUN TRAINING
// ============================================

trainModel();