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
          max_tokens: 2000,
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

async function generateSurveyQuestions(category, numQuestions = 5) {
  const prompt = `Tạo ${numQuestions} câu hỏi khảo sát cho category "${category}".

YÊU CẦU:
- Câu hỏi đánh giá HÀNH VI HIỆN TẠI
- Mỗi câu có 4 options (value: 1-4) từ thấp đến cao
- Phù hợp người Việt Nam
- ID format: "${category}_1", "${category}_2"...

Trả về JSON array với format:
{
  "questions": [
    {
      "id": "${category}_1",
      "text": "Câu hỏi về hành vi?",
      "type": "single",
      "category": "${category}",
      "options": [
        { "id": "${category[0]}1_1", "text": "Không bao giờ", "value": 1 },
        { "id": "${category[0]}1_2", "text": "Thỉnh thoảng", "value": 2 },
        { "id": "${category[0]}1_3", "text": "Thường xuyên", "value": 3 },
        { "id": "${category[0]}1_4", "text": "Luôn luôn", "value": 4 }
      ]
    }
  ]
}`;

  const result = await callGroqAPI(prompt);
  return result ? result.questions : [];
}

const main = async () => {
  console.log('📝 BƯỚC 1: TẠO CÂU HỎI KHẢO SÁT\n');
  
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ Thiếu GROQ_API_KEY trong file .env');
    return;
  }

  const config = {
    health: 6, productivity: 6, learning: 5, mindful: 6,
    finance: 5, digital: 6, social: 5, fitness: 6,
    sleep: 5, energy: 6, control: 5
  };

  const allQuestions = [];

  for (const category of CATEGORIES) {
    console.log(`  ⏳ Đang tạo câu hỏi cho "${category}"...`);
    const questions = await generateSurveyQuestions(category, config[category]);
    
    if (questions.length > 0) {
      allQuestions.push(...questions);
      console.log(`   Đã tạo ${questions.length} câu hỏi\n`);
    } else {
      console.log(`   Không tạo được câu hỏi\n`);
    }
    
    // Đợi 7s giữa mỗi request để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  // Lưu vào file JSON
  const outputPath = path.resolve(__dirname, './surveyQuestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));

  console.log('='.repeat(60));
  console.log(' HOÀN TẤT TẠO CÂU HỎI KHẢO SÁT!');
  console.log(` Tổng: ${allQuestions.length} câu hỏi`);
  console.log(` Đã lưu vào: ${outputPath}`);
};

main();