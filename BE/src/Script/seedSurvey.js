
// Survey Questions
const surveyQuestions = [
  // === HEALTH ===
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
    id: 'health_3',
    text: 'Bạn uống đủ nước mỗi ngày không?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h3_1', text: 'Hiếm khi nhớ uống nước', value: 1 },
      { id: 'h3_2', text: 'Uống nhưng chưa đủ', value: 2 },
      { id: 'h3_3', text: 'Uống đủ 1.5-2L/ngày', value: 3 },
      { id: 'h3_4', text: 'Luôn duy trì đủ nước', value: 4 }
    ]
  },
  {
    id: 'health_4',
    text: 'Chế độ ăn uống của bạn như thế nào?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h4_1', text: 'Ăn uống tùy tiện, nhiều đồ ăn nhanh', value: 1 },
      { id: 'h4_2', text: 'Cố gắng ăn uống lành mạnh', value: 2 },
      { id: 'h4_3', text: 'Ăn uống cân bằng, có rau quả', value: 3 },
      { id: 'h4_4', text: 'Chế độ ăn rất lành mạnh và khoa học', value: 4 }
    ]
  },

  // === PRODUCTIVITY ===
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
    id: 'productivity_2',
    text: 'Khả năng tập trung của bạn khi làm việc?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p2_1', text: 'Dễ bị phân tâm', value: 1 },
      { id: 'p2_2', text: 'Tập trung được 30-45 phút', value: 2 },
      { id: 'p2_3', text: 'Tập trung tốt trong 1-2 giờ', value: 3 },
      { id: 'p2_4', text: 'Có thể tập trung sâu nhiều giờ', value: 4 }
    ]
  },
  {
    id: 'productivity_3',
    text: 'Bạn có danh sách việc cần làm (to-do list) không?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p3_1', text: 'Không có, làm việc tùy hứng', value: 1 },
      { id: 'p3_2', text: 'Thỉnh thoảng ghi chép', value: 2 },
      { id: 'p3_3', text: 'Có to-do list hằng ngày', value: 3 },
      { id: 'p3_4', text: 'Có hệ thống quản lý công việc chi tiết', value: 4 }
    ]
  },

  // === LEARNING ===
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
    id: 'learning_2',
    text: 'Bạn đọc sách bao lâu một lần?',
    type: 'single',
    category: 'learning',
    options: [
      { id: 'l2_1', text: 'Hiếm khi đọc sách', value: 1 },
      { id: 'l2_2', text: 'Vài tháng một lần', value: 2 },
      { id: 'l2_3', text: 'Mỗi tháng 1-2 cuốn', value: 3 },
      { id: 'l2_4', text: 'Đọc sách hằng ngày', value: 4 }
    ]
  },
  {
    id: 'learning_3',
    text: 'Bạn có học ngoại ngữ hoặc kỹ năng mới không?',
    type: 'single',
    category: 'learning',
    options: [
      { id: 'l3_1', text: 'Chưa có kế hoạch học', value: 1 },
      { id: 'l3_2', text: 'Có ý định nhưng chưa bắt đầu', value: 2 },
      { id: 'l3_3', text: 'Đang học 1-2 lần/tuần', value: 3 },
      { id: 'l3_4', text: 'Học đều đặn mỗi ngày', value: 4 }
    ]
  },

  // === MINDFUL ===
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
    id: 'mindful_2',
    text: 'Bạn có thực hành thiền, yoga hay các hoạt động mindfulness không?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm2_1', text: 'Chưa từng thử', value: 1 },
      { id: 'm2_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'm2_3', text: 'Vài lần mỗi tuần', value: 3 },
      { id: 'm2_4', text: 'Thực hành đều đặn hằng ngày', value: 4 }
    ]
  },
  {
    id: 'mindful_3',
    text: 'Bạn có viết nhật ký hoặc ghi lại cảm xúc không?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm3_1', text: 'Không bao giờ', value: 1 },
      { id: 'm3_2', text: 'Thỉnh thoảng khi buồn', value: 2 },
      { id: 'm3_3', text: 'Vài lần mỗi tuần', value: 3 },
      { id: 'm3_4', text: 'Viết nhật ký hằng ngày', value: 4 }
    ]
  },

  // === FINANCE ===
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
  },
  {
    id: 'finance_2',
    text: 'Bạn có tiết kiệm đều đặn không?',
    type: 'single',
    category: 'finance',
    options: [
      { id: 'f2_1', text: 'Không có tiết kiệm', value: 1 },
      { id: 'f2_2', text: 'Tiết kiệm khi có dư', value: 2 },
      { id: 'f2_3', text: 'Tiết kiệm 10-20% thu nhập', value: 3 },
      { id: 'f2_4', text: 'Tiết kiệm trên 20% thu nhập', value: 4 }
    ]
  },

  // === DIGITAL WELLBEING ===
  {
    id: 'digital_1',
    text: 'Bạn sử dụng mạng xã hội bao nhiêu giờ mỗi ngày?',
    type: 'single',
    category: 'digital',
    options: [
      { id: 'd1_1', text: 'Trên 4 giờ/ngày', value: 1 },
      { id: 'd1_2', text: '2-4 giờ/ngày', value: 2 },
      { id: 'd1_3', text: '1-2 giờ/ngày', value: 3 },
      { id: 'd1_4', text: 'Dưới 1 giờ/ngày', value: 4 }
    ]
  },
  {
    id: 'digital_2',
    text: 'Bạn có sử dụng điện thoại trước khi ngủ không?',
    type: 'single',
    category: 'digital',
    options: [
      { id: 'd2_1', text: 'Luôn luôn, cho đến khi ngủ', value: 1 },
      { id: 'd2_2', text: 'Thường xuyên', value: 2 },
      { id: 'd2_3', text: 'Thỉnh thoảng', value: 3 },
      { id: 'd2_4', text: 'Không, tắt điện thoại trước 1 tiếng', value: 4 }
    ]
  },

  // === SOCIAL ===
  {
    id: 'social_1',
    text: 'Bạn duy trì mối quan hệ với gia đình thế nào?',
    type: 'single',
    category: 'social',
    options: [
      { id: 's1_1', text: 'Hiếm khi liên lạc', value: 1 },
      { id: 's1_2', text: 'Liên lạc vài lần mỗi tháng', value: 2 },
      { id: 's1_3', text: 'Liên lạc mỗi tuần', value: 3 },
      { id: 's1_4', text: 'Liên lạc hằng ngày', value: 4 }
    ]
  },
  {
    id: 'social_2',
    text: 'Bạn gặp gỡ bạn bè bao lâu một lần?',
    type: 'single',
    category: 'social',
    options: [
      { id: 's2_1', text: 'Rất hiếm, vài tháng/lần', value: 1 },
      { id: 's2_2', text: 'Mỗi tháng 1-2 lần', value: 2 },
      { id: 's2_3', text: 'Mỗi tuần', value: 3 },
      { id: 's2_4', text: 'Vài lần mỗi tuần', value: 4 }
    ]
  },

  // === FITNESS ===
  {
    id: 'fitness_1',
    text: 'Bạn tập gym hoặc cardio bao lâu một lần?',
    type: 'single',
    category: 'fitness',
    options: [
      { id: 'fit1_1', text: 'Không bao giờ', value: 1 },
      { id: 'fit1_2', text: '1-2 lần/tuần', value: 2 },
      { id: 'fit1_3', text: '3-4 lần/tuần', value: 3 },
      { id: 'fit1_4', text: '5+ lần/tuần', value: 4 }
    ]
  },
  {
    id: 'fitness_2',
    text: 'Bạn đi bộ bao nhiêu bước mỗi ngày?',
    type: 'single',
    category: 'fitness',
    options: [
      { id: 'fit2_1', text: 'Dưới 3000 bước', value: 1 },
      { id: 'fit2_2', text: '3000-6000 bước', value: 2 },
      { id: 'fit2_3', text: '6000-10000 bước', value: 3 },
      { id: 'fit2_4', text: 'Trên 10000 bước', value: 4 }
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
    commonObstacles: ['Quên uống nước', 'Không thích vị nước lọc', 'Bận rộn quá'],
    benefits: ['Cải thiện làn da', 'Tăng năng lượng', 'Hỗ trợ tiêu hóa'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Ăn 5 phần rau quả mỗi ngày',
    description: 'Bổ sung vitamin và chất xơ cần thiết cho cơ thể',
    category: 'health',
    defaultIcon: '🥬',
    defaultColor: '#22C55E',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 15,
    tips: ['Chuẩn bị trái cây sẵn', 'Thêm rau vào mỗi bữa ăn', 'Làm sinh tố rau quả'],
    commonObstacles: ['Rau quả đắt', 'Không có thời gian chuẩn bị', 'Không thích ăn rau'],
    benefits: ['Tăng cường miễn dịch', 'Cải thiện tiêu hóa', 'Giảm nguy cơ bệnh tật'],
    isPopular: true,
    usageCount: 0
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
    tips: ['Đặt lịch trước', 'Chuẩn bị danh sách câu hỏi cho bác sĩ', 'Mang theo bảo hiểm y tế'],
    commonObstacles: ['Không có thời gian', 'Chi phí cao', 'Sợ khám bệnh'],
    benefits: ['Phát hiện sớm bệnh tật', 'An tâm về sức khỏe', 'Theo dõi chỉ số sức khỏe'],
    isPopular: false,
    usageCount: 0
  },

  // Fitness
  {
    name: 'Tập thể dục 30 phút',
    description: 'Duy trì hoạt động thể chất để khỏe mạnh và có năng lượng',
    category: 'fitness',
    defaultIcon: '🏃',
    defaultColor: '#F59E0B',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 30,
    tips: ['Bắt đầu với 10 phút', 'Chọn hoạt động yêu thích', 'Tập cùng bạn bè'],
    commonObstacles: ['Thiếu động lực', 'Mệt mỏi', 'Không biết tập gì'],
    benefits: ['Tăng sức bền', 'Cải thiện tâm trạng', 'Giảm cân', 'Tăng cường sức khỏe tim mạch'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Đi bộ 10,000 bước',
    description: 'Duy trì hoạt động đi bộ để cải thiện sức khỏe tim mạch',
    category: 'fitness',
    defaultIcon: '👟',
    defaultColor: '#6366F1',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 60,
    tips: ['Sử dụng cầu thang thay vì thang máy', 'Đi bộ khi nói chuyện điện thoại', 'Đi bộ đến chợ thay vì lái xe'],
    commonObstacles: ['Thời tiết xấu', 'Không có thời gian', 'Chân đau'],
    benefits: ['Cải thiện sức khỏe tim mạch', 'Đốt cháy calories', 'Giảm stress'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Tập yoga buổi sáng',
    description: 'Bắt đầu ngày mới với yoga để thư giãn và linh hoạt',
    category: 'fitness',
    defaultIcon: '🧘',
    defaultColor: '#8B5CF6',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Tập trên tấm thảm yoga', 'Xem video hướng dẫn', 'Tập vào buổi sáng sau khi thức dậy'],
    commonObstacles: ['Không đủ không gian', 'Cơ thể cứng', 'Không biết các động tác'],
    benefits: ['Tăng độ linh hoạt', 'Giảm stress', 'Cải thiện tư thế', 'Tăng cường cân bằng'],
    isPopular: true,
    usageCount: 0
  },

  // Learning
  {
    name: 'Đọc sách 20 phút',
    description: 'Duy trì thói quen đọc sách để mở rộng kiến thức',
    category: 'learning',
    defaultIcon: '📚',
    defaultColor: '#10B981',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 20,
    tips: ['Đọc trước khi ngủ', 'Chọn sách yêu thích', 'Ghi chú ý tưởng hay', 'Mang sách theo người'],
    commonObstacles: ['Dễ bị phân tâm', 'Không tìm được sách hay', 'Buồn ngủ khi đọc'],
    benefits: ['Mở rộng kiến thức', 'Cải thiện tập trung', 'Giảm stress', 'Phát triển tư duy'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Học ngoại ngữ 15 phút',
    description: 'Học một ngôn ngữ mới mỗi ngày để phát triển bản thân',
    category: 'learning',
    defaultIcon: '📚',
    defaultColor: '#EC4899',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 15,
    tips: ['Dùng app học ngôn ngữ', 'Nghe nhạc/xem phim bằng ngôn ngữ đó', 'Tập nói với người bản xứ'],
    commonObstacles: ['Quên từ vựng', 'Thiếu động lực', 'Không có môi trường thực hành'],
    benefits: ['Mở rộng cơ hội nghề nghiệp', 'Kích thích trí não', 'Hiểu văn hóa khác'],
    isPopular: true,
    usageCount: 0
  },

  // Mindful
  {
    name: 'Thiền 10 phút',
    description: 'Thực hành thiền định để giảm stress và tăng cường tập trung',
    category: 'mindful',
    defaultIcon: '🧘',
    defaultColor: '#8B5CF6',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 10,
    tips: ['Tìm nơi yên tĩnh', 'Sử dụng app hướng dẫn thiền', 'Thiền vào cùng giờ mỗi ngày', 'Tập trung vào hơi thở'],
    commonObstacles: ['Không thể ngồi yên', 'Suy nghĩ quá nhiều', 'Thiếu kiên nhẫn'],
    benefits: ['Giảm stress', 'Cải thiện tập trung', 'Tăng cường hạnh phúc', 'Kiểm soát cảm xúc tốt hơn'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Viết nhật ký biết ơn',
    description: 'Ghi lại 3 điều biết ơn mỗi ngày để tăng cường tích cực',
    category: 'mindful',
    defaultIcon: '📖',
    defaultColor: '#F59E0B',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Viết vào buổi tối', 'Ghi chi tiết cảm xúc', 'Đọc lại khi buồn', 'Dùng sổ tay đẹp'],
    commonObstacles: ['Không biết viết gì', 'Quên viết', 'Cảm thấy không có gì để biết ơn'],
    benefits: ['Tăng cường tích cực', 'Cải thiện tâm trạng', 'Nhìn nhận cuộc sống lạc quan hơn'],
    isPopular: true,
    usageCount: 0
  },

  // Finance
  {
    name: 'Theo dõi chi tiêu hàng ngày',
    description: 'Ghi chép tất cả chi tiêu để quản lý tài chính tốt hơn',
    category: 'finance',
    defaultIcon: '💰',
    defaultColor: '#22C55E',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Dùng app quản lý tài chính', 'Chụp ảnh hóa đơn', 'Xem lại cuối tuần', 'Phân loại chi tiêu'],
    commonObstacles: ['Quên ghi chép', 'Lười theo dõi', 'Không biết phân loại'],
    benefits: ['Kiểm soát chi tiêu', 'Tiết kiệm tiền', 'Nhận biết thói quen chi tiêu xấu'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Tiết kiệm 50,000đ mỗi ngày',
    description: 'Để dành một khoản nhỏ mỗi ngày để xây dựng quỹ dự phòng',
    category: 'finance',
    defaultIcon: '💰',
    defaultColor: '#10B981',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 2,
    tips: ['Tự động chuyển tiền vào tài khoản tiết kiệm', 'Cắt giảm chi tiêu không cần thiết', 'Đặt mục tiêu cụ thể'],
    commonObstacles: ['Thu nhập thấp', 'Chi tiêu phát sinh', 'Thiếu kỷ luật'],
    benefits: ['Xây dựng quỹ dự phòng', 'Tạo thói quen tiết kiệm', 'An tâm tài chính'],
    isPopular: true,
    usageCount: 0
  },

  // Digital
  {
    name: 'Hạn chế social media',
    description: 'Giảm thời gian lướt mạng xã hội xuống dưới 1 tiếng/ngày',
    category: 'digital',
    defaultIcon: '📱',
    defaultColor: '#EF4444',
    suggestedFrequency: 'daily',
    difficulty: 'hard',
    estimatedTime: 60,
    tips: ['Tắt thông báo không cần thiết', 'Để điện thoại xa khi làm việc', 'Dùng app giới hạn thời gian', 'Xóa app social media khỏi màn hình chính'],
    commonObstacles: ['Nghiện social media', 'FOMO (sợ bỏ lỡ thông tin)', 'Thói quen mở app tự động'],
    benefits: ['Tăng tập trung', 'Có thêm thời gian cho việc khác', 'Giảm so sánh bản thân với người khác'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Tắt điện thoại trước khi ngủ 1 tiếng',
    description: 'Ngừng sử dụng thiết bị điện tử trước giờ ngủ để cải thiện giấc ngủ',
    category: 'digital',
    defaultIcon: '💤',
    defaultColor: '#6B7280',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 5,
    tips: ['Đặt điện thoại xa giường ngủ', 'Đọc sách thay vì lướt điện thoại', 'Dùng đồng hồ báo thức thay vì điện thoại'],
    commonObstacles: ['Thói quen lướt điện thoại trước khi ngủ', 'Lo lắng bỏ lỡ tin nhắn', 'Buồn chán'],
    benefits: ['Cải thiện chất lượng giấc ngủ', 'Giảm căng thẳng mắt', 'Ngủ nhanh hơn'],
    isPopular: true,
    usageCount: 0
  },

  // Social
  {
    name: 'Gọi điện cho gia đình',
    description: 'Duy trì liên lạc với gia đình để củng cố mối quan hệ',
    category: 'social',
    defaultIcon: '📱',
    defaultColor: '#EC4899',
    suggestedFrequency: 'weekly',
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Đặt lịch gọi cố định', 'Chuẩn bị chủ đề trò chuyện', 'Video call để thân thiết hơn'],
    commonObstacles: ['Bận rộn', 'Không biết nói gì', 'Chênh lệch múi giờ'],
    benefits: ['Củng cố mối quan hệ gia đình', 'Chia sẻ cảm xúc', 'Giảm cô đơn'],
    isPopular: true,
    usageCount: 0
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
    tips: ['Lên kế hoạch trước', 'Chọn hoạt động cùng thích', 'Gặp gỡ định kỳ mỗi tuần'],
    commonObstacles: ['Bận công việc', 'Xa nhau', 'Lười ra ngoài'],
    benefits: ['Duy trì tình bạn', 'Giảm căng thẳng', 'Tăng cường hạnh phúc'],
    isPopular: true,
    usageCount: 0
  },

  // Sleep
  {
    name: 'Ngủ đúng giờ (11 PM)',
    description: 'Duy trì giờ giấc ngủ đều đặn để cải thiện sức khỏe',
    category: 'sleep',
    defaultIcon: '💤',
    defaultColor: '#6366F1',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 480,
    tips: ['Tạo thói quen trước khi ngủ', 'Tránh caffeine buổi chiều', 'Điều chỉnh ánh sáng phòng ngủ', 'Tắt điện thoại sớm'],
    commonObstacles: ['Thức khuya làm việc', 'Khó ngủ', 'Bị kích thích bởi màn hình'],
    benefits: ['Cải thiện chất lượng giấc ngủ', 'Tăng năng lượng', 'Cân bằng hormone'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Ngủ đủ 8 tiếng',
    description: 'Đảm bảo có đủ giấc ngủ để phục hồi cơ thể',
    category: 'sleep',
    defaultIcon: '💤',
    defaultColor: '#8B5CF6',
    suggestedFrequency: 'daily',
    difficulty: 'medium',
    estimatedTime: 480,
    tips: ['Tính ngược từ giờ thức dậy', 'Tạo môi trường ngủ thoải mái', 'Không uống nhiều nước trước khi ngủ'],
    commonObstacles: ['Mất ngủ', 'Thức khuya', 'Bị đánh thức giữa đêm'],
    benefits: ['Phục hồi cơ thể', 'Cải thiện trí nhớ', 'Tăng cường hệ miễn dịch'],
    isPopular: true,
    usageCount: 0
  },

  // Energy
  {
    name: 'Uống trà xanh thay cà phê',
    description: 'Thay thế cà phê bằng trà xanh để có năng lượng bền vững',
    category: 'energy',
    defaultIcon: '🍵',
    defaultColor: '#22C55E',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Pha trà xanh vào buổi sáng', 'Thử nhiều loại trà xanh khác nhau', 'Thêm chanh hoặc mật ong'],
    commonObstacles: ['Không quen vị trà', 'Vẫn thèm cà phê', 'Không biết pha trà'],
    benefits: ['Năng lượng ổn định', 'Chống oxy hóa', 'Giảm lo âu', 'Tốt cho tim mạch'],
    isPopular: true,
    usageCount: 0
  },
  {
    name: 'Nghỉ ngơi giữa giờ làm việc',
    description: 'Nghỉ ngơi 5-10 phút sau mỗi giờ làm việc để tránh kiệt sức',
    category: 'energy',
    defaultIcon: '⏰',
    defaultColor: '#F59E0B',
    suggestedFrequency: 'daily',
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Đặt timer nhắc nhở', 'Đứng dậy và vận động nhẹ', 'Nhìn xa để thư giãn mắt', 'Uống nước'],
    commonObstacles: ['Quá mải mê công việc', 'Áp lực deadline', 'Cảm thấy tội lỗi khi nghỉ'],
    benefits: ['Duy trì năng lượng', 'Tăng hiệu suất làm việc', 'Giảm mỏi mắt', 'Phòng tránh burn out'],
    isPopular: true,
    usageCount: 0
  }
];

// Habit Suggestions (from survey analysis)
const habitSuggestions = [
  // === HEALTH ===
  {
    name: 'Uống đủ 8 ly nước mỗi ngày',
    description: 'Duy trì đủ nước cho cơ thể để cải thiện sức khỏe tổng thể',
    category: 'health',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '💧',
    color: '#3B82F6',
    tags: ['hydration', 'health', 'wellness'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: {
      health_3: [1, 2] // Người uống nước ít
    }
  },
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
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: {
      health_1: [1, 2] // Hoạt động thể chất thấp
    }
  },
  {
    name: 'Ngủ đúng giờ (11 PM)',
    description: 'Duy trì giờ giấc ngủ đều đặn để cải thiện sức khỏe',
    category: 'health',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 480,
    icon: '😴',
    color: '#6366F1',
    tags: ['sleep', 'health', 'routine'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: {
      health_2: [1, 2] // Chất lượng giấc ngủ kém
    }
  },
  {
    name: 'Ăn 5 phần rau quả mỗi ngày',
    description: 'Bổ sung vitamin và chất xơ cần thiết cho cơ thể',
    category: 'health',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 15,
    icon: '🥬',
    color: '#22C55E',
    tags: ['nutrition', 'health', 'diet'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: {
      health_4: [1, 2] // Chế độ ăn chưa tốt
    }
  },

  // === PRODUCTIVITY ===
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
    targetPersonas: ['productivity-driven'],
    triggerConditions: {
      productivity_2: [1, 2] // Khả năng tập trung yếu
    }
  },
  {
    name: 'Viết to-do list mỗi sáng',
    description: 'Lên kế hoạch công việc trong ngày để tăng hiệu suất',
    category: 'productivity',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 10,
    icon: '✅',
    color: '#10B981',
    tags: ['planning', 'organization', 'productivity'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: {
      productivity_3: [1, 2] // Không có to-do list
    }
  },
  {
    name: 'Dọn dẹp bàn làm việc cuối ngày',
    description: 'Tạo không gian làm việc gọn gàng cho ngày hôm sau',
    category: 'productivity',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '🗂️',
    color: '#8B5CF6',
    tags: ['organization', 'workspace', 'productivity'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven'],
    triggerConditions: {
      productivity_1: [1, 2] // Quản lý công việc yếu
    }
  },

  // === LEARNING ===
  {
    name: 'Đọc sách chuyên môn 30 phút',
    description: 'Dành 30 phút mỗi ngày để đọc sách phát triển kỹ năng',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 30,
    icon: '📚',
    color: '#10B981',
    tags: ['learning', 'skill', 'career'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker', 'productivity-driven'],
    triggerConditions: {
      learning_2: [1, 2] // Đọc sách ít
    }
  },
  {
    name: 'Học ngoại ngữ 15 phút',
    description: 'Học một ngôn ngữ mới mỗi ngày để phát triển bản thân',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 15,
    icon: '🌐',
    color: '#EC4899',
    tags: ['language', 'skill', 'self-improvement'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker'],
    triggerConditions: {
      learning_3: [1, 2] // Chưa học kỹ năng mới
    }
  },
  {
    name: 'Xem video giáo dục',
    description: 'Xem TED talks hoặc video học tập 20 phút mỗi ngày',
    category: 'learning',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 20,
    icon: '📺',
    color: '#F59E0B',
    tags: ['learning', 'video', 'knowledge'],
    requiredScore: 0,
    targetPersonas: ['knowledge-seeker', 'balanced-lifestyle'],
    triggerConditions: {
      learning_1: [1, 2] // Học hỏi ít
    }
  },

  // === MINDFUL ===
  {
    name: 'Thiền 10 phút',
    description: 'Thực hành thiền định để giảm stress và tăng cường tập trung',
    category: 'mindful',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 10,
    icon: '🧘',
    color: '#8B5CF6',
    tags: ['meditation', 'mindfulness', 'stress-relief'],
    requiredScore: 2,
    targetPersonas: ['mindful-seeker'],
    triggerConditions: {
      mindful_1: [1, 2], // Quản lý stress kém
      mindful_2: [1, 2]  // Chưa thực hành mindfulness
    }
  },
  {
    name: 'Viết nhật ký biết ơn',
    description: 'Ghi lại 3 điều biết ơn mỗi ngày để tăng cường tích cực',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '📝',
    color: '#F59E0B',
    tags: ['gratitude', 'journaling', 'positivity'],
    requiredScore: 0,
    targetPersonas: ['mindful-seeker', 'balanced-lifestyle'],
    triggerConditions: {
      mindful_3: [1, 2] // Không viết nhật ký
    }
  },
  {
    name: 'Tập yoga buổi sáng',
    description: 'Bắt đầu ngày mới với yoga để thư giãn và linh hoạt',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 15,
    icon: '🧘‍♀️',
    color: '#EC4899',
    tags: ['yoga', 'flexibility', 'mindfulness'],
    requiredScore: 1,
    targetPersonas: ['mindful-seeker', 'health-focused'],
    triggerConditions: {
      mindful_2: [1, 2] // Chưa thực hành mindfulness
    }
  },

  // === FINANCE ===
  {
    name: 'Theo dõi chi tiêu hàng ngày',
    description: 'Ghi chép tất cả chi tiêu để quản lý tài chính tốt hơn',
    category: 'finance',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '💰',
    color: '#22C55E',
    tags: ['finance', 'budgeting', 'tracking'],
    requiredScore: 0,
    targetPersonas: ['finance-conscious', 'balanced-lifestyle'],
    triggerConditions: {
      finance_1: [1, 2] // Không theo dõi chi tiêu
    }
  },
  {
    name: 'Tiết kiệm 50,000đ mỗi ngày',
    description: 'Để dành một khoản nhỏ mỗi ngày để xây dựng quỹ dự phòng',
    category: 'finance',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 2,
    icon: '🏦',
    color: '#10B981',
    tags: ['savings', 'finance', 'money'],
    requiredScore: 1,
    targetPersonas: ['finance-conscious'],
    triggerConditions: {
      finance_2: [1, 2] // Không tiết kiệm
    }
  },
  {
    name: 'Đọc tin tức tài chính',
    description: 'Cập nhật kiến thức về tài chính cá nhân mỗi ngày',
    category: 'finance',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 10,
    icon: '📈',
    color: '#EF4444',
    tags: ['finance', 'learning', 'investment'],
    requiredScore: 1,
    targetPersonas: ['finance-conscious', 'knowledge-seeker'],
    triggerConditions: {
      finance_1: [1, 2, 3] // Muốn cải thiện tài chính
    }
  },

  // === DIGITAL WELLBEING ===
  {
    name: 'Hạn chế social media dưới 1 tiếng',
    description: 'Giảm thời gian lướt mạng xã hội để tập trung vào việc quan trọng',
    category: 'digital',
    difficulty: 'hard',
    frequency: 'daily',
    estimatedTime: 60,
    icon: '📱',
    color: '#EF4444',
    tags: ['digital-detox', 'focus', 'wellbeing'],
    requiredScore: 2,
    targetPersonas: ['balanced-lifestyle', 'productivity-driven'],
    triggerConditions: {
      digital_1: [1, 2] // Dùng social media nhiều
    }
  },
  {
    name: 'Tắt điện thoại trước khi ngủ 1 tiếng',
    description: 'Ngừng sử dụng thiết bị điện tử trước giờ ngủ để cải thiện giấc ngủ',
    category: 'digital',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '🌙',
    color: '#6B7280',
    tags: ['sleep', 'digital-detox', 'health'],
    requiredScore: 1,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: {
      digital_2: [1, 2], // Dùng điện thoại trước khi ngủ
      health_2: [1, 2]   // Giấc ngủ kém
    }
  },

  // === SOCIAL ===
  {
    name: 'Gọi điện cho gia đình',
    description: 'Duy trì liên lạc với gia đình để củng cố mối quan hệ',
    category: 'social',
    difficulty: 'easy',
    frequency: 'weekly',
    estimatedTime: 15,
    icon: '📞',
    color: '#EC4899',
    tags: ['family', 'communication', 'relationships'],
    requiredScore: 0,
    targetPersonas: ['social-connector', 'balanced-lifestyle'],
    triggerConditions: {social_1: [1, 2] // Ít liên lạc với gia đình
    }
  },
  {
    name: 'Gặp gỡ bạn bè',
    description: 'Dành thời gian gặp mặt bạn bè để duy trì tình bạn',
    category: 'social',
    difficulty: 'easy',
    frequency: 'weekly',
    estimatedTime: 120,
    icon: '👥',
    color: '#F59E0B',
    tags: ['friends', 'social', 'relationships'],
    requiredScore: 0,
    targetPersonas: ['social-connector', 'balanced-lifestyle'],
    triggerConditions: {
      social_2: [1, 2] // Ít gặp bạn bè
    }
  },
  {
    name: 'Tham gia hoạt động cộng đồng',
    description: 'Tham gia các hoạt động tình nguyện hoặc câu lạc bộ',
    category: 'social',
    difficulty: 'medium',
    frequency: 'weekly',
    estimatedTime: 180,
    icon: '🤝',
    color: '#10B981',
    tags: ['community', 'volunteering', 'social'],
    requiredScore: 1,
    targetPersonas: ['social-connector'],
    triggerConditions: {
      social_1: [1, 2],
      social_2: [1, 2]
    }
  },

  // === FITNESS ===
  {
    name: 'Tập gym 3 lần/tuần',
    description: 'Duy trì tập luyện tại phòng gym để tăng cường sức khỏe',
    category: 'fitness',
    difficulty: 'medium',
    frequency: 'weekly',
    estimatedTime: 60,
    icon: '💪',
    color: '#F59E0B',
    tags: ['gym', 'strength', 'fitness'],
    requiredScore: 1,
    targetPersonas: ['fitness-enthusiast', 'health-focused'],
    triggerConditions: {
      fitness_1: [1, 2] // Tập gym ít
    }
  },
  {
    name: 'Đi bộ 10,000 bước mỗi ngày',
    description: 'Duy trì hoạt động đi bộ để cải thiện sức khỏe tim mạch',
    category: 'fitness',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 60,
    icon: '👟',
    color: '#6366F1',
    tags: ['walking', 'cardio', 'fitness'],
    requiredScore: 0,
    targetPersonas: ['fitness-enthusiast', 'health-focused', 'balanced-lifestyle'],
    triggerConditions: {
      fitness_2: [1, 2] // Đi bộ ít
    }
  },
  {
    name: 'Chạy bộ buổi sáng',
    description: 'Chạy bộ 20-30 phút để tăng cường thể lực',
    category: 'fitness',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 30,
    icon: '🏃‍♂️',
    color: '#EF4444',
    tags: ['running', 'cardio', 'morning'],
    requiredScore: 1,
    targetPersonas: ['fitness-enthusiast'],
    triggerConditions: {
      fitness_1: [1, 2],
      health_1: [1, 2]
    }
  },
  {
    name: 'Tập plank mỗi ngày',
    description: 'Tăng dần thời gian tập plank để tăng cường cơ core',
    category: 'fitness',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '🤸',
    color: '#8B5CF6',
    tags: ['core', 'strength', 'home-workout'],
    requiredScore: 0,
    targetPersonas: ['fitness-enthusiast', 'health-focused'],
    triggerConditions: {
      fitness_1: [1, 2, 3] // Phù hợp cho mọi level
    }
  },

  // === SLEEP ===
  {
    name: 'Ngủ đủ 8 tiếng',
    description: 'Đảm bảo có đủ giấc ngủ để phục hồi cơ thể',
    category: 'sleep',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 480,
    icon: '🛌',
    color: '#8B5CF6',
    tags: ['sleep', 'rest', 'recovery'],
    requiredScore: 1,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: {
      health_2: [1, 2] // Giấc ngủ kém
    }
  },
  {
    name: 'Tạo thói quen trước khi ngủ',
    description: 'Thiết lập routine thư giãn 30 phút trước khi ngủ',
    category: 'sleep',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 30,
    icon: '🌜',
    color: '#6366F1',
    tags: ['sleep', 'routine', 'relaxation'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'mindful-seeker'],
    triggerConditions: {
      health_2: [1, 2]
    }
  },

  // === ENERGY ===
  {
    name: 'Uống trà xanh thay cà phê',
    description: 'Thay thế cà phê bằng trà xanh để có năng lượng bền vững',
    category: 'energy',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '🍵',
    color: '#22C55E',
    tags: ['energy', 'health', 'drink'],
    requiredScore: 0,
    targetPersonas: ['health-focused'],
    triggerConditions: {
      health_1: [1, 2] // Năng lượng thấp
    }
  },
  {
    name: 'Nghỉ ngơi giữa giờ làm việc',
    description: 'Nghỉ ngơi 5-10 phút sau mỗi giờ làm việc để tránh kiệt sức',
    category: 'energy',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 10,
    icon: '⏰',
    color: '#F59E0B',
    tags: ['break', 'rest', 'productivity'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: {
      productivity_1: [1, 2],
      productivity_2: [1, 2]
    }
  },
  {
    name: 'Ăn healthy snack giữa buổi',
    description: 'Ăn trái cây hoặc hạt để duy trì năng lượng',
    category: 'energy',
    difficulty: 'easy',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '🍎',
    color: '#EF4444',
    tags: ['nutrition', 'energy', 'snack'],
    requiredScore: 0,
    targetPersonas: ['health-focused'],
    triggerConditions: {
      health_4: [1, 2]
    }
  },

  // === CONTROL (Breaking bad habits) ===
  {
    name: 'Giảm uống nước ngọt',
    description: 'Hạn chế uống nước ngọt, thay bằng nước lọc hoặc trà',
    category: 'control',
    difficulty: 'medium',
    frequency: 'daily',
    estimatedTime: 5,
    icon: '🚫',
    color: '#EF4444',
    tags: ['quit', 'health', 'sugar'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: {
      health_4: [1, 2]
    }
  },
  {
    name: 'Giảm ăn đồ ăn nhanh',
    description: 'Hạn chế ăn fast food xuống 1 lần/tuần',
    category: 'control',
    difficulty: 'medium',
    frequency: 'weekly',
    estimatedTime: 10,
    icon: '🍔',
    color: '#F59E0B',
    tags: ['quit', 'health', 'diet'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: {
      health_4: [1, 2]
    }
  },
  {
    name: 'Giảm xem TV/Netflix',
    description: 'Hạn chế xem TV xuống dưới 1 tiếng/ngày',
    category: 'control',
    difficulty: 'hard',
    frequency: 'daily',
    estimatedTime: 60,
    icon: '📺',
    color: '#6B7280',
    tags: ['quit', 'digital-detox', 'time-management'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: {
      productivity_1: [1, 2]
    }
  },
  {
    name: 'Bỏ thói quen trì hoãn',
    description: 'Áp dụng quy tắc 2 phút: làm ngay việc dưới 2 phút',
    category: 'control',
    difficulty: 'hard',
    frequency: 'daily',
    estimatedTime: 10,
    icon: '⏱️',
    color: '#EF4444',
    tags: ['quit', 'productivity', 'procrastination'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven'],
    triggerConditions: {
      productivity_1: [1, 2],
      productivity_2: [1, 2]
    }
  }
];

// Target Personas - Định nghĩa các nhóm người dùng
const targetPersonas = {
  'health-focused': {
    name: 'Người tập trung sức khỏe',
    description: 'Ưu tiên sức khỏe thể chất và tinh thần',
    categories: ['health', 'fitness', 'sleep', 'mindful']
  },
  'productivity-driven': {
    name: 'Người năng suất cao',
    description: 'Tập trung vào hiệu suất công việc và quản lý thời gian',
    categories: ['productivity', 'learning', 'energy']
  },
  'knowledge-seeker': {
    name: 'Người ham học hỏi',
    description: 'Muốn phát triển bản thân qua việc học tập liên tục',
    categories: ['learning', 'productivity']
  },
  'mindful-seeker': {
    name: 'Người tìm kiếm cân bằng',
    description: 'Quan tâm đến sức khỏe tinh thần và mindfulness',
    categories: ['mindful', 'health', 'sleep']
  },
  'finance-conscious': {
    name: 'Người có ý thức tài chính',
    description: 'Muốn quản lý tài chính tốt hơn',
    categories: ['finance']
  },
  'balanced-lifestyle': {
    name: 'Người sống cân bằng',
    description: 'Muốn cân bằng giữa công việc, sức khỏe và mối quan hệ',
    categories: ['health', 'productivity', 'social', 'mindful']
  },
  'fitness-enthusiast': {
    name: 'Người đam mê thể hình',
    description: 'Tập trung vào tập luyện và thể lực',
    categories: ['fitness', 'health']
  },
  'social-connector': {
    name: 'Người quan hệ xã hội',
    description: 'Coi trọng mối quan hệ với gia đình và bạn bè',
    categories: ['social']
  }
};

export {
    surveyQuestions,
    habitSuggestions,
    habitTemplates,
};
