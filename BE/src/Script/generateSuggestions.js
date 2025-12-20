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

🎯 ĐỘ TUỔI PHÙ HỢP VÀ ƯU TIÊN:

NGUYÊN TẮC PHÂN LOẠI ĐỘ TUỔI:
- Mỗi thói quen CÓ THỂ phù hợp với NHIỀU độ tuổi
- SẮP XẾP theo thứ tự ƯU TIÊN: độ tuổi phù hợp NHẤT → phù hợp ÍT hơn
- Chỉ liệt kê các độ tuổi THỰC SỰ phù hợp, KHÔNG liệt kê đầy đủ nếu không phù hợp

CÁC NHÓM TUỔI:
- children (6-12): 
  * Ưu tiên: Thói quen đơn giản, vui chơi, học tập cơ bản, vệ sinh cá nhân
  * Ví dụ: Đánh răng 2 lần/ngày, chơi ngoài trời 1 giờ, đọc truyện 30 phút
  * KHÔNG phù hợp: Quản lý tài chính, công việc, stress cao

- teens (13-17): 
  * Ưu tiên: Học tập, kỹ năng xã hội, quản lý thời gian, phát triển sở thích
  * Ví dụ: Học bài 2 giờ/ngày, tập thể thao, học ngoại ngữ
  * KHÔNG phù hợp: Đầu tư tài chính phức tạp, quản lý gia đình

- young_adult (18-25): 
  * Ưu tiên: Sự nghiệp, độc lập, phát triển bản thân, networking, tài chính cơ bản
  * Ví dụ: Học kỹ năng mới, xây dựng CV, tiết kiệm 20% thu nhập
  * Phù hợp: Hầu hết các thói quen năng suất, học tập, fitness

- adult (26-45): 
  * Ưu tiên: Cân bằng công việc-gia đình, quản lý tài chính, sức khỏe lâu dài
  * Ví dụ: Đầu tư chứng khoán, dành thời gian cho gia đình, khám sức khỏe định kỳ
  * Phù hợp: Mọi loại thói quen, đặc biệt quản lý và cân bằng

- middle_aged (46-60): 
  * Ưu tiên: Sức khỏe bền vững, duy trì năng lượng, chuẩn bị nghỉ hưu
  * Ví dụ: Tập thể dục nhẹ nhàng, kiểm tra sức khỏe, quản lý tài chính dài hạn
  * KHÔNG phù hợp: Thói quen cường độ cao, làm việc quá sức

- elderly (61-80): 
  * Ưu tiên: Nhẹ nhàng, an toàn, duy trì sức khỏe, kết nối xã hội
  * Ví dụ: Đi bộ 30 phút, gặp gỡ bạn bè, thiền định
  * KHÔNG phù hợp: Tập luyện cường độ cao, học công nghệ phức tạp

CÁCH SẮP XẾP ĐỘ TUỔI TRONG targetAgeGroups:
 ĐÚNG: ["young_adult", "adult"] - ưu tiên young_adult
 ĐÚNG: ["adult", "middle_aged", "young_adult"] - ưu tiên adult nhất
 SAI: ["children", "teens", "young_adult", "adult", "middle_aged", "elderly"] - quá rộng, không tập trung

🚻 GIỚI TÍNH VÀ ƯU TIÊN:

NGUYÊN TẮC PHÂN LOẠI GIỚI TÍNH:
- Mặc định: ["male", "female"] - phù hợp CẢ HAI giới NGANG NHAU
- Nếu mức độ thiên lệch ≥ 70% hoặc có yếu tố văn hoá/sinh học rõ ràng → bắt buộc ưu tiên giới đó
- SẮP XẾP theo thứ tự ƯU TIÊN nếu một giới phù hợp hơn
- Nếu có dấu hiệu một giới quan tâm nhiều hơn, phổ biến hơn hoặc phù hợp hơn → phải ưu tiên giới đó lên trước.
- Chỉ dùng ["male", "female"] khi thật sự cân bằng mức độ phù hợp (xấp xỉ 50-50).
- Không được trả về ["male", "female"] chỉ vì muốn an toàn; phải đánh giá mức độ nghiêng.
-Nếu hành vi hoàn toàn đặc thù giới tính → chỉ trả về ["male"] hoặc ["female"].
CÁC TRƯỜNG HỢP:

1. PHẦN LỚN THÓI QUEN - CẢ HAI GIỚI NGANG NHAU: ["male", "female"]
   * Sức khỏe chung: Uống nước, ngủ đủ giấc, tập thể dục
   * Năng suất: Quản lý thời gian, lập kế hoạch, hoàn thành task
   * Học tập: Đọc sách, học ngoại ngữ, tham gia khóa học
   * Tài chính: Tiết kiệm, đầu tư, lập ngân sách
   * Mindfulness: Thiền, yoga, viết nhật ký

2. ƯU TIÊN NAM GIỚI TRƯỚC: ["male", "female"]
   * Tập gym tăng cơ: Tập tạ, hít đất, pull-up
   * Thể thao đối kháng: Bóng đá, boxing, martial arts
   * Công nghệ/kỹ thuật: Học lập trình, sửa chữa điện tử
   * Lý do: Nam giới thường quan tâm NHIỀU HƠN (không có nghĩa nữ không phù hợp)

3. ƯU TIÊN NỮ GIỚI TRƯỚC: ["female", "male"]
   * Chăm sóc da/làm đẹp: Skincare routine, dưỡng da
   * Yoga/Pilates: Tập luyện linh hoạt, meditation
   * Nấu ăn lành mạnh: Học nấu món healthy, meal prep
   * Self-care: Spa, chăm sóc bản thân
   * Lý do: Nữ giới thường quan tâm NHIỀU HƠN (không có nghĩa nam không phù hợp)

4. CHỈ NAM GIỚI: ["male"]
   * Các vấn đề sinh học nam: Kiểm tra sức khỏe tuyến tiền liệt
   * Rất hiếm, chỉ dùng khi THỰC SỰ không phù hợp với nữ

5. CHỈ NỮ GIỚI: ["female"]
   * Các vấn đề sinh học nữ: Kiểm tra sức khỏe phụ khoa, chăm sóc thai kỳ
   * Rất hiếm, chỉ dùng khi THỰC SỰ không phù hợp với nam

⚠️ LƯU Ý QUAN TRỌNG VỀ GIỚI TÍNH:
- TRÁNH rập khuôn giới tính: Yoga KHÔNG chỉ dành cho nữ, Gym KHÔNG chỉ dành cho nam
- Phần lớn thói quen vẫn là ["male", "female"]
- Chỉ thay đổi thứ tự ưu tiên khi có sự khác biệt RÕ RÀNG về mức độ quan tâm và mức phổ biến
- Khi mức độ phù hợp tương đương → dùng ["male", "female"]

VÍ DỤ CỤ THỂ VỀ PHÂN LOẠI:

1. "Uống 8 ly nước mỗi ngày"
   - targetAgeGroups: ["young_adult", "adult", "middle_aged", "teens"]
   - targetGenders: ["male", "female"]
   - Lý do: Phù hợp mọi người, ưu tiên người trưởng thành

2. "Tập gym tăng cơ 1 giờ"
   - targetAgeGroups: ["young_adult", "adult"]
   - targetGenders: ["male", "female"] 
   - Lý do: Nam quan tâm nhiều hơn nhưng nữ cũng tập gym

3. "Skincare routine buổi tối"
   - targetAgeGroups: ["young_adult", "adult", "teens", "middle_aged"]
   - targetGenders: ["female", "male"]
   - Lý do: Nữ quan tâm nhiều hơn nhưng nam cũng cần chăm sóc da

4. "Học lập trình Python 1 giờ/ngày"
   - targetAgeGroups: ["young_adult", "teens", "adult"]
   - targetGenders: ["male", "female"]
   - Lý do: Nam quan tâm công nghệ nhiều hơn nhưng ngành IT đang cân bằng giới tính

5. "Đi bộ nhẹ nhàng 30 phút"
   - targetAgeGroups: ["middle_aged", "elderly", "adult"]
   - targetGenders: ["male", "female"]
   - Lý do: Phù hợp mọi giới tính, ưu tiên người lớn tuổi

6. "Chơi với con 1 giờ mỗi ngày"
   - targetAgeGroups: ["adult", "young_adult"]
   - targetGenders: ["male", "female"]
   - Lý do: Phù hợp cả bố và mẹ

🎯 TRACKINGMODE - QUAN TRỌNG:

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
   - Ngủ đủ 8 tiếng → trackingMode: "check", targetCount: 1, unit: "lần"

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

📝 FORMAT TRẢ VỀ:

{
  "suggestions": [
    {
      "name": "Tên thói quen",
      "description": "Mô tả chi tiết",
      "category": "${category}",
      "difficulty": "easy|medium|hard",
      "frequency": "daily|weekly|monthly",
      "trackingMode": "check|count",
      "targetCount": 1,
      "unit": "lần|trang|km|ly...",
      "icon": "emoji",
      "color": "#HEX",
      "tags": ["tag1", "tag2"],
      "requiredScore": 0,
      "targetPersonas": ["persona1", "persona2"],
      "targetAgeGroups": ["age1", "age2"],
      "targetGenders": ["male", "female"] hoặc ["female", "male"] hoặc ["male"] hoặc ["female"],
      "triggerConditions": { "question_id": [1, 2] }
    }
  ]
}
 CHECKLIST TRƯỚC KHI TẠO:
1. TargetAgeGroups có sắp xếp theo độ ƯU TIÊN chưa?
2. TargetGenders có phù hợp với thói quen chưa?
3. Có cần ưu tiên một giới tính không? (nếu có → sắp xếp thứ tự)
4. TrackingMode đã chọn đúng (check vs count) chưa?
5. Difficulty có cân đối (50-30-20) chưa?`;

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
  health: 8,
  productivity: 8,
  learning: 10,
  mindful: 8,
  finance: 8,
  digital: 8,
  social: 8,
  fitness: 10,
  sleep: 10,
  energy: 8,
  control: 8
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
      console.log(`   Đã tạo ${suggestions.length} suggestions\n`);
    } else {
      console.log(`   Không tạo được suggestions\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  const outputPath = path.resolve(__dirname, './habitSuggestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(allSuggestions, null, 2));

  console.log('='.repeat(60));
  console.log(' HOÀN TẤT TẠO GỢI Ý THÓI QUEN!');
  console.log(` Tổng: ${allSuggestions.length} suggestions`);
  console.log(` Đã lưu vào: ${outputPath}`);
};

main();