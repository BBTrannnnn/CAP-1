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
          max_tokens: 2500,
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

async function generateHabitTemplates(category, numHabits = 6) {
  const prompt = `Tạo ${numHabits} mẫu thói quen phổ biến cho category "${category}".

YÊU CẦU:
- Thói quen nhiều người muốn xây dựng
- Độ khó: 40% easy, 40% medium, 20% hard
- Có tips, commonObstacles, benefits chi tiết
- Phù hợp người Việt

🎯 QUAN TRỌNG - PHÂN BIỆT trackingMode:

MODE "check" - Dùng khi:
 Thói quen CHỈ CẦN XÁC NHẬN đã làm hay chưa (1 lần/ngày)
 Không cần đếm số lượng chi tiết
 Ví dụ:
   - Dậy sớm lúc 6h → trackingMode: "check", targetCount: 1, unit: "lần"
   - Thiền 15 phút → trackingMode: "check", targetCount: 1, unit: "lần"
   - Tập yoga buổi sáng → trackingMode: "check", targetCount: 1, unit: "lần"
   - Đọc sách 30 phút → trackingMode: "check", targetCount: 1, unit: "lần"
   - Viết nhật ký → trackingMode: "check", targetCount: 1, unit: "lần"
   - Chạy bộ buổi sáng → trackingMode: "check", targetCount: 1, unit: "lần"
   - Ăn sáng đầy đủ → trackingMode: "check", targetCount: 1, unit: "lần"

MODE "count" - Dùng khi:
 Đếm số lượng CỤ THỂ trong ngày
 Có thể tracking nhiều lần và cộng dồn
 Ví dụ:
   - Đọc 30 trang sách → trackingMode: "count", targetCount: 30, unit: "trang"
   - Chạy bộ 5 km → trackingMode: "count", targetCount: 5, unit: "km"
   - Uống 8 ly nước → trackingMode: "count", targetCount: 8, unit: "ly"
   - Tập 100 cái hít đất → trackingMode: "count", targetCount: 100, unit: "cái"
   - Học 20 từ vựng → trackingMode: "count", targetCount: 20, unit: "từ"
   - Đi bộ 10,000 bước → trackingMode: "count", targetCount: 10000, unit: "bước"
   - Tiết kiệm 50k/ngày → trackingMode: "count", targetCount: 50, unit: "k"

 NGUYÊN TẮC:
1. Nếu có ĐƠN VỊ ĐẾM CỤ THỂ (trang, km, ly, cái, từ, bước, k...) → dùng "count"
2. Nếu chỉ cần XÁC NHẬN đã làm (dù có thời gian như "30 phút") → dùng "check"
3. "Đọc sách 30 phút" ≠ "Đọc 30 trang":
   - "30 phút" → check (chỉ cần xác nhận đã đọc đủ thời gian)
   - "30 trang" → count (cần đếm số trang cụ thể)

Trả về JSON với format:
{
  "templates": [
    {
      "name": "Uống 8 ly nước mỗi ngày",
      "description": "Duy trì lượng nước cần thiết cho cơ thể khỏe mạnh",
      "category": "${category}",
      "difficulty": "easy",
      "frequency": "daily",
      "trackingMode": "count",
      "targetCount": 8,
      "unit": "ly",
      "habitType": "build",
      "icon": "💧",
      "color": "#3B82F6",
      "tags": ["sức khỏe", "hydration"],
      "tips": [
        "Đặt chai nước trên bàn làm việc",
        "Uống 1 ly ngay sau khi thức dậy",
        "Đặt nhắc nhở mỗi 2 tiếng"
      ],
      "commonObstacles": [
        "Quên uống khi bận rộn",
        "Không thích vị nước lã"
      ],
      "benefits": [
        "Cải thiện độ ẩm cho da",
        "Tăng cường chức năng não bộ",
        "Hỗ trợ tiêu hóa tốt hơn"
      ],
      "isPopular": true
    },
    {
      "name": "Thiền 15 phút mỗi sáng",
      "description": "Bắt đầu ngày mới với tâm trí tỉnh thức và bình yên",
      "category": "${category}",
      "difficulty": "medium",
      "frequency": "daily",
      "trackingMode": "check",
      "targetCount": 1,
      "unit": "lần",
      "habitType": "build",
      "icon": "🧘",
      "color": "#8B5CF6",
      "tags": ["mindfulness", "meditation"],
      "tips": [
        "Chọn không gian yên tĩnh",
        "Dùng app hướng dẫn cho người mới",
        "Tập trung vào hơi thở"
      ],
      "commonObstacles": [
        "Khó tập trung ban đầu",
        "Không có thời gian buổi sáng"
      ],
      "benefits": [
        "Giảm stress và lo âu",
        "Tăng khả năng tập trung",
        "Cải thiện chất lượng giấc ngủ"
      ],
      "isPopular": true
    }
  ]
}`;

  const result = await callGroqAPI(prompt);
  return result ? result.templates : [];
}

const main = async () => {
  console.log('💡 BƯỚC 2: TẠO MẪU THÓI QUEN\n');
  
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ Thiếu GROQ_API_KEY trong file .env');
    return;
  }

  const config = {
    health: 5, productivity: 5, learning: 5, mindful: 5,
    finance: 5, digital: 5, social: 5, fitness: 6,
    sleep: 5, energy: 5, control: 5
  };

  const allTemplates = [];

  for (const category of CATEGORIES) {
    console.log(`  ⏳ Đang tạo templates cho "${category}"...`);
    const templates = await generateHabitTemplates(category, config[category]);
    
    if (templates.length > 0) {
      allTemplates.push(...templates);
      console.log(`   Đã tạo ${templates.length} templates\n`);
    } else {
      console.log(`    Không tạo được templates\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  const outputPath = path.resolve(__dirname, './habitTemplates.json');
  fs.writeFileSync(outputPath, JSON.stringify(allTemplates, null, 2));

  console.log('='.repeat(60));
  console.log(' HOÀN TẤT TẠO MẪU THÓI QUEN!');
  console.log(` Tổng: ${allTemplates.length} templates`);
  console.log(` Đã lưu vào: ${outputPath}`);
};

main();