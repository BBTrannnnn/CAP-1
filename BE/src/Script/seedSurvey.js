import mongoose from 'mongoose';
import { Question, HabitSuggestion } from '../models/Survey.js';
import { HabitTemplate } from '../models/Habit.js';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
dotenv.config();

// Connect to MongoDB

// Survey Questions
const surveyQuestions = [
  {
    id: 'health_1',
    text: 'Mức độ hoạt động thể chất hiện tại của bạn như thế nào?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h1_1', text: 'Rất thấp (hiếm khi tập)', value: 1 },
      { id: 'h1_2', text: 'Thấp (1-2 lần/tuần)', value: 2 },
      { id: 'h1_3', text: 'Trung bình (3-4 lần/tuần)', value: 3 },
      { id: 'h1_4', text: 'Cao (5+ lần/tuần)', value: 4 }
    ]
  },
  {
    id: 'health_2',
    text: 'Chất lượng giấc ngủ của bạn như thế nào?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h2_1', text: 'Kém (dưới 6 tiếng)', value: 1 },
      { id: 'h2_2', text: 'Khá (6-7 tiếng)', value: 2 },
      { id: 'h2_3', text: 'Tốt (7-8 tiếng)', value: 3 },
      { id: 'h2_4', text: 'Xuất sắc (trên 8 tiếng)', value: 4 }
    ]
  },
  {
    id: 'productivity_1',
    text: 'Bạn quản lý công việc hằng ngày như thế nào?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p1_1', text: 'Thường cảm thấy quá tải', value: 1 },
      { id: 'p1_2', text: 'Quản lý được nhưng có thể tốt hơn', value: 2 },
      { id: 'p1_3', text: 'Có hệ thống tổ chức tốt', value: 3 },
      { id: 'p1_4', text: 'Rất có tổ chức và hiệu quả', value: 4 }
    ]
  },
  {
    id: 'learning_1',
    text: 'Bạn có thường xuyên học hỏi điều mới không?',
    type: 'single',
    category: 'learning',
    options: [
      { id: 'l1_1', text: 'Hiếm khi', value: 1 },
      { id: 'l1_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'l1_3', text: 'Thường xuyên', value: 3 },
      { id: 'l1_4', text: 'Hằng ngày', value: 4 }
    ]
  },
  {
    id: 'mindful_1',
    text: 'Bạn quản lý stress như thế nào?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm1_1', text: 'Khó kiểm soát stress', value: 1 },
      { id: 'm1_2', text: 'Có một vài cách đối phó', value: 2 },
      { id: 'm1_3', text: 'Quản lý stress khá tốt', value: 3 },
      { id: 'm1_4', text: 'Rất tốt trong việc thư giãn', value: 4 }
    ]
  },
  {
    id: 'finance_1',
    text: 'Tình hình tài chính cá nhân của bạn?',
    type: 'single',
    category: 'finance',
    options: [
      { id: 'f1_1', text: 'Không theo dõi chi tiêu', value: 1 },
      { id: 'f1_2', text: 'Theo dõi nhưng chưa có kế hoạch', value: 2 },
      { id: 'f1_3', text: 'Có ngân sách và tiết kiệm', value: 3 },
      { id: 'f1_4', text: 'Quản lý tài chính rất tốt', value: 4 }
    ]
  }
];

// Habit Templates
const habitTemplates = [
  // Health
  {
    name: 'Uống 8 ly nước mỗi ngày',
    description: 'Duy trì đủ nước cho cơ thể để cải thiện sức khỏe tổng thể',
    category: 'health',
    defaultIcon: '💧',
    defaultColor: '#3B82F6',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Đặt chai nước trên bàn làm việc', 'Uống nước ngay khi thức dậy', 'Dùng app nhắc nhở'],
    benefits: ['Cải thiện làn da', 'Tăng năng lượng', 'Hỗ trợ tiêu hóa'],
    isPopular: true
  },
  {
    name: 'Ăn 5 phần rau quả mỗi ngày',
    description: 'Bổ sung vitamin và chất xơ cần thiết cho cơ thể',
    category: 'health',
    defaultIcon: '🥬',
    defaultColor: '#22C55E',
    difficulty: 'medium',
    estimatedTime: 15,
    tips: ['Chuẩn bị trái cây sẵn', 'Thêm rau vào mỗi bữa ăn'],
    benefits: ['Tăng cường miễn dịch', 'Cải thiện tiêu hóa'],
    isPopular: true
  },
  {
    name: 'Kiểm tra sức khỏe định kỳ',
    description: 'Thăm khám sức khỏe tổng quát định kỳ để phát hiện sớm bệnh tật',
    category: 'health',
    defaultIcon: '🏥',
    defaultColor: '#EF4444',
    suggestedFrequency: 'monthly',
    difficulty: 'easy',
    estimatedTime: 120,
    benefits: ['Phát hiện sớm bệnh tật', 'An tâm về sức khỏe']
  },

  // Fitness
  {
    name: 'Tập thể dục 30 phút',
    description: 'Duy trì hoạt động thể chất để khỏe mạnh và có năng lượng',
    category: 'fitness',
    defaultIcon: '🏃',
    defaultColor: '#F59E0B',
    difficulty: 'medium',
    estimatedTime: 30,
    tips: ['Bắt đầu với 10 phút', 'Chọn hoạt động yêu thích', 'Tập cùng bạn bè'],
    benefits: ['Tăng sức bền', 'Cải thiện tâm trạng', 'Giảm cân'],
    isPopular: true
  },
  {
    name: 'Đi bộ 10,000 bước',
    description: 'Duy trì hoạt động đi bộ để cải thiện sức khỏe tim mạch',
    category: 'fitness',
    defaultIcon: '👟',
    defaultColor: '#6366F1',
    difficulty: 'easy',
    estimatedTime: 60,
    tips: ['Sử dụng cầu thang thay vì thang máy', 'Đi bộ khi nói chuyện điện thoại'],
    benefits: ['Cải thiện sức khỏe tim mạch', 'Đốt cháy calories']
  },
  {
    name: 'Tập yoga buổi sáng',
    description: 'Bắt đầu ngày mới với yoga để thư giãn và linh hoạt',
    category: 'fitness',
    defaultIcon: '🧘',
    defaultColor: '#8B5CF6',
    difficulty: 'easy',
    estimatedTime: 15,
    benefits: ['Tăng độ linh hoạt', 'Giảm stress', 'Cải thiện tư thế']
  },

  // Learning
  {
    name: 'Đọc sách 20 phút',
    description: 'Duy trì thói quen đọc sách để mở rộng kiến thức',
    category: 'learning',
    defaultIcon: '📚',
    defaultColor: '#10B981',
    difficulty: 'easy',
    estimatedTime: 20,
    tips: ['Đọc trước khi ngủ', 'Chọn sách yêu thích', 'Ghi chú ý tưởng hay'],
    benefits: ['Mở rộng kiến thức', 'Cải thiện tập trung', 'Giảm stress'],
    isPopular: true
  },
  {
    name: 'Học ngoại ngữ 15 phút',
    description: 'Học một ngôn ngữ mới mỗi ngày để phát triển bản thân',
    category: 'learning',
    defaultIcon: '🌐',
    defaultColor: '#EC4899',
    difficulty: 'medium',
    estimatedTime: 15,
    tips: ['Dùng app học ngôn ngữ', 'Nghe nhạc/xem phim bằng ngôn ngữ đó'],
    benefits: ['Mở rộng cơ hội nghề nghiệp', 'Kích thích trí não']
  },

  // Mindful
  {
    name: 'Thiền 10 phút',
    description: 'Thực hành thiền định để giảm stress và tăng cường tập trung',
    category: 'mindful',
    defaultIcon: '🧘',
    defaultColor: '#8B5CF6',
    difficulty: 'medium',
    estimatedTime: 10,
    tips: ['Tìm nơi yên tĩnh', 'Sử dụng app hướng dẫn thiền', 'Thiền vào cùng giờ mỗi ngày'],
    benefits: ['Giảm stress', 'Cải thiện tập trung', 'Tăng cường hạnh phúc'],
    isPopular: true
  },
  {
    name: 'Viết nhật ký biết ơn',
    description: 'Ghi lại 3 điều biết ơn mỗi ngày để tăng cường tích cực',
    category: 'mindful',
    defaultIcon: '📝',
    defaultColor: '#F59E0B',
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Viết vào buổi tối', 'Ghi chi tiết cảm xúc', 'Đọc lại khi buồn'],
    benefits: ['Tăng cường tích cực', 'Cải thiện tâm trạng']
  },

  // Finance
  {
    name: 'Theo dõi chi tiêu hàng ngày',
    description: 'Ghi chép tất cả chi tiêu để quản lý tài chính tốt hơn',
    category: 'finance',
    defaultIcon: '💰',
    defaultColor: '#22C55E',
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Dùng app quản lý tài chính', 'Chụp ảnh hóa đơn', 'Xem lại cuối tuần'],
    benefits: ['Kiểm soát chi tiêu', 'Tiết kiệm tiền']
  },
  {
    name: 'Tiết kiệm 50,000đ mỗi ngày',
    description: 'Để dành một khoản nhỏ mỗi ngày để xây dựng quỹ dự phòng',
    category: 'finance',
    defaultIcon: '🏦',
    defaultColor: '#10B981',
    difficulty: 'medium',
    estimatedTime: 2,
    benefits: ['Xây dựng quỹ dự phòng', 'Tạo thói quen tiết kiệm']
  },

  // Digital
  {
    name: 'Hạn chế social media',
    description: 'Giảm thời gian lướt mạng xã hội xuống dưới 1 tiếng/ngày',
    category: 'digital',
    defaultIcon: '📱',
    defaultColor: '#EF4444',
    difficulty: 'hard',
    estimatedTime: 60,
    tips: ['Tắt thông báo không cần thiết', 'Để điện thoại xa khi làm việc'],
    benefits: ['Tăng tập trung', 'Có thêm thời gian cho việc khác']
  },
  {
    name: 'Tắt điện thoại trước khi ngủ 1 tiếng',
    description: 'Ngừng sử dụng thiết bị điện tử trước giờ ngủ để cải thiện giấc ngủ',
    category: 'digital',
    defaultIcon: '🌙',
    defaultColor: '#6B7280',
    difficulty: 'medium',
    estimatedTime: 5,
    benefits: ['Cải thiện chất lượng giấc ngủ', 'Giảm căng thẳng mắt']
  },

  // Social
  {
    name: 'Gọi điện cho gia đình',
    description: 'Duy trì liên lạc với gia đình để củng cố mối quan hệ',
    category: 'social',
    defaultIcon: '📞',
    defaultColor: '#EC4899',
    suggestedFrequency: 'weekly',
    difficulty: 'easy',
    estimatedTime: 15,
    benefits: ['Củng cố mối quan hệ gia đình', 'Chia sẻ cảm xúc']
  },
  {
    name: 'Gặp gỡ bạn bè',
    description: 'Dành thời gian gặp mặt bạn bè để duy trì tình bạn',
    category: 'social',
    defaultIcon: '👥',
    defaultColor: '#F59E0B',
    suggestedFrequency: 'weekly',
    difficulty: 'easy',
    estimatedTime: 120,
    benefits: ['Duy trì tình bạn', 'Giảm căng thẳng']
  },

  // Sleep
  {
    name: 'Ngủ đúng giờ (11 PM)',
    description: 'Duy trì giờ giấc ngủ đều đặn để cải thiện sức khỏe',
    category: 'sleep',
    defaultIcon: '😴',
    defaultColor: '#6366F1',
    difficulty: 'medium',
    estimatedTime: 480,
    tips: ['Tạo thói quen trước khi ngủ', 'Tránh caffeine buổi chiều'],
    benefits: ['Cải thiện chất lượng giấc ngủ', 'Tăng năng lượng']
  },
  {
    name: 'Ngủ đủ 8 tiếng',
    description: 'Đảm bảo có đủ giấc ngủ để phục hồi cơ thể',
    category: 'sleep',
    defaultIcon: '🛌',
    defaultColor: '#8B5CF6',
    difficulty: 'medium',
    estimatedTime: 480,
    benefits: ['Phục hồi cơ thể', 'Cải thiện trí nhớ']
  },

  // Energy
  {
    name: 'Uống trà xanh thay cà phê',
    description: 'Thay thế cà phê bằng trà xanh để có năng lượng bền vững',
    category: 'energy',
    defaultIcon: '🍵',
    defaultColor: '#22C55E',
    difficulty: 'easy',
    estimatedTime: 5,
    benefits: ['Năng lượng ổn định', 'Chống oxy hóa']
  },
  {
    name: 'Nghỉ ngơi giữa giờ làm việc',
    description: 'Nghỉ ngơi 5-10 phút sau mỗi giờ làm việc để tránh kiệt sức',
    category: 'energy',
    defaultIcon: '⏰',
    defaultColor: '#F59E0B',
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Đặt timer nhắc nhở', 'Đứng dậy và vận động nhẹ'],
    benefits: ['Duy trì năng lượng', 'Tăng hiệu suất làm việc']
  }
];

// Habit Suggestions (from survey analysis)
const habitSuggestions = [
  {
    name: 'Tập thể dục buổi sáng',
    description: 'Bắt đầu ngày với 20 phút tập thể dục nhẹ',
    category: 'health',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 20,
    icon: '🏃',
    color: '#F59E0B',
    tags: ['morning', 'exercise', 'energy'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'balanced-lifestyle']
  },
  {
    name: 'Sử dụng kỹ thuật Pomodoro',
    description: 'Làm việc tập trung 25 phút, nghỉ 5 phút',
    category: 'productivity',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 30,
    icon: '⏰',
    color: '#EF4444',
    tags: ['focus', 'productivity', 'time-management'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven']
  },
  {
    name: 'Đọc sách chuyên môn',
    description: 'Dành 30 phút mỗi ngày để đọc sách phát triển kỹ năng',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 30,
    icon: '📚',
    color: '#10B981',
    tags: ['learning', 'skill', 'career'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker', 'productivity-driven']
  }
];

// Seed functions
async function seedSurveyQuestions() {
  try {
    await Question.deleteMany({});
    await Question.insertMany(surveyQuestions);
    console.log('✅ Survey questions seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding survey questions:', error);
  }
}

async function seedHabitTemplates() {
  try {
    await HabitTemplate.deleteMany({});
    await HabitTemplate.insertMany(habitTemplates);
    console.log('✅ Habit templates seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding habit templates:', error);
  }
}

async function seedHabitSuggestions() {
  try {
    await HabitSuggestion.deleteMany({});
    await HabitSuggestion.insertMany(habitSuggestions);
    console.log('✅ Habit suggestions seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding habit suggestions:', error);
  }
}

// Main seed function
async function seedAll() {
  await connectDB();
  
  console.log('🌱 Starting to seed data...');
  await seedSurveyQuestions();
  await seedHabitTemplates();
  await seedHabitSuggestions();
  console.log('🎉 All data seeded successfully!');
  
  process.exit(0);
}

// Export individual functions
export {
    seedSurveyQuestions,
    seedHabitTemplates,
    seedHabitSuggestions,
    seedAll
};

// Run if called directly
if (process.argv[1].endsWith('seedSurvey.js')) {
    seedAll();
}