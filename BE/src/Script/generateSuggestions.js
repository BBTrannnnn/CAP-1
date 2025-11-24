import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CATEGORIES = [
  'health', 'productivity', 'learning', 'mindful', 
  'finance', 'digital', 'social', 'fitness', 
  'sleep', 'energy', 'control'
];

async function callGroqAPI(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: 'You are a habit building expert. Always respond in valid JSON format only, no explanations.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && i < retries - 1) {
          const waitTime = errorData.error?.message?.match(/(\d+)m/)?.[1] 
            ? parseInt(errorData.error.message.match(/(\d+)m/)[1]) * 60000 
            : 10000;
          console.log(`  ⏳ Rate limit, đợi ${Math.floor(waitTime/1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        console.error(`❌ API Error:`, errorData.error?.message);
        return null;
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      if (i < retries - 1) {
        console.log(`  ⚠️  Lỗi, thử lại lần ${i + 2}...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      console.error(`❌ Error:`, error.message);
      return null;
    }
  }
  return null;
}

async function generateHabitSuggestions(category, surveyQuestions, numSuggestions = 7) {
  const questionContext = surveyQuestions
    .filter(q => q.category === category)
    .map(q => `- ${q.id}: ${q.text}`)
    .join('\n');

  const prompt = `Tạo ${numSuggestions} gợi ý thói quen cho category "${category}".

CÂU HỎI KHẢO SÁT:
${questionContext}

TARGET PERSONAS: health-focused, productivity-driven, knowledge-seeker, mindful-seeker, finance-conscious, balanced-lifestyle, fitness-enthusiast, social-connector

ĐỘ TUỔI PHÙ HỢP:
- children (6-12): Thói quen đơn giản, vui chơi, học tập cơ bản
- teens (13-17): Học tập, kỹ năng xã hội, quản lý thời gian
- young_adult (18-25): Sự nghiệp, độc lập, phát triển bản thân
- adult (26-45): Cân bằng công việc-gia đình, quản lý tài chính
- middle_aged (46-60): Sức khỏe bền vững, duy trì năng lượng
- elderly (61-80): Nhẹ nhàng, an toàn, duy trì sức khỏe

GIỚI TÍNH:
- male: Nam giới
- female: Nữ giới
- all: Phù hợp cả 2 giới (dùng ["male", "female"])

🎯 QUAN TRỌNG - PHÂN BIỆT trackingMode:

MODE "check" - Dùng khi:
✅ Thói quen CHỈ CẦN XÁC NHẬN đã làm hay chưa (1 lần/ngày)
✅ Không cần đếm số lượng chi tiết
✅ Ví dụ:
   - Dậy sớm lúc 6h → trackingMode: "check", targetCount: 1, unit: "lần"
   - Thiền 15 phút → trackingMode: "check", targetCount: 1, unit: "lần"
   - Tập yoga buổi sáng → trackingMode: "check", targetCount: 1, unit: "lần"
   - Đọc sách 30 phút → trackingMode: "check", targetCount: 1, unit: "lần"
   - Viết nhật ký → trackingMode: "check", targetCount: 1, unit: "lần"
   - Chạy bộ buổi sáng → trackingMode: "check", targetCount: 1, unit: "lần"
   - Ăn sáng đầy đủ → trackingMode: "check", targetCount: 1, unit: "lần"
   - Ngủ đủ 8 tiếng → trackingMode: "check", targetCount: 1, unit: "lần"

MODE "count" - Dùng khi:
✅ Đếm số lượng CỤ THỂ trong ngày
✅ Có thể tracking nhiều lần và cộng dồn
✅ Ví dụ:
   - Đọc 30 trang sách → trackingMode: "count", targetCount: 30, unit: "trang"
   - Chạy bộ 5 km → trackingMode: "count", targetCount: 5, unit: "km"
   - Uống 8 ly nước → trackingMode: "count", targetCount: 8, unit: "ly"
   - Tập 100 cái hít đất → trackingMode: "count", targetCount: 100, unit: "cái"
   - Học 20 từ vựng → trackingMode: "count", targetCount: 20, unit: "từ"
   - Đi bộ 10,000 bước → trackingMode: "count", targetCount: 10000, unit: "bước"
   - Tiết kiệm 50k/ngày → trackingMode: "count", targetCount: 50, unit: "k"
   - Viết 500 từ blog → trackingMode: "count", targetCount: 500, unit: "từ"
   - Hoàn thành 5 task → trackingMode: "count", targetCount: 5, unit: "task"

⚠️ NGUYÊN TẮC QUAN TRỌNG:
1. Nếu có ĐƠN VỊ ĐẾM CỤ THỂ (trang, km, ly, cái, từ, bước, k, task...) → PHẢI dùng "count"
2. Nếu chỉ cần XÁC NHẬN đã làm (dù có thời gian như "30 phút", "1 giờ") → dùng "check"
3. PHÂN BIỆT RÕ:
   - "Đọc sách 30 phút" → check (xác nhận đã đọc đủ thời gian)
   - "Đọc 30 trang" → count (đếm số trang cụ thể)
   - "Chạy bộ buổi sáng" → check (xác nhận đã chạy)
   - "Chạy 5km" → count (đếm số km)
   - "Thiền 20 phút" → check (xác nhận đã thiền đủ thời gian)
   - "Học 50 từ vựng" → count (đếm số từ)

YÊU CẦU KHÁC:
- triggerConditions: dựa vào question_id với value thấp [1, 2]
- Đa dạng độ khó: easy (50%), medium (30%), hard (20%)
- requiredScore: 0 = dễ đề xuất, 1-2 = khó hơn
- targetAgeGroups: danh sách độ tuổi phù hợp
- targetGenders: ["male"], ["female"], hoặc ["male", "female"]

Trả về JSON với format:
{
  "suggestions": [
    {
      "name": "Uống 8 ly nước mỗi ngày",
      "description": "Duy trì lượng nước cần thiết cho cơ thể",
      "category": "${category}",
      "difficulty": "easy",
      "frequency": "daily",
      "trackingMode": "count",
      "targetCount": 8,
      "unit": "ly",
      "icon": "💧",
      "color": "#3B82F6",
      "tags": ["sức khỏe", "hydration"],
      "requiredScore": 0,
      "targetPersonas": ["health-focused", "balanced-lifestyle"],
      "targetAgeGroups": ["young_adult", "adult", "middle_aged"],
      "targetGenders": ["male", "female"],
      "triggerConditions": { "${category}_1": [1, 2] }
    },
    {
      "name": "Thiền 15 phút mỗi sáng",
      "description": "Bắt đầu ngày mới với tâm trí tỉnh thức",
      "category": "${category}",
      "difficulty": "medium",
      "frequency": "daily",
      "trackingMode": "check",
      "targetCount": 1,
      "unit": "lần",
      "icon": "🧘",
      "color": "#8B5CF6",
      "tags": ["mindfulness", "meditation"],
      "requiredScore": 1,
      "targetPersonas": ["mindful-seeker"],
      "targetAgeGroups": ["young_adult", "adult"],
      "targetGenders": ["male", "female"],
      "triggerConditions": { "${category}_2": [1, 2] }
    }
  ]
}`;

  const result = await callGroqAPI(prompt);
  return result ? result.suggestions : [];
}

const main = async () => {
  console.log('✨ BƯỚC 3: TẠO GỢI Ý THÓI QUEN\n');
  
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ Thiếu GROQ_API_KEY trong file .env');
    return;
  }

  const questionsPath = path.resolve(__dirname, './surveyQuestions.json');
  if (!fs.existsSync(questionsPath)) {
    console.error('❌ Chưa có file surveyQuestions.json!');
    console.log('▶️  Chạy trước: node src/Script/1_generateQuestions.js');
    return;
  }
  
  const surveyQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  console.log(`📋 Đã load ${surveyQuestions.length} câu hỏi\n`);

  const config = {
    health: 6, productivity: 7, learning: 7, mindful: 8,
    finance: 6, digital: 7, social: 5, fitness: 4,
    sleep: 3, energy: 3, control: 6
  };

  const allSuggestions = [];

  for (const category of CATEGORIES) {
    console.log(`  ⏳ Đang tạo suggestions cho "${category}"...`);
    const suggestions = await generateHabitSuggestions(
      category, 
      surveyQuestions, 
      config[category]
    );
    
    if (suggestions.length > 0) {
      allSuggestions.push(...suggestions);
      console.log(`  ✅ Đã tạo ${suggestions.length} suggestions\n`);
    } else {
      console.log(`  ⚠️  Không tạo được suggestions\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  const outputPath = path.resolve(__dirname, './habitSuggestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(allSuggestions, null, 2));

  console.log('='.repeat(60));
  console.log('✅ HOÀN TẤT TẠO GỢI Ý THÓI QUEN!');
  console.log(`✨ Tổng: ${allSuggestions.length} suggestions`);
  console.log(`💾 Đã lưu vào: ${outputPath}`);
};

main();