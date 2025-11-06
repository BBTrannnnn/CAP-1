
// Survey Questions
// Survey Questions
const surveyQuestions = [
  // ==================== HEALTH ====================
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
      { id: 'h2_1', text: 'Kém (dưới 6 tiếng, thường xuyên thức giấc)', value: 1 },
      { id: 'h2_2', text: 'Khá (6-7 tiếng, đôi khi thức giấc)', value: 2 },
      { id: 'h2_3', text: 'Tốt (7-8 tiếng, ngủ khá ngon)', value: 3 },
      { id: 'h2_4', text: 'Xuất sắc (trên 8 tiếng, ngủ rất ngon)', value: 4 }
    ]
  },
  {
    id: 'health_3',
    text: 'Bạn uống đủ nước mỗi ngày không?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h3_1', text: 'Hiếm khi nhớ uống nước (dưới 1L)', value: 1 },
      { id: 'h3_2', text: 'Uống nhưng chưa đủ (1-1.5L)', value: 2 },
      { id: 'h3_3', text: 'Uống đủ 1.5-2L/ngày', value: 3 },
      { id: 'h3_4', text: 'Luôn duy trì đủ nước (trên 2L)', value: 4 }
    ]
  },
  {
    id: 'health_4',
    text: 'Chế độ ăn uống của bạn như thế nào?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h4_1', text: 'Ăn uống tùy tiện, nhiều đồ ăn nhanh', value: 1 },
      { id: 'h4_2', text: 'Cố gắng ăn uống lành mạnh nhưng chưa đều đặn', value: 2 },
      { id: 'h4_3', text: 'Ăn uống cân bằng, có rau quả', value: 3 },
      { id: 'h4_4', text: 'Chế độ ăn rất lành mạnh và khoa học', value: 4 }
    ]
  },
  {
    id: 'health_5',
    text: 'Bạn có thường xuyên khám sức khỏe định kỳ không?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h5_1', text: 'Chưa bao giờ', value: 1 },
      { id: 'h5_2', text: 'Vài năm một lần', value: 2 },
      { id: 'h5_3', text: 'Mỗi năm một lần', value: 3 },
      { id: 'h5_4', text: 'Đều đặn 6 tháng/lần', value: 4 }
    ]
  },
  {
    id: 'health_6',
    text: 'Bạn có uống vitamin hoặc thực phẩm bổ sung không?',
    type: 'single',
    category: 'health',
    options: [
      { id: 'h6_1', text: 'Không bao giờ', value: 1 },
      { id: 'h6_2', text: 'Thỉnh thoảng khi nhớ', value: 2 },
      { id: 'h6_3', text: 'Khá đều đặn', value: 3 },
      { id: 'h6_4', text: 'Rất đều đặn mỗi ngày', value: 4 }
    ]
  },

  // ==================== PRODUCTIVITY ====================
  {
    id: 'productivity_1',
    text: 'Bạn quản lý công việc hằng ngày như thế nào?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p1_1', text: 'Thường cảm thấy quá tải, không có hệ thống', value: 1 },
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
      { id: 'p2_1', text: 'Dễ bị phân tâm, khó tập trung', value: 1 },
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
  {
    id: 'productivity_4',
    text: 'Bạn có thường xuyên trì hoãn công việc không?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p4_1', text: 'Thường xuyên trì hoãn', value: 1 },
      { id: 'p4_2', text: 'Thỉnh thoảng trì hoãn', value: 2 },
      { id: 'p4_3', text: 'Hiếm khi trì hoãn', value: 3 },
      { id: 'p4_4', text: 'Không bao giờ trì hoãn', value: 4 }
    ]
  },
  {
    id: 'productivity_5',
    text: 'Không gian làm việc của bạn như thế nào?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p5_1', text: 'Lộn xộn, bừa bộn', value: 1 },
      { id: 'p5_2', text: 'Khá ngăn nắp nhưng chưa tối ưu', value: 2 },
      { id: 'p5_3', text: 'Ngăn nắp và tổ chức tốt', value: 3 },
      { id: 'p5_4', text: 'Rất sạch sẽ, tối ưu hóa', value: 4 }
    ]
  },
  {
    id: 'productivity_6',
    text: 'Bạn có thói quen dậy sớm không?',
    type: 'single',
    category: 'productivity',
    options: [
      { id: 'p6_1', text: 'Thường dậy muộn (sau 8h)', value: 1 },
      { id: 'p6_2', text: 'Dậy khoảng 7-8h', value: 2 },
      { id: 'p6_3', text: 'Dậy khoảng 6-7h', value: 3 },
      { id: 'p6_4', text: 'Dậy rất sớm (trước 6h)', value: 4 }
    ]
  },

  // ==================== LEARNING ====================
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
  {
    id: 'learning_4',
    text: 'Bạn có nghe podcast hoặc xem video giáo dục không?',
    type: 'single',
    category: 'learning',
    options: [
      { id: 'l4_1', text: 'Không bao giờ', value: 1 },
      { id: 'l4_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'l4_3', text: 'Thường xuyên', value: 3 },
      { id: 'l4_4', text: 'Hầu như mỗi ngày', value: 4 }
    ]
  },
  {
    id: 'learning_5',
    text: 'Bạn có ghi chép lại những gì học được không?',
    type: 'single',
    category: 'learning',
    options: [
      { id: 'l5_1', text: 'Không bao giờ ghi chép', value: 1 },
      { id: 'l5_2', text: 'Thỉnh thoảng ghi chép', value: 2 },
      { id: 'l5_3', text: 'Thường xuyên ghi chép', value: 3 },
      { id: 'l5_4', text: 'Luôn ghi chép mọi thứ', value: 4 }
    ]
  },

  // ==================== MINDFUL ====================
  {
    id: 'mindful_1',
    text: 'Bạn quản lý stress như thế nào?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm1_1', text: 'Khó kiểm soát stress, thường lo âu', value: 1 },
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
  {
    id: 'mindful_4',
    text: 'Bạn có dành thời gian ra ngoài tiếp xúc thiên nhiên không?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm4_1', text: 'Hiếm khi ra ngoài', value: 1 },
      { id: 'm4_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'm4_3', text: 'Thường xuyên', value: 3 },
      { id: 'm4_4', text: 'Hằng ngày', value: 4 }
    ]
  },
  {
    id: 'mindful_5',
    text: 'Bạn có thực hành biết ơn (gratitude) không?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm5_1', text: 'Chưa từng nghĩ đến', value: 1 },
      { id: 'm5_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'm5_3', text: 'Khá thường xuyên', value: 3 },
      { id: 'm5_4', text: 'Mỗi ngày', value: 4 }
    ]
  },
  {
    id: 'mindful_6',
    text: 'Bạn có ngắt kết nối với công nghệ để thư giãn không?',
    type: 'single',
    category: 'mindful',
    options: [
      { id: 'm6_1', text: 'Luôn online', value: 1 },
      { id: 'm6_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'm6_3', text: 'Thường xuyên', value: 3 },
      { id: 'm6_4', text: 'Mỗi ngày có thời gian digital detox', value: 4 }
    ]
  },

  // ==================== FINANCE ====================
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
  {
    id: 'finance_3',
    text: 'Bạn có theo dõi chi tiêu hằng ngày không?',
    type: 'single',
    category: 'finance',
    options: [
      { id: 'f3_1', text: 'Không theo dõi', value: 1 },
      { id: 'f3_2', text: 'Thỉnh thoảng ghi chép', value: 2 },
      { id: 'f3_3', text: 'Ghi chép đều đặn', value: 3 },
      { id: 'f3_4', text: 'Có app tự động theo dõi', value: 4 }
    ]
  },
  {
    id: 'finance_4',
    text: 'Bạn có mua sắm impulsive (mua theo cảm xúc) không?',
    type: 'single',
    category: 'finance',
    options: [
      { id: 'f4_1', text: 'Thường xuyên mua không cần thiết', value: 1 },
      { id: 'f4_2', text: 'Thỉnh thoảng mua vội', value: 2 },
      { id: 'f4_3', text: 'Hiếm khi mua vội', value: 3 },
      { id: 'f4_4', text: 'Luôn suy nghĩ kỹ trước khi mua', value: 4 }
    ]
  },
  {
    id: 'finance_5',
    text: 'Bạn có cập nhật kiến thức về tài chính không?',
    type: 'single',
    category: 'finance',
    options: [
      { id: 'f5_1', text: 'Không quan tâm', value: 1 },
      { id: 'f5_2', text: 'Thỉnh thoảng đọc', value: 2 },
      { id: 'f5_3', text: 'Thường xuyên cập nhật', value: 3 },
      { id: 'f5_4', text: 'Đọc tin tức tài chính hằng ngày', value: 4 }
    ]
  },

  // ==================== DIGITAL ====================
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
  {
    id: 'digital_3',
    text: 'Email inbox của bạn như thế nào?',
    type: 'single',
    category: 'digital',
    options: [
      { id: 'd3_1', text: 'Hàng nghìn email chưa đọc', value: 1 },
      { id: 'd3_2', text: 'Vài trăm email chưa đọc', value: 2 },
      { id: 'd3_3', text: 'Thỉnh thoảng dọn dẹp', value: 3 },
      { id: 'd3_4', text: 'Luôn giữ inbox sạch sẽ', value: 4 }
    ]
  },
  {
    id: 'digital_4',
    text: 'Bạn có sao lưu dữ liệu quan trọng không?',
    type: 'single',
    category: 'digital',
    options: [
      { id: 'd4_1', text: 'Chưa bao giờ backup', value: 1 },
      { id: 'd4_2', text: 'Rất hiếm khi', value: 2 },
      { id: 'd4_3', text: 'Thỉnh thoảng backup', value: 3 },
      { id: 'd4_4', text: 'Backup đều đặn', value: 4 }
    ]
  },
  {
    id: 'digital_5',
    text: 'Bạn có học các công cụ digital mới để nâng cao năng suất không?',
    type: 'single',
    category: 'digital',
    options: [
      { id: 'd5_1', text: 'Không bao giờ', value: 1 },
      { id: 'd5_2', text: 'Rất hiếm', value: 2 },
      { id: 'd5_3', text: 'Thỉnh thoảng', value: 3 },
      { id: 'd5_4', text: 'Thường xuyên học công cụ mới', value: 4 }
    ]
  },
  {
    id: 'digital_6',
    text: 'Bạn có kiểm soát thông báo trên điện thoại không?',
    type: 'single',
    category: 'digital',
    options: [
      { id: 'd6_1', text: 'Bật hết thông báo', value: 1 },
      { id: 'd6_2', text: 'Tắt một số thông báo', value: 2 },
      { id: 'd6_3', text: 'Chỉ giữ thông báo quan trọng', value: 3 },
      { id: 'd6_4', text: 'Tắt hầu hết thông báo', value: 4 }
    ]
  },

  // ==================== SOCIAL ====================
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
  {
    id: 'social_3',
    text: 'Bạn có khen ngợi hoặc động viên người khác không?',
    type: 'single',
    category: 'social',
    options: [
      { id: 's3_1', text: 'Hiếm khi nghĩ đến', value: 1 },
      { id: 's3_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 's3_3', text: 'Khá thường xuyên', value: 3 },
      { id: 's3_4', text: 'Rất thường xuyên', value: 4 }
    ]
  },
  {
    id: 'social_4',
    text: 'Bạn có tham gia hoạt động cộng đồng không?',
    type: 'single',
    category: 'social',
    options: [
      { id: 's4_1', text: 'Chưa bao giờ', value: 1 },
      { id: 's4_2', text: 'Rất hiếm', value: 2 },
      { id: 's4_3', text: 'Thỉnh thoảng', value: 3 },
      { id: 's4_4', text: 'Thường xuyên', value: 4 }
    ]
  },
  {
    id: 'social_5',
    text: 'Bạn có chủ động nhắn tin hỏi thăm bạn bè không?',
    type: 'single',
    category: 'social',
    options: [
      { id: 's5_1', text: 'Hiếm khi chủ động', value: 1 },
      { id: 's5_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 's5_3', text: 'Thường xuyên', value: 3 },
      { id: 's5_4', text: 'Rất thường xuyên', value: 4 }
    ]
  },

  // ==================== FITNESS ====================
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
  },
  {
    id: 'fitness_3',
    text: 'Bạn có tập yoga hoặc pilates không?',
    type: 'single',
    category: 'fitness',
    options: [
      { id: 'fit3_1', text: 'Chưa bao giờ', value: 1 },
      { id: 'fit3_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'fit3_3', text: 'Vài lần mỗi tuần', value: 3 },
      { id: 'fit3_4', text: 'Đều đặn hằng ngày', value: 4 }
    ]
  },
  {
    id: 'fitness_4',
    text: 'Bạn có tập các bài tập sức bền (strength training) không?',
    type: 'single',
    category: 'fitness',
    options: [
      { id: 'fit4_1', text: 'Không bao giờ', value: 1 },
      { id: 'fit4_2', text: '1-2 lần/tuần', value: 2 },
      { id: 'fit4_3', text: '3-4 lần/tuần', value: 3 },
      { id: 'fit4_4', text: 'Trên 5 lần/tuần', value: 4 }
    ]
  },
  {
    id: 'fitness_5',
    text: 'Bạn có tham gia các môn thể thao nào không?',
    type: 'single',
    category: 'fitness',
    options: [
      { id: 'fit5_1', text: 'Không chơi thể thao', value: 1 },
      { id: 'fit5_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'fit5_3', text: 'Thường xuyên', value: 3 },
      { id: 'fit5_4', text: 'Rất đều đặn', value: 4 }
    ]
  },
  {
    id: 'fitness_6',
    text: 'Bạn có khởi động và giãn cơ trước/sau khi tập không?',
    type: 'single',
    category: 'fitness',
    options: [
      { id: 'fit6_1', text: 'Không bao giờ', value: 1 },
      { id: 'fit6_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'fit6_3', text: 'Thường xuyên', value: 3 },
      { id: 'fit6_4', text: 'Luôn luôn', value: 4 }
    ]
  },

  // ==================== SLEEP ====================
  {
    id: 'sleep_1',
    text: 'Bạn ngủ bao nhiêu giờ mỗi đêm?',
    type: 'single',
    category: 'sleep',
    options: [
      { id: 'sl1_1', text: 'Dưới 6 giờ', value: 1 },
      { id: 'sl1_2', text: '6-7 giờ', value: 2 },
      { id: 'sl1_3', text: '7-8 giờ', value: 3 },
      { id: 'sl1_4', text: 'Trên 8 giờ', value: 4 }
    ]
  },
  {
    id: 'sleep_2',
    text: 'Giờ giấc ngủ của bạn có đều đặn không?',
    type: 'single',
    category: 'sleep',
    options: [
      { id: 'sl2_1', text: 'Mỗi ngày khác nhau', value: 1 },
      { id: 'sl2_2', text: 'Tương đối đều', value: 2 },
      { id: 'sl2_3', text: 'Khá đều đặn', value: 3 },
      { id: 'sl2_4', text: 'Rất đều đặn', value: 4 }
    ]
  },
  {
    id: 'sleep_3',
    text: 'Bạn có ngủ trưa không?',
    type: 'single',
    category: 'sleep',
    options: [
      { id: 'sl3_1', text: 'Không bao giờ', value: 1 },
      { id: 'sl3_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'sl3_3', text: 'Ngủ trưa dưới 30 phút', value: 3 },
      { id: 'sl3_4', text: 'Ngủ trưa hợp lý (20-30 phút)', value: 4 }
    ]
  },
  {
    id: 'sleep_4',
    text: 'Môi trường phòng ngủ của bạn như thế nào?',
    type: 'single',
    category: 'sleep',
    options: [
      { id: 'sl4_1', text: 'Ồn ào, có nhiều ánh sáng', value: 1 },
      { id: 'sl4_2', text: 'Khá ổn nhưng chưa tối ưu', value: 2 },
      { id: 'sl4_3', text: 'Yên tĩnh, tối', value: 3 },
      { id: 'sl4_4', text: 'Rất lý tưởng cho giấc ngủ', value: 4 }
    ]
  },
  {
    id: 'sleep_5',
    text: 'Bạn có uống caffeine sau 2 giờ chiều không?',
    type: 'single',
    category: 'sleep',
    options: [
      { id: 'sl5_1', text: 'Thường xuyên uống caffeine buổi chiều/tối', value: 1 },
      { id: 'sl5_2', text: 'Thỉnh thoảng uống', value: 2 },
      { id: 'sl5_3', text: 'Hiếm khi uống sau 2 giờ chiều', value: 3 },
      { id: 'sl5_4', text: 'Không bao giờ uống sau 2 giờ chiều', value: 4 }
    ]
  },

  // ==================== ENERGY ====================
  {
    id: 'energy_1',
    text: 'Mức năng lượng của bạn trong ngày như thế nào?',
    type: 'single',
    category: 'energy',
    options: [
      { id: 'e1_1', text: 'Thường xuyên mệt mỏi', value: 1 },
      { id: 'e1_2', text: 'Đôi khi mệt mỏi', value: 2 },
      { id: 'e1_3', text: 'Năng lượng ổn định', value: 3 },
      { id: 'e1_4', text: 'Luôn tràn đầy năng lượng', value: 4 }
    ]
  },
  {
    id: 'energy_2',
    text: 'Bạn có nghỉ ngơi giữa giờ làm việc không?',
    type: 'single',
    category: 'energy',
    options: [
      { id: 'e2_1', text: 'Không bao giờ nghỉ, làm liên tục', value: 1 },
      { id: 'e2_2', text: 'Thỉnh thoảng nghỉ', value: 2 },
      { id: 'e2_3', text: 'Nghỉ đều đặn', value: 3 },
      { id: 'e2_4', text: 'Có hệ thống nghỉ ngơi tối ưu', value: 4 }
    ]
  },
  {
    id: 'energy_3',
    text: 'Bạn uống cà phê bao nhiêu tách mỗi ngày?',
    type: 'single',
    category: 'energy',
    options: [
      { id: 'e3_1', text: 'Trên 4 tách/ngày', value: 1 },
      { id: 'e3_2', text: '2-3 tách/ngày', value: 2 },
      { id: 'e3_3', text: '1 tách/ngày', value: 3 },
      { id: 'e3_4', text: 'Không uống cà phê', value: 4 }
    ]
  },
  {
    id: 'energy_4',
    text: 'Bạn có ăn nhẹ lành mạnh giữa các bữa không?',
    type: 'single',
    category: 'energy',
    options: [
      { id: 'e4_1', text: 'Thường ăn đồ ăn vặt không lành mạnh', value: 1 },
      { id: 'e4_2', text: 'Thỉnh thoảng ăn lành mạnh', value: 2 },
      { id: 'e4_3', text: 'Thường ăn nhẹ lành mạnh', value: 3 },
      { id: 'e4_4', text: 'Luôn chọn đồ ăn nhẹ lành mạnh', value: 4 }
    ]
  },
  {
    id: 'energy_5',
    text: 'Bạn có vận động nhẹ vào buổi sáng không?',
    type: 'single',
    category: 'energy',
    options: [
      { id: 'e5_1', text: 'Không bao giờ', value: 1 },
      { id: 'e5_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'e5_3', text: 'Thường xuyên', value: 3 },
      { id: 'e5_4', text: 'Hằng ngày', value: 4 }
    ]
  },
  {
    id: 'energy_6',
    text: 'Bạn có kiểm soát lượng đường tiêu thụ không?',
    type: 'single',
    category: 'energy',
    options: [
      { id: 'e6_1', text: 'Ăn nhiều đường, đồ ngọt', value: 1 },
      { id: 'e6_2', text: 'Cố gắng giảm nhưng chưa đều', value: 2 },
      { id: 'e6_3', text: 'Kiểm soát khá tốt', value: 3 },
      { id: 'e6_4', text: 'Hạn chế đường rất tốt', value: 4 }
    ]
  },

  // ==================== CONTROL ====================
  {
    id: 'control_1',
    text: 'Bạn có kỷ luật trong việc thực hiện mục tiêu không?',
    type: 'single',
    category: 'control',
    options: [
      { id: 'c1_1', text: 'Thường bỏ dở giữa chừng', value: 1 },
      { id: 'c1_2', text: 'Đôi khi kiên trì được', value: 2 },
      { id: 'c1_3', text: 'Khá kiên định', value: 3 },
      { id: 'c1_4', text: 'Rất kỷ luật', value: 4 }
    ]
  },
  {
    id: 'control_2',
    text: 'Bạn có thói quen dậy sớm không?',
    type: 'single',
    category: 'control',
    options: [
      { id: 'c2_1', text: 'Thường dậy muộn (sau 8h)', value: 1 },
      { id: 'c2_2', text: 'Dậy khoảng 7-8h', value: 2 },
      { id: 'c2_3', text: 'Dậy khoảng 6-7h', value: 3 },
      { id: 'c2_4', text: 'Dậy rất sớm (trước 6h)', value: 4 }
    ]
  },
  {
    id: 'control_3',
    text: 'Không gian làm việc của bạn như thế nào?',
    type: 'single',
    category: 'control',
    options: [
      { id: 'c3_1', text: 'Lộn xộn, bừa bộn', value: 1 },
      { id: 'c3_2', text: 'Khá ngăn nắp nhưng chưa tối ưu', value: 2 },
      { id: 'c3_3', text: 'Ngăn nắp và tổ chức tốt', value: 3 },
      { id: 'c3_4', text: 'Rất sạch sẽ, tối ưu hóa', value: 4 }
    ]
  },
  {
    id: 'control_4',
    text: 'Bạn có lập kế hoạch cho ngày hôm sau không?',
    type: 'single',
    category: 'control',
    options: [
      { id: 'c4_1', text: 'Không bao giờ', value: 1 },
      { id: 'c4_2', text: 'Thỉnh thoảng', value: 2 },
      { id: 'c4_3', text: 'Thường xuyên', value: 3 },
      { id: 'c4_4', text: 'Hằng ngày', value: 4 }
    ]
  },
  {
    id: 'control_5',
    text: 'Bạn có xu hướng trì hoãn công việc khó không?',
    type: 'single',
    category: 'control',
    options: [
      { id: 'c5_1', text: 'Luôn trì hoãn việc khó', value: 1 },
      { id: 'c5_2', text: 'Thường trì hoãn', value: 2 },
      { id: 'c5_3', text: 'Thỉnh thoảng trì hoãn', value: 3 },
      { id: 'c5_4', text: 'Làm ngay việc khó trước', value: 4 }
    ]
  }
];

// Habit Templates

const habitTemplates = [
  // ==================== HEALTH ====================
  {
    name: 'Uống 8 ly nước mỗi ngày',
    description: 'Duy trì đủ nước cho cơ thể để cải thiện sức khỏe tổng thể',
    category: 'health',
    icon: '💧',
    color: '#3B82F6',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 8,
    unit: 'ly',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Đặt chai nước trên bàn làm việc', 'Uống nước ngay khi thức dậy', 'Dùng app nhắc nhở'],
    commonObstacles: ['Quên uống nước', 'Không thích vị nước lọc', 'Bận rộn quá'],
    benefits: ['Cải thiện làn da', 'Tăng năng lượng', 'Hỗ trợ tiêu hóa'],
    isPopular: true
  },
  {
    name: 'Ăn 5 phần rau quả mỗi ngày',
    description: 'Bổ sung vitamin và chất xơ cần thiết cho cơ thể',
    category: 'health',
    icon: '🥬',
    color: '#22C55E',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 5,
    unit: 'phần',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 15,
    tips: ['Chuẩn bị trái cây sẵn', 'Thêm rau vào mỗi bữa ăn', 'Làm sinh tố rau quả'],
    commonObstacles: ['Rau quả đắt', 'Không có thời gian chuẩn bị', 'Không thích ăn rau'],
    benefits: ['Tăng cường miễn dịch', 'Cải thiện tiêu hóa', 'Giảm nguy cơ bệnh tật'],
    isPopular: true
  },
  {
    name: 'Kiểm tra sức khỏe định kỳ',
    description: 'Thăm khám sức khỏe tổng quát định kỳ để phát hiện sớm bệnh tật',
    category: 'health',
    icon: '🏥',
    color: '#EF4444',
    frequency: 'monthly',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 90,
    difficulty: 'easy',
    estimatedTime: 120,
    tips: ['Đặt lịch trước', 'Chuẩn bị danh sách câu hỏi cho bác sĩ', 'Mang theo bảo hiểm y tế'],
    commonObstacles: ['Không có thời gian', 'Chi phí cao', 'Sợ khám bệnh'],
    benefits: ['Phát hiện sớm bệnh tật', 'An tâm về sức khỏe', 'Theo dõi chỉ số sức khỏe'],
    isPopular: false
  },
  {
    name: 'Uống vitamin tổng hợp',
    description: 'Bổ sung vitamin và khoáng chất cần thiết mỗi ngày',
    category: 'health',
    icon: '💊',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 2,
    tips: ['Đặt lọ vitamin ở nơi dễ thấy', 'Uống cùng bữa ăn sáng', 'Đặt nhắc nhở trên điện thoại'],
    commonObstacles: ['Quên uống', 'Hết thuốc không mua kịp', 'Không chắc nên uống loại nào'],
    benefits: ['Tăng cường miễn dịch', 'Bổ sung dinh dưỡng thiếu hụt', 'Cải thiện sức khỏe tổng thể'],
    isPopular: true
  },
  {
    name: 'Ăn sáng đầy đủ',
    description: 'Không bỏ bữa sáng để có năng lượng cho cả ngày',
    category: 'health',
    icon: '🍳',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Chuẩn bị từ tối hôm trước', 'Chọn món ăn nhanh nhưng bổ dưỡng', 'Dậy sớm 15 phút'],
    commonObstacles: ['Không có thời gian', 'Ngủ dậy trễ', 'Không đói vào buổi sáng'],
    benefits: ['Tăng năng lượng', 'Cải thiện tập trung', 'Tăng cường trao đổi chất'],
    isPopular: true
  },

  // ==================== FITNESS ====================
  {
    name: 'Tập thể dục 30 phút',
    description: 'Duy trì hoạt động thể chất để khỏe mạnh và có năng lượng',
    category: 'fitness',
    icon: '🏃',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 30,
    unit: 'phút',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 30,
    tips: ['Bắt đầu với 10 phút', 'Chọn hoạt động yêu thích', 'Tập cùng bạn bè'],
    commonObstacles: ['Thiếu động lực', 'Mệt mỏi', 'Không biết tập gì'],
    benefits: ['Tăng sức bền', 'Cải thiện tâm trạng', 'Giảm cân', 'Tăng cường sức khỏe tim mạch'],
    isPopular: true
  },
  {
    name: 'Đi bộ 10,000 bước',
    description: 'Duy trì hoạt động đi bộ để cải thiện sức khỏe tim mạch',
    category: 'fitness',
    icon: '👟',
    color: '#6366F1',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 10000,
    unit: 'bước',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 60,
    tips: ['Sử dụng cầu thang thay vì thang máy', 'Đi bộ khi nói chuyện điện thoại', 'Đi bộ đến chợ thay vì lái xe'],
    commonObstacles: ['Thời tiết xấu', 'Không có thời gian', 'Chân đau'],
    benefits: ['Cải thiện sức khỏe tim mạch', 'Đốt cháy calories', 'Giảm stress'],
    isPopular: true
  },
  {
    name: 'Tập yoga buổi sáng',
    description: 'Bắt đầu ngày mới với yoga để thư giãn và linh hoạt',
    category: 'fitness',
    icon: '🧘',
    color: '#8B5CF6',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Tập trên tấm thảm yoga', 'Xem video hướng dẫn', 'Tập vào buổi sáng sau khi thức dậy'],
    commonObstacles: ['Không đủ không gian', 'Cơ thể cứng', 'Không biết các động tác'],
    benefits: ['Tăng độ linh hoạt', 'Giảm stress', 'Cải thiện tư thế', 'Tăng cường cân bằng'],
    isPopular: true
  },
  {
    name: 'Chạy bộ 5km',
    description: 'Chạy bộ đều đặn để tăng cường sức bền và sức khỏe tim mạch',
    category: 'fitness',
    icon: '🏃',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 5,
    unit: 'km',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 30,
    tips: ['Khởi động kỹ trước khi chạy', 'Chạy vào buổi sáng sớm', 'Nghe nhạc khi chạy'],
    commonObstacles: ['Thời tiết không thuận lợi', 'Đau khớp', 'Thiếu động lực'],
    benefits: ['Tăng sức bền', 'Đốt cháy calories', 'Cải thiện tâm trạng', 'Tăng cường tim mạch'],
    isPopular: true
  },
  {
    name: 'Tập plank 2 phút',
    description: 'Tập plank mỗi ngày để tăng cường cơ bụng và lưng',
    category: 'fitness',
    icon: '💪',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 2,
    unit: 'phút',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'medium',
    estimatedTime: 5,
    tips: ['Bắt đầu với 30 giây', 'Tăng dần thời gian mỗi tuần', 'Giữ tư thế chuẩn'],
    commonObstacles: ['Cơ bụng yếu', 'Đau lưng', 'Chán nản'],
    benefits: ['Tăng cường cơ core', 'Cải thiện tư thế', 'Giảm đau lưng', 'Tăng sức bền'],
    isPopular: true
  },
  {
    name: 'Bơi lội 30 phút',
    description: 'Bơi lội để rèn luyện toàn thân một cách nhẹ nhàng',
    category: 'fitness',
    icon: '🏊',
    color: '#3B82F6',
    frequency: 'weekly',
    trackingMode: 'count',
    targetCount: 3,
    unit: 'lần',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 60,
    tips: ['Tìm bể bơi gần nhà', 'Học kỹ thuật bơi đúng cách', 'Đi bơi cùng bạn bè'],
    commonObstacles: ['Không có bể bơi gần', 'Chi phí cao', 'Không biết bơi'],
    benefits: ['Rèn luyện toàn thân', 'Nhẹ nhàng với khớp', 'Giảm stress', 'Tăng sức bền'],
    isPopular: false
  },

  // ==================== LEARNING ====================
  {
    name: 'Đọc sách 20 phút',
    description: 'Duy trì thói quen đọc sách để mở rộng kiến thức',
    category: 'learning',
    icon: '📚',
    color: '#10B981',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 20,
    unit: 'phút',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 20,
    tips: ['Đọc trước khi ngủ', 'Chọn sách yêu thích', 'Ghi chú ý tưởng hay', 'Mang sách theo người'],
    commonObstacles: ['Dễ bị phân tâm', 'Không tìm được sách hay', 'Buồn ngủ khi đọc'],
    benefits: ['Mở rộng kiến thức', 'Cải thiện tập trung', 'Giảm stress', 'Phát triển tư duy'],
    isPopular: true
  },
  {
    name: 'Học ngoại ngữ 15 phút',
    description: 'Học một ngôn ngữ mới mỗi ngày để phát triển bản thân',
    category: 'learning',
    icon: '🌍',
    color: '#EC4899',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 15,
    unit: 'phút',
    habitType: 'build',
    targetDays: 90,
    difficulty: 'medium',
    estimatedTime: 15,
    tips: ['Dùng app học ngôn ngữ', 'Nghe nhạc/xem phim bằng ngôn ngữ đó', 'Tập nói với người bản xứ'],
    commonObstacles: ['Quên từ vựng', 'Thiếu động lực', 'Không có môi trường thực hành'],
    benefits: ['Mở rộng cơ hội nghề nghiệp', 'Kích thích trí não', 'Hiểu văn hóa khác'],
    isPopular: true
  },
  {
    name: 'Học một kỹ năng mới',
    description: 'Dành thời gian học kỹ năng mới mỗi tuần',
    category: 'learning',
    icon: '🎓',
    color: '#6366F1',
    frequency: 'weekly',
    trackingMode: 'count',
    targetCount: 3,
    unit: 'giờ',
    habitType: 'build',
    targetDays: 60,
    difficulty: 'medium',
    estimatedTime: 180,
    tips: ['Chọn kỹ năng phù hợp với mục tiêu', 'Tìm khóa học online', 'Thực hành thường xuyên'],
    commonObstacles: ['Không biết học gì', 'Thiếu thời gian', 'Quá nhiều lựa chọn'],
    benefits: ['Phát triển sự nghiệp', 'Tăng sự tự tin', 'Mở rộng cơ hội'],
    isPopular: true
  },
  {
    name: 'Nghe podcast giáo dục',
    description: 'Nghe podcast để học hỏi trong lúc di chuyển hoặc làm việc nhà',
    category: 'learning',
    icon: '🎧',
    color: '#8B5CF6',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 1,
    unit: 'tập',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 30,
    tips: ['Nghe khi đi làm', 'Chọn chủ đề yêu thích', 'Ghi chú ý tưởng hay'],
    commonObstacles: ['Không tìm được podcast hay', 'Dễ bị phân tâm', 'Quên nghe'],
    benefits: ['Học hỏi linh hoạt', 'Tận dụng thời gian', 'Mở rộng kiến thức'],
    isPopular: true
  },
  {
    name: 'Viết blog/journal học tập',
    description: 'Ghi lại những gì học được mỗi ngày để củng cố kiến thức',
    category: 'learning',
    icon: '✏️',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 10,
    tips: ['Viết ngắn gọn', 'Ghi chép ngay sau khi học', 'Đọc lại định kỳ'],
    commonObstacles: ['Không biết viết gì', 'Lười viết', 'Quên không viết'],
    benefits: ['Củng cố kiến thức', 'Cải thiện kỹ năng viết', 'Theo dõi tiến độ'],
    isPopular: false
  },

  // ==================== MINDFUL ====================
  {
    name: 'Thiền 10 phút',
    description: 'Thực hành thiền định để giảm stress và tăng cường tập trung',
    category: 'mindful',
    icon: '🧘',
    color: '#8B5CF6',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 10,
    unit: 'phút',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'medium',
    estimatedTime: 10,
    tips: ['Tìm nơi yên tĩnh', 'Sử dụng app hướng dẫn thiền', 'Thiền vào cùng giờ mỗi ngày', 'Tập trung vào hơi thở'],
    commonObstacles: ['Không thể ngồi yên', 'Suy nghĩ quá nhiều', 'Thiếu kiên nhẫn'],
    benefits: ['Giảm stress', 'Cải thiện tập trung', 'Tăng cường hạnh phúc', 'Kiểm soát cảm xúc tốt hơn'],
    isPopular: true
  },
  {
    name: 'Viết nhật ký biết ơn',
    description: 'Ghi lại 3 điều biết ơn mỗi ngày để tăng cường tích cực',
    category: 'mindful',
    icon: '📖',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Viết vào buổi tối', 'Ghi chi tiết cảm xúc', 'Đọc lại khi buồn', 'Dùng sổ tay đẹp'],
    commonObstacles: ['Không biết viết gì', 'Quên viết', 'Cảm thấy không có gì để biết ơn'],
    benefits: ['Tăng cường tích cực', 'Cải thiện tâm trạng', 'Nhìn nhận cuộc sống lạc quan hơn'],
    isPopular: true
  },
  {
    name: 'Thực hành hít thở sâu',
    description: 'Luyện tập hít thở sâu 5 phút để giảm căng thẳng',
    category: 'mindful',
    icon: '🌬️',
    color: '#3B82F6',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 5,
    unit: 'phút',
    habitType: 'build',
    targetDays: 14,
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Hít vào 4 giây, giữ 4 giây, thở ra 4 giây', 'Làm khi cảm thấy căng thẳng', 'Ngồi thoải mái'],
    commonObstacles: ['Quên thực hiện', 'Không kiên nhẫn', 'Cảm thấy không hiệu quả'],
    benefits: ['Giảm lo âu', 'Hạ huyết áp', 'Cải thiện giấc ngủ', 'Tăng sự tỉnh táo'],
    isPopular: true
  },
  {
    name: 'Tắm nắng 15 phút',
    description: 'Ra ngoài tắm nắng để bổ sung vitamin D tự nhiên',
    category: 'mindful',
    icon: '☀️',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 15,
    unit: 'phút',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Tắm nắng vào buổi sáng sớm', 'Không cần kem chống nắng trong 15 phút đầu', 'Kết hợp với đi bộ'],
    commonObstacles: ['Thời tiết xấu', 'Không có thời gian', 'Sợ đen da'],
    benefits: ['Tăng vitamin D', 'Cải thiện tâm trạng', 'Tăng cường miễn dịch', 'Điều hòa giấc ngủ'],
    isPopular: false
  },
  {
    name: 'Ngắt kết nối mạng xã hội 1 giờ',
    description: 'Dành 1 giờ mỗi ngày không sử dụng mạng xã hội',
    category: 'mindful',
    icon: '📵',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'medium',
    estimatedTime: 60,
    tips: ['Chọn khung giờ cố định', 'Thay thế bằng hoạt động khác', 'Tắt thông báo'],
    commonObstacles: ['FOMO', 'Thói quen mở app', 'Nhàm chán'],
    benefits: ['Giảm căng thẳng', 'Tăng tập trung', 'Có thời gian cho bản thân', 'Giảm so sánh'],
    isPopular: true
  },

  // ==================== FINANCE ====================
  {
    name: 'Theo dõi chi tiêu hàng ngày',
    description: 'Ghi chép tất cả chi tiêu để quản lý tài chính tốt hơn',
    category: 'finance',
    icon: '💰',
    color: '#22C55E',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Dùng app quản lý tài chính', 'Chụp ảnh hóa đơn', 'Xem lại cuối tuần', 'Phân loại chi tiêu'],
    commonObstacles: ['Quên ghi chép', 'Lười theo dõi', 'Không biết phân loại'],
    benefits: ['Kiểm soát chi tiêu', 'Tiết kiệm tiền', 'Nhận biết thói quen chi tiêu xấu'],
    isPopular: true
  },
  {
    name: 'Tiết kiệm 50,000đ mỗi ngày',
    description: 'Để dành một khoản nhỏ mỗi ngày để xây dựng quỹ dự phòng',
    category: 'finance',
    icon: '🏦',
    color: '#10B981',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 50000,
    unit: 'đồng',
    habitType: 'build',
    targetDays: 90,
    difficulty: 'medium',
    estimatedTime: 2,
    tips: ['Tự động chuyển tiền vào tài khoản tiết kiệm', 'Cắt giảm chi tiêu không cần thiết', 'Đặt mục tiêu cụ thể'],
    commonObstacles: ['Thu nhập thấp', 'Chi tiêu phát sinh', 'Thiếu kỷ luật'],
    benefits: ['Xây dựng quỹ dự phòng', 'Tạo thói quen tiết kiệm', 'An tâm tài chính'],
    isPopular: true
  },
  {
    name: 'Đọc tin tức tài chính',
    description: 'Cập nhật kiến thức về tài chính và đầu tư',
    category: 'finance',
    icon: '📰',
    color: '#6366F1',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 10,
    unit: 'phút',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Theo dõi các trang tin uy tín', 'Đọc vào buổi sáng', 'Ghi chép thông tin quan trọng'],
    commonObstacles: ['Quá nhiều thông tin', 'Khó hiểu', 'Không biết nguồn nào đáng tin'],
    benefits: ['Nâng cao hiểu biết tài chính', 'Đưa ra quyết định đầu tư tốt hơn', 'Phát hiện cơ hội'],
    isPopular: false
  },
  {
    name: 'Xem xét ngân sách hàng tuần',
    description: 'Đánh giá chi tiêu và điều chỉnh ngân sách mỗi tuần',
    category: 'finance',
    icon: '📊',
    color: '#F59E0B',
    frequency: 'weekly',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 20,
    tips: ['Chọn ngày cố định mỗi tuần', 'So sánh với tuần trước', 'Điều chỉnh kế hoạch nếu cần'],
    commonObstacles: ['Quên không làm', 'Không có hệ thống theo dõi', 'Ngại đối mặt với chi tiêu'],
    benefits: ['Kiểm soát tài chính tốt hơn', 'Phát hiện chi tiêu lãng phí', 'Đạt mục tiêu tài chính'],
    isPopular: true
  },
  {
    name: 'Không mua sắm impulsive',
    description: 'Chờ 24 giờ trước khi mua những thứ không thiết yếu',
    category: 'finance',
    icon: '🛑',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'quit',
    targetDays: 30,
    difficulty: 'hard',
    estimatedTime: 5,
    tips: ['Tạo danh sách mong muốn', 'Tự hỏi "Có thực sự cần không?"', 'Xóa thông tin thẻ khỏi web mua sắm'],
    commonObstacles: ['Khuyến mãi hấp dẫn', 'Cảm xúc tiêu cực', 'Áp lực bạn bè'],
    benefits: ['Tiết kiệm tiền', 'Giảm lãng phí', 'Mua những thứ thực sự cần'],
    isPopular: true
  },

  // ==================== DIGITAL ====================
  {
    name: 'Hạn chế social media',
    description: 'Giảm thời gian lướt mạng xã hội xuống dưới 1 tiếng/ngày',
    category: 'digital',
    icon: '📱',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 60,
    unit: 'phút',
    habitType: 'quit',
    targetDays: 30,
    difficulty: 'hard',
    estimatedTime: 60,
    tips: ['Tắt thông báo không cần thiết', 'Để điện thoại xa khi làm việc', 'Dùng app giới hạn thời gian', 'Xóa app social media khỏi màn hình chính'],
    commonObstacles: ['Nghiện social media', 'FOMO (sợ bỏ lỡ thông tin)', 'Thói quen mở app tự động'],
    benefits: ['Tăng tập trung', 'Có thêm thời gian cho việc khác', 'Giảm so sánh bản thân với người khác'],
    isPopular: true
  },
  {
    name: 'Tắt điện thoại trước khi ngủ 1 tiếng',
    description: 'Ngừng sử dụng thiết bị điện tử trước giờ ngủ để cải thiện giấc ngủ',
    category: 'digital',
    icon: '💤',
    color: '#6B7280',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'medium',
    estimatedTime: 5,
    tips: ['Đặt điện thoại xa giường ngủ', 'Đọc sách thay vì lướt điện thoại', 'Dùng đồng hồ báo thức thay vì điện thoại'],
    commonObstacles: ['Thói quen lướt điện thoại trước khi ngủ', 'Lo lắng bỏ lỡ tin nhắn', 'Buồn chán'],
    benefits: ['Cải thiện chất lượng giấc ngủ', 'Giảm căng thẳng mắt', 'Ngủ nhanh hơn'],
    isPopular: true
  },
  {
    name: 'Dọn dẹp email inbox',
    description: 'Giữ hộp thư đến sạch sẽ, xóa email không cần thiết',
    category: 'digital',
    icon: '📧',
    color: '#3B82F6',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Xử lý email ngay khi đọc', 'Hủy đăng ký newsletter không đọc', 'Tạo thư mục phân loại'],
    commonObstacles: ['Quá nhiều email', 'Lười xóa', 'Sợ xóa nhầm email quan trọng'],
    benefits: ['Giảm stress', 'Tìm email dễ dàng hơn', 'Tăng năng suất'],
    isPopular: false
  },
  {
    name: 'Sao lưu dữ liệu quan trọng',
    description: 'Backup dữ liệu định kỳ để tránh mất mát',
    category: 'digital',
    icon: '💾',
    color: '#10B981',
    frequency: 'weekly',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Dùng cloud storage tự động', 'Backup vào ổ cứng ngoài', 'Kiểm tra backup định kỳ'],
    commonObstacles: ['Quên không backup', 'Không biết cách backup', 'Chi phí lưu trữ'],
    benefits: ['An toàn dữ liệu', 'Yên tâm hơn', 'Dễ khôi phục khi có sự cố'],
    isPopular: false
  },
  {
    name: 'Học một công cụ digital mới',
    description: 'Nâng cao kỹ năng digital bằng cách học công cụ mới',
    category: 'digital',
    icon: '💻',
    color: '#8B5CF6',
    frequency: 'weekly',
    trackingMode: 'count',
    targetCount: 2,
    unit: 'giờ',
    habitType: 'build',
    targetDays: 60,
    difficulty: 'medium',
    estimatedTime: 120,
    tips: ['Chọn công cụ phù hợp với công việc', 'Xem tutorial trên YouTube', 'Thực hành ngay'],
    commonObstacles: ['Không biết học gì', 'Quá nhiều lựa chọn', 'Khó học'],
    benefits: ['Tăng năng suất', 'Nâng cao kỹ năng nghề nghiệp', 'Tự động hóa công việc'],
    isPopular: true
  },

  // ==================== SOCIAL ====================
  {
    name: 'Gọi điện cho gia đình',
    description: 'Duy trì liên lạc với gia đình để củng cố mối quan hệ',
    category: 'social',
    icon: '📱',
    color: '#EC4899',
    frequency: 'weekly',
    trackingMode: 'count',
    targetCount: 2,
    unit: 'lần',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 15,
    tips: ['Đặt lịch gọi cố định', 'Chuẩn bị chủ đề trò chuyện', 'Video call để thân thiết hơn'],
    commonObstacles: ['Bận rộn', 'Không biết nói gì', 'Chênh lệch múi giờ'],
    benefits: ['Củng cố mối quan hệ gia đình', 'Chia sẻ cảm xúc', 'Giảm cô đơn'],
    isPopular: true
  },
  {
    name: 'Gặp gỡ bạn bè',
    description: 'Dành thời gian gặp mặt bạn bè để duy trì tình bạn',
    category: 'social',
    icon: '👥',
    color: '#F59E0B',
    frequency: 'weekly',
    trackingMode: 'count',
    targetCount: 1,
    unit: 'lần',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'easy',
    estimatedTime: 120,
    tips: ['Lên kế hoạch trước', 'Chọn hoạt động cùng thích', 'Gặp gỡ định kỳ mỗi tuần'],
    commonObstacles: ['Bận công việc', 'Xa nhau', 'Lười ra ngoài'],
    benefits: ['Duy trì tình bạn', 'Giảm căng thẳng', 'Tăng cường hạnh phúc'],
    isPopular: true
  },
  {
    name: 'Khen ngợi ai đó mỗi ngày',
    description: 'Nói lời khen chân thành với ít nhất một người mỗi ngày',
    category: 'social',
    icon: '💝',
    color: '#EC4899',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 2,
    tips: ['Khen về hành động cụ thể', 'Chân thành và tự nhiên', 'Không khen quá đáng'],
    commonObstacles: ['Ngại ngùng', 'Không biết khen gì', 'Sợ người khác hiểu lầm'],
    benefits: ['Cải thiện mối quan hệ', 'Tạo môi trường tích cực', 'Tăng sự tự tin'],
    isPopular: true
  },
  {
    name: 'Tham gia hoạt động cộng đồng',
    description: 'Đóng góp cho cộng đồng qua hoạt động tình nguyện',
    category: 'social',
    icon: '🤝',
    color: '#22C55E',
    frequency: 'monthly',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 90,
    difficulty: 'medium',
    estimatedTime: 180,
    tips: ['Tìm tổ chức phù hợp', 'Bắt đầu với hoạt động nhỏ', 'Rủ bạn bè cùng tham gia'],
    commonObstacles: ['Không biết bắt đầu từ đâu', 'Thiếu thời gian', 'Ngại tiếp xúc người lạ'],
    benefits: ['Tạo tác động tích cực', 'Mở rộng mạng lưới', 'Tăng cảm giác hạnh phúc'],
    isPopular: false
  },
  {
    name: 'Nhắn tin quan tâm bạn bè',
    description: 'Chủ động nhắn tin hỏi thăm bạn bè',
    category: 'social',
    icon: '💬',
    color: '#3B82F6',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 1,
    unit: 'người',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Đặt nhắc nhở', 'Hỏi thăm chân thành', 'Không chỉ nhắn tin khi cần giúp đỡ'],
    commonObstacles: ['Quên', 'Ngại làm phiền', 'Không biết nói gì'],
    benefits: ['Duy trì mối quan hệ', 'Tạo cảm giác gần gũi', 'Có người hỗ trợ khi cần'],
    isPopular: true
  },

  // ==================== CONTROL (Self-discipline) ====================
  {
    name: 'Dậy sớm 6 giờ sáng',
    description: 'Thức dậy sớm để có thêm thời gian cho bản thân',
    category: 'control',
    icon: '⏰',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'hard',
    estimatedTime: 5,
    tips: ['Ngủ sớm hơn', 'Đặt báo thức xa giường', 'Có mục tiêu rõ ràng cho buổi sáng'],
    commonObstacles: ['Thức khuya', 'Tắt báo thức rồi ngủ tiếp', 'Trời tối quá'],
    benefits: ['Có thêm thời gian', 'Tăng năng suất', 'Cảm thấy kiểm soát cuộc sống hơn'],
    isPopular: true
  },
  {
    name: 'Hoàn thành 3 việc quan trọng nhất',
    description: 'Ưu tiên làm 3 việc quan trọng nhất mỗi ngày',
    category: 'control',
    icon: '✅',
    color: '#10B981',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 180,
    tips: ['Lên kế hoạch tối hôm trước', 'Làm việc khó nhất trước', 'Loại bỏ phiền nhiễu'],
    commonObstacles: ['Bị phân tâm', 'Việc mất nhiều thời gian hơn dự kiến', 'Ưu tiên sai'],
    benefits: ['Tăng năng suất', 'Cảm giác hoàn thành', 'Tiến bộ rõ rệt'],
    isPopular: true
  },
  {
    name: 'Lên kế hoạch ngày mai',
    description: 'Dành 10 phút mỗi tối để lên kế hoạch cho ngày hôm sau',
    category: 'control',
    icon: '📝',
    color: '#6366F1',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Viết ra giấy', 'Ưu tiên 3 việc quan trọng nhất', 'Dự tính thời gian cho từng việc'],
    commonObstacles: ['Quên lên kế hoạch', 'Mệt mỏi buổi tối', 'Không biết ưu tiên'],
    benefits: ['Bắt đầu ngày có định hướng', 'Giảm stress', 'Tăng hiệu suất'],
    isPopular: true
  },
  {
    name: 'Dọn dẹp không gian làm việc',
    description: 'Giữ bàn làm việc sạch sẽ và ngăn nắp',
    category: 'control',
    icon: '🧹',
    color: '#22C55E',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Dọn cuối ngày làm việc', 'Chỉ để đồ cần thiết trên bàn', 'Có hệ thống sắp xếp'],
    commonObstacles: ['Lười dọn', 'Không có thời gian', 'Bừa bộn lại nhanh'],
    benefits: ['Tăng tập trung', 'Giảm stress', 'Tìm đồ dễ dàng hơn', 'Tâm trạng tích cực'],
    isPopular: true
  },
  {
    name: 'Không trì hoãn công việc',
    description: 'Làm ngay thay vì trì hoãn những việc quan trọng',
    category: 'control',
    icon: '🎯',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'quit',
    targetDays: 30,
    difficulty: 'hard',
    estimatedTime: 5,
    tips: ['Áp dụng quy tắc 2 phút', 'Chia nhỏ công việc lớn', 'Loại bỏ phiền nhiễu'],
    commonObstacles: ['Sợ thất bại', 'Hoàn hảo chủ nghĩa', 'Không biết bắt đầu từ đâu'],
    benefits: ['Hoàn thành nhiều việc hơn', 'Giảm stress', 'Tăng sự tự tin'],
    isPopular: true
  },

  // ==================== SLEEP ====================
  {
    name: 'Ngủ đúng giờ (11 PM)',
    description: 'Duy trì giờ giấc ngủ đều đặn để cải thiện sức khỏe',
    category: 'sleep',
    icon: '💤',
    color: '#6366F1',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'medium',
    estimatedTime: 480,
    tips: ['Tạo thói quen trước khi ngủ', 'Tránh caffeine buổi chiều', 'Điều chỉnh ánh sáng phòng ngủ', 'Tắt điện thoại sớm'],
    commonObstacles: ['Thức khuya làm việc', 'Khó ngủ', 'Bị kích thích bởi màn hình'],
    benefits: ['Cải thiện chất lượng giấc ngủ', 'Tăng năng lượng', 'Cân bằng hormone'],
    isPopular: true
  },
  {
    name: 'Ngủ đủ 8 tiếng',
    description: 'Đảm bảo có đủ giấc ngủ để phục hồi cơ thể',
    category: 'sleep',
    icon: '😴',
    color: '#8B5CF6',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 8,
    unit: 'giờ',
    habitType: 'build',
    targetDays: 30,
    difficulty: 'medium',
    estimatedTime: 480,
    tips: ['Tính ngược từ giờ thức dậy', 'Tạo môi trường ngủ thoải mái', 'Không uống nhiều nước trước khi ngủ'],
    commonObstacles: ['Mất ngủ', 'Thức khuya', 'Bị đánh thức giữa đêm'],
    benefits: ['Phục hồi cơ thể', 'Cải thiện trí nhớ', 'Tăng cường hệ miễn dịch'],
    isPopular: true
  },
  {
    name: 'Không ngủ trưa quá 30 phút',
    description: 'Ngủ trưa ngắn để tái tạo năng lượng mà không ảnh hưởng giấc ngủ đêm',
    category: 'sleep',
    icon: '☀️',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 14,
    difficulty: 'easy',
    estimatedTime: 30,
    tips: ['Đặt báo thức', 'Ngủ trước 3 giờ chiều', 'Tìm nơi yên tĩnh'],
    commonObstacles: ['Ngủ quá lâu', 'Không có chỗ ngủ trưa', 'Cảm thấy ngủ gà ngủ gật'],
    benefits: ['Tăng năng lượng chiều', 'Cải thiện tập trung', 'Không ảnh hưởng giấc ngủ đêm'],
    isPopular: true
  },
  {
    name: 'Tạo thói quen trước khi ngủ',
    description: 'Có một chuỗi hành động cố định trước khi đi ngủ',
    category: 'sleep',
    icon: '🌙',
    color: '#6B7280',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 30,
    tips: ['Làm cùng một chuỗi hành động mỗi đêm', 'Bao gồm hoạt động thư giãn', 'Tránh kích thích'],
    commonObstacles: ['Lịch trình không cố định', 'Bị gián đoạn', 'Quá mệt để duy trì'],
    benefits: ['Ngủ nhanh hơn', 'Giấc ngủ sâu hơn', 'Cơ thể biết đã đến giờ ngủ'],
    isPopular: true
  },
  {
    name: 'Tránh caffeine sau 2 giờ chiều',
    description: 'Không uống cà phê hoặc đồ uống chứa caffeine sau 2 giờ chiều',
    category: 'sleep',
    icon: '☕',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'quit',
    targetDays: 14,
    difficulty: 'medium',
    estimatedTime: 5,
    tips: ['Chuyển sang trà thảo mộc', 'Uống nước thay thế', 'Ngủ trưa để tránh buồn ngủ chiều'],
    commonObstacles: ['Buồn ngủ chiều', 'Thói quen uống cà phê', 'Họp chiều cần tỉnh táo'],
    benefits: ['Ngủ dễ hơn', 'Giấc ngủ sâu hơn', 'Không bị mất ngủ'],
    isPopular: true
  },

  // ==================== ENERGY ====================
  {
    name: 'Uống trà xanh thay cà phê',
    description: 'Thay thế cà phê bằng trà xanh để có năng lượng bền vững',
    category: 'energy',
    icon: '🍵',
    color: '#22C55E',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 5,
    tips: ['Pha trà xanh vào buổi sáng', 'Thử nhiều loại trà xanh khác nhau', 'Thêm chanh hoặc mật ong'],
    commonObstacles: ['Không quen vị trà', 'Vẫn thèm cà phê', 'Không biết pha trà'],
    benefits: ['Năng lượng ổn định', 'Chống oxy hóa', 'Giảm lo âu', 'Tốt cho tim mạch'],
    isPopular: true
  },
  {
    name: 'Nghỉ ngơi giữa giờ làm việc',
    description: 'Nghỉ ngơi 5-10 phút sau mỗi giờ làm việc để tránh kiệt sức',
    category: 'energy',
    icon: '⏰',
    color: '#F59E0B',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 5,
    unit: 'lần',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Đặt timer nhắc nhở', 'Đứng dậy và vận động nhẹ', 'Nhìn xa để thư giãn mắt', 'Uống nước'],
    commonObstacles: ['Quá mải mê công việc', 'Áp lực deadline', 'Cảm thấy tội lỗi khi nghỉ'],
    benefits: ['Duy trì năng lượng', 'Tăng hiệu suất làm việc', 'Giảm mỏi mắt', 'Phòng tránh burn out'],
    isPopular: true
  },
  {
    name: 'Ăn nhẹ lành mạnh',
    description: 'Chọn đồ ăn nhẹ bổ dưỡng thay vì đồ ăn vặt không lành mạnh',
    category: 'energy',
    icon: '🥗',
    color: '#10B981',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'build',
    targetDays: 21,
    difficulty: 'medium',
    estimatedTime: 10,
    tips: ['Chuẩn bị sẵn hoa quả, hạt', 'Tránh để đồ ăn vặt trong nhà', 'Uống nước khi đói'],
    commonObstacles: ['Thèm đồ ngọt', 'Đồ lành mạnh không ngon', 'Đắt hơn'],
    benefits: ['Năng lượng ổn định', 'Kiểm soát cân nặng', 'Tốt cho sức khỏe'],
    isPopular: true
  },
  {
    name: 'Vận động nhẹ buổi sáng',
    description: 'Khởi động cơ thể với vận động nhẹ nhàng sau khi thức dậy',
    category: 'energy',
    icon: '🤸',
    color: '#6366F1',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 10,
    unit: 'phút',
    habitType: 'build',
    targetDays: 21,
    difficulty: 'easy',
    estimatedTime: 10,
    tips: ['Giãn cơ ngay trên giường', 'Làm vài động tác đơn giản', 'Kết hợp với uống nước'],
    commonObstacles: ['Lười', 'Ngủ dậy trễ', 'Không biết động tác nào'],
    benefits: ['Đánh thức cơ thể', 'Tăng tuần hoàn máu', 'Tỉnh táo hơn', 'Giảm đau nhức'],
    isPopular: true
  },
  {
    name: 'Giảm đường tinh luyện',
    description: 'Hạn chế ăn đồ ngọt và đường để tránh tụt năng lượng',
    category: 'energy',
    icon: '🍬',
    color: '#EF4444',
    frequency: 'daily',
    trackingMode: 'check',
    targetCount: 1,
    habitType: 'quit',
    targetDays: 30,
    difficulty: 'hard',
    estimatedTime: 5,
    tips: ['Thay bằng trái cây', 'Đọc nhãn thành phần', 'Giảm dần thay vì cắt hẳn'],
    commonObstacles: ['Thèm đồ ngọt', 'Stress ăn uống', 'Đường có ở khắp nơi'],
    benefits: ['Năng lượng ổn định', 'Giảm cân', 'Giảm nguy cơ bệnh tật', 'Làn da đẹp hơn'],
    isPopular: true
  }
];

// Habit Suggestions (from survey analysis)
const habitSuggestions = [
  // === HEALTH ===
  {
    name: 'Uống nước',
    description: 'Duy trì đủ nước cho cơ thể để cải thiện sức khỏe tổng thể',
    category: 'health',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 8,
    unit: 'ly',
    icon: '💧',
    color: '#3B82F6',
    tags: ['hydration', 'health', 'wellness'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: { health_3: [1, 2] }
  },
  {
    name: 'Tập thể dục buổi sáng',
    description: 'Bắt đầu ngày với tập thể dục nhẹ',
    category: 'health',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🏃',
    color: '#F59E0B',
    tags: ['morning', 'exercise', 'energy'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: { health_1: [1, 2] }
  },
  {
    name: 'Ngủ đúng giờ (11 PM)',
    description: 'Duy trì giờ giấc ngủ đều đặn',
    category: 'health',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '😴',
    color: '#6366F1',
    tags: ['sleep', 'health', 'routine'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_2: [1, 2], sleep_2: [1, 2] }
  },
  {
    name: 'Ăn rau quả',
    description: 'Bổ sung vitamin và chất xơ cần thiết',
    category: 'health',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 5,
    unit: 'phần',
    icon: '🥬',
    color: '#22C55E',
    tags: ['nutrition', 'health', 'diet'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_4: [1, 2] }
  },
  {
    name: 'Ăn sáng đầy đủ',
    description: 'Không bỏ bữa sáng để có năng lượng',
    category: 'health',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🍳',
    color: '#F59E0B',
    tags: ['nutrition', 'energy', 'morning'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: { health_4: [1, 2], energy_1: [1, 2] }
  },
  {
    name: 'Uống vitamin tổng hợp',
    description: 'Bổ sung vitamin và khoáng chất',
    category: 'health',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '💊',
    color: '#EC4899',
    tags: ['supplement', 'health', 'wellness'],
    requiredScore: 0,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_6: [1, 2] }
  },

  // === PRODUCTIVITY ===
  {
    name: 'Làm việc tập trung (Pomodoro)',
    description: 'Làm việc 25 phút, nghỉ 5 phút',
    category: 'productivity',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 4,
    unit: 'pomodoro',
    icon: '⏰',
    color: '#EF4444',
    tags: ['focus', 'productivity', 'time-management'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { productivity_2: [1, 2] }
  },
  {
    name: 'Viết to-do list mỗi sáng',
    description: 'Lên kế hoạch công việc trong ngày',
    category: 'productivity',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '✅',
    color: '#10B981',
    tags: ['planning', 'organization', 'productivity'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: { productivity_3: [1, 2] }
  },
  {
    name: 'Dọn dẹp bàn làm việc cuối ngày',
    description: 'Tạo không gian làm việc gọn gàng',
    category: 'productivity',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🗂️',
    color: '#8B5CF6',
    tags: ['organization', 'workspace', 'productivity'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { productivity_5: [1, 2], control_3: [1, 2] }
  },
  {
    name: 'Làm việc khó nhất trước',
    description: 'Hoàn thành việc quan trọng nhất buổi sáng',
    category: 'productivity',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🎯',
    color: '#EF4444',
    tags: ['priority', 'productivity', 'focus'],
    requiredScore: 1,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { productivity_4: [1, 2], control_5: [1, 2] }
  },
  {
    name: 'Dậy sớm lúc 6 giờ sáng',
    description: 'Thức dậy sớm để có thời gian cho bản thân',
    category: 'productivity',
    difficulty: 'hard',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🌅',
    color: '#F59E0B',
    tags: ['morning', 'routine', 'discipline'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven', 'health-focused'],
    triggerConditions: { productivity_6: [1, 2], control_2: [1, 2] }
  },
  {
    name: 'Lên kế hoạch cho ngày mai',
    description: 'Chuẩn bị cho ngày hôm sau',
    category: 'productivity',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📋',
    color: '#6366F1',
    tags: ['planning', 'organization', 'preparation'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: { control_4: [1, 2] }
  },
  {
    name: 'Hoàn thành việc ưu tiên',
    description: 'Tập trung vào 3 việc quan trọng nhất',
    category: 'productivity',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 3,
    unit: 'việc',
    icon: '🏆',
    color: '#10B981',
    tags: ['priority', 'goals', 'achievement'],
    requiredScore: 1,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { productivity_1: [1, 2] }
  },

  // === LEARNING ===
  {
    name: 'Đọc sách',
    description: 'Đọc sách phát triển kỹ năng',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 30,
    unit: 'trang',
    icon: '📚',
    color: '#10B981',
    tags: ['learning', 'skill', 'career'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker', 'productivity-driven'],
    triggerConditions: { learning_2: [1, 2] }
  },
  {
    name: 'Học ngoại ngữ',
    description: 'Học ngôn ngữ mới mỗi ngày',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 20,
    unit: 'từ',
    icon: '🌐',
    color: '#EC4899',
    tags: ['language', 'skill', 'self-improvement'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker'],
    triggerConditions: { learning_3: [1, 2] }
  },
  {
    name: 'Xem video giáo dục',
    description: 'Xem TED talks hoặc video học tập',
    category: 'learning',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📺',
    color: '#F59E0B',
    tags: ['learning', 'video', 'knowledge'],
    requiredScore: 0,
    targetPersonas: ['knowledge-seeker', 'balanced-lifestyle'],
    triggerConditions: { learning_1: [1, 2], learning_4: [1, 2] }
  },
  {
    name: 'Nghe podcast',
    description: 'Tận dụng thời gian đi lại để học',
    category: 'learning',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🎧',
    color: '#8B5CF6',
    tags: ['learning', 'podcast', 'multitasking'],
    requiredScore: 0,
    targetPersonas: ['knowledge-seeker', 'balanced-lifestyle'],
    triggerConditions: { learning_4: [1, 2] }
  },
  {
    name: 'Ghi chép kiến thức',
    description: 'Viết lại kiến thức để củng cố',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '✍️',
    color: '#10B981',
    tags: ['note-taking', 'learning', 'memory'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker'],
    triggerConditions: { learning_5: [1, 2] }
  },
  {
    name: 'Học một kỹ năng mới',
    description: 'Phát triển kỹ năng mới mỗi tuần',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '🎓',
    color: '#6366F1',
    tags: ['skill', 'learning', 'growth'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker', 'productivity-driven'],
    triggerConditions: { learning_3: [1, 2] }
  },
  {
    name: 'Tóm tắt kiến thức đã học',
    description: 'Viết tóm tắt hoặc dạy lại',
    category: 'learning',
    difficulty: 'medium',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '📝',
    color: '#3B82F6',
    tags: ['review', 'comprehension', 'learning'],
    requiredScore: 1,
    targetPersonas: ['knowledge-seeker'],
    triggerConditions: { learning_5: [1, 2] }
  },

  // === MINDFUL ===
  {
    name: 'Thiền',
    description: 'Thực hành thiền để giảm stress',
    category: 'mindful',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🧘',
    color: '#8B5CF6',
    tags: ['meditation', 'mindfulness', 'stress-relief'],
    requiredScore: 2,
    targetPersonas: ['mindful-seeker'],
    triggerConditions: { mindful_1: [1, 2], mindful_2: [1, 2] }
  },
  {
    name: 'Viết nhật ký biết ơn',
    description: 'Ghi 3 điều biết ơn mỗi ngày',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 3,
    unit: 'điều',
    icon: '📝',
    color: '#F59E0B',
    tags: ['gratitude', 'journaling', 'positivity'],
    requiredScore: 0,
    targetPersonas: ['mindful-seeker', 'balanced-lifestyle'],
    triggerConditions: { mindful_3: [1, 2], mindful_5: [1, 2] }
  },
  {
    name: 'Tập yoga buổi sáng',
    description: 'Bắt đầu ngày với yoga',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🧘‍♀️',
    color: '#EC4899',
    tags: ['yoga', 'flexibility', 'mindfulness'],
    requiredScore: 1,
    targetPersonas: ['mindful-seeker', 'health-focused'],
    triggerConditions: { mindful_2: [1, 2], fitness_3: [1, 2] }
  },
  {
    name: 'Thực hành hít thở sâu',
    description: 'Luyện hít thở sâu để giảm căng thẳng',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 3,
    unit: 'lần',
    icon: '🌬️',
    color: '#3B82F6',
    tags: ['breathing', 'relaxation', 'stress-relief'],
    requiredScore: 0,
    targetPersonas: ['mindful-seeker', 'balanced-lifestyle'],
    triggerConditions: { mindful_1: [1, 2] }
  },
  {
    name: 'Ra ngoài tiếp xúc thiên nhiên',
    description: 'Dành thời gian ra ngoài trời',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🌳',
    color: '#22C55E',
    tags: ['nature', 'outdoor', 'wellness'],
    requiredScore: 0,
    targetPersonas: ['mindful-seeker', 'health-focused'],
    triggerConditions: { mindful_4: [1, 2] }
  },
  {
    name: 'Digital detox',
    description: 'Ngắt kết nối với công nghệ',
    category: 'mindful',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📵',
    color: '#EF4444',
    tags: ['digital-detox', 'wellness', 'relaxation'],
    requiredScore: 1,
    targetPersonas: ['mindful-seeker', 'balanced-lifestyle'],
    triggerConditions: { mindful_6: [1, 2], digital_1: [1, 2] }
  },
  {
    name: 'Viết nhật ký cảm xúc',
    description: 'Ghi lại suy nghĩ và cảm xúc',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📖',
    color: '#6366F1',
    tags: ['journaling', 'self-awareness', 'emotions'],
    requiredScore: 0,
    targetPersonas: ['mindful-seeker'],
    triggerConditions: { mindful_3: [1, 2] }
  },
  {
    name: 'Tắm nắng',
    description: 'Bổ sung vitamin D tự nhiên',
    category: 'mindful',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '☀️',
    color: '#F59E0B',
    tags: ['sunshine', 'vitamin-d', 'health'],
    requiredScore: 0,
    targetPersonas: ['mindful-seeker', 'health-focused'],
    triggerConditions: { mindful_4: [1, 2] }
  },

  // === FINANCE ===
  {
    name: 'Ghi chép chi tiêu',
    description: 'Ghi chép tất cả khoản chi tiêu',
    category: 'finance',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '💰',
    color: '#22C55E',
    tags: ['finance', 'budgeting', 'tracking'],
    requiredScore: 0,
    targetPersonas: ['finance-conscious', 'balanced-lifestyle'],
    triggerConditions: { finance_1: [1, 2], finance_3: [1, 2] }
  },
  {
    name: 'Tiết kiệm tiền',
    description: 'Để dành một khoản tiền cố định',
    category: 'finance',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 50000,
    unit: 'đồng',
    icon: '🏦',
    color: '#10B981',
    tags: ['savings', 'finance', 'money'],
    requiredScore: 1,
    targetPersonas: ['finance-conscious'],
    triggerConditions: { finance_2: [1, 2] }
  },
  {
    name: 'Đọc tin tức tài chính',
    description: 'Cập nhật kiến thức tài chính',
    category: 'finance',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📈',
    color: '#EF4444',
    tags: ['finance', 'learning', 'investment'],
    requiredScore: 1,
    targetPersonas: ['finance-conscious', 'knowledge-seeker'],
    triggerConditions: { finance_5: [1, 2] }
  },
  {
    name: 'Xem xét ngân sách',
    description: 'Đánh giá và điều chỉnh ngân sách',
    category: 'finance',
    difficulty: 'easy',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '📊',
    color: '#6366F1',
    tags: ['budgeting', 'finance', 'planning'],
    requiredScore: 1,
    targetPersonas: ['finance-conscious'],
    triggerConditions: { finance_1: [1, 2] }
  },
  {
    name: 'Không mua sắm impulsive',
    description: 'Chờ 24 giờ trước khi mua',
    category: 'finance',
    difficulty: 'hard',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🛑',
    color: '#EF4444',
    tags: ['finance', 'self-control', 'savings'],
    requiredScore: 2,
    targetPersonas: ['finance-conscious'],
    triggerConditions: { finance_4: [1, 2] }
  },
  {
    name: 'Lập mục tiêu tài chính',
    description: 'Xác định mục tiêu ngắn và dài hạn',
    category: 'finance',
    difficulty: 'medium',
    frequency: 'monthly',
    trackingMode: 'check',
    icon: '🎯',
    color: '#8B5CF6',
    tags: ['goals', 'planning', 'finance'],
    requiredScore: 1,
    targetPersonas: ['finance-conscious'],
    triggerConditions: { finance_1: [1, 2], finance_2: [1, 2] }
  },

  // === DIGITAL WELLBEING ===
  {
    name: 'Hạn chế social media',
    description: 'Giảm thời gian lướt mạng xã hội',
    category: 'digital',
    difficulty: 'hard',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📱',
    color: '#EF4444',
    tags: ['digital-detox', 'focus', 'wellbeing'],
    requiredScore: 2,
    targetPersonas: ['balanced-lifestyle', 'productivity-driven'],
    triggerConditions: { digital_1: [1, 2] }
  },
  {
    name: 'Tắt điện thoại trước khi ngủ',
    description: 'Ngừng sử dụng thiết bị điện tử trước giờ ngủ',
    category: 'digital',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🌙',
    color: '#6B7280',
    tags: ['sleep', 'digital-detox', 'health'],
    requiredScore: 1,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: { digital_2: [1, 2], health_2: [1, 2] }
  },
  {
    name: 'Dọn dẹp email inbox',
    description: 'Giữ hộp thư sạch sẽ',
    category: 'digital',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📧',
    color: '#3B82F6',
    tags: ['organization', 'productivity', 'digital'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { digital_3: [1, 2] }
  },
  {
    name: 'Sao lưu dữ liệu',
    description: 'Backup dữ liệu định kỳ',
    category: 'digital',
    difficulty: 'easy',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '💾',
    color: '#10B981',
    tags: ['backup', 'security', 'digital'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { digital_4: [1, 2] }
  },
  {
    name: 'Học công cụ digital mới',
    description: 'Nâng cao kỹ năng công nghệ',
    category: 'digital',
    difficulty: 'medium',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '💻',
    color: '#8B5CF6',
    tags: ['learning', 'technology', 'skill'],
    requiredScore: 1,
    targetPersonas: ['productivity-driven', 'knowledge-seeker'],
    triggerConditions: { digital_5: [1, 2] }
  },
  {
    name: 'Tắt thông báo không cần thiết',
    description: 'Kiểm soát thông báo giảm phân tâm',
    category: 'digital',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🔕',
    color: '#F59E0B',
    tags: ['focus', 'productivity', 'digital-wellbeing'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: { digital_6: [1, 2] }
  },
  {
    name: 'Không dùng điện thoại khi ăn',
    description: 'Tập trung vào bữa ăn',
    category: 'digital',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🍽️',
    color: '#22C55E',
    tags: ['mindful-eating', 'digital-detox', 'presence'],
    requiredScore: 1,
    targetPersonas: ['mindful-seeker', 'balanced-lifestyle'],
    triggerConditions: { digital_1: [1, 2], digital_2: [1, 2] }
  },

  // === SOCIAL ===
  {
    name: 'Gọi điện cho gia đình',
    description: 'Duy trì liên lạc với gia đình',
    category: 'social',
    difficulty: 'easy',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '📞',
    color: '#EC4899',
    tags: ['family', 'communication', 'relationships'],
    requiredScore: 0,
    targetPersonas: ['social-connector', 'balanced-lifestyle'],
    triggerConditions: { social_1: [1, 2] }
  },
  {
    name: 'Gặp gỡ bạn bè',
    description: 'Dành thời gian với bạn bè',
    category: 'social',
    difficulty: 'easy',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '👥',
    color: '#F59E0B',
    tags: ['friends', 'social', 'relationships'],
    requiredScore: 0,
    targetPersonas: ['social-connector', 'balanced-lifestyle'],
    triggerConditions: { social_2: [1, 2] }
  },
  {
    name: 'Tham gia hoạt động cộng đồng',
    description: 'Tham gia tình nguyện hoặc câu lạc bộ',
    category: 'social',
    difficulty: 'medium',
    frequency: 'monthly',
    trackingMode: 'check',
    icon: '🤝',
    color: '#10B981',
    tags: ['community', 'volunteering', 'social'],
    requiredScore: 1,
    targetPersonas: ['social-connector'],
    triggerConditions: { social_4: [1, 2] }
  },
  {
    name: 'Khen ngợi người khác',
    description: 'Nói lời khen chân thành',
    category: 'social',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 1,
    unit: 'lời khen',
    icon: '💝',
    color: '#EC4899',
    tags: ['kindness', 'positivity', 'relationships'],
    requiredScore: 0,
    targetPersonas: ['social-connector', 'balanced-lifestyle'],
    triggerConditions: { social_3: [1, 2] }
  },
  {
    name: 'Nhắn tin hỏi thăm',
    description: 'Chủ động quan tâm bạn bè',
    category: 'social',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '💬',
    color: '#3B82F6',
    tags: ['communication', 'friendship', 'care'],
    requiredScore: 0,
    targetPersonas: ['social-connector'],
    triggerConditions: { social_5: [1, 2] }
  },

  // === FITNESS ===
  {
    name: 'Tập gym',
    description: 'Tập luyện tại phòng gym',
    category: 'fitness',
    difficulty: 'medium',
    frequency: 'weekly',
    trackingMode: 'count',
    targetCount: 3,
    unit: 'buổi',
    icon: '💪',
    color: '#F59E0B',
    tags: ['gym', 'strength', 'fitness'],
    requiredScore: 1,
    targetPersonas: ['fitness-enthusiast', 'health-focused'],
    triggerConditions: { fitness_1: [1, 2] }
  },
  {
    name: 'Đi bộ',
    description: 'Duy trì hoạt động đi bộ',
    category: 'fitness',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 10000,
    unit: 'bước',
    icon: '👟',
    color: '#6366F1',
    tags: ['walking', 'cardio', 'fitness'],
    requiredScore: 0,
    targetPersonas: ['fitness-enthusiast', 'health-focused', 'balanced-lifestyle'],
    triggerConditions: { fitness_2: [1, 2] }
  },
  {
    name: 'Chạy bộ buổi sáng',
    description: 'Chạy bộ để rèn luyện sức khỏe',
    category: 'fitness',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🏃‍♂️',
    color: '#EF4444',
    tags: ['running', 'cardio', 'morning'],
    requiredScore: 1,
    targetPersonas: ['fitness-enthusiast'],
    triggerConditions: { fitness_1: [1, 2], health_1: [1, 2] }
  },
  {
    name: 'Tập plank',
    description: 'Tăng cường cơ core',
    category: 'fitness',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🤸',
    color: '#8B5CF6',
    tags: ['core', 'strength', 'home-workout'],
    requiredScore: 0,
    targetPersonas: ['fitness-enthusiast', 'health-focused'],
    triggerConditions: { fitness_1: [1, 2, 3] }
  },

  // === SLEEP ===
  {
    name: 'Ngủ đủ 8 tiếng',
    description: 'Đảm bảo có đủ giấc ngủ',
    category: 'sleep',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🛌',
    color: '#8B5CF6',
    tags: ['sleep', 'rest', 'recovery'],
    requiredScore: 1,
    targetPersonas: ['health-focused', 'balanced-lifestyle'],
    triggerConditions: { health_2: [1, 2], sleep_1: [1, 2] }
  },
  {
    name: 'Tạo thói quen trước khi ngủ',
    description: 'Routine thư giãn trước giờ ngủ',
    category: 'sleep',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🌜',
    color: '#6366F1',
    tags: ['sleep', 'routine', 'relaxation'],
    requiredScore: 0,
    targetPersonas: ['health-focused', 'mindful-seeker'],
    triggerConditions: { health_2: [1, 2], sleep_2: [1, 2] }
  },
  {
    name: 'Tránh caffeine sau 2 giờ chiều',
    description: 'Không uống cà phê buổi chiều',
    category: 'sleep',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '☕',
    color: '#EF4444',
    tags: ['sleep', 'caffeine', 'health'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: { sleep_5: [1, 2] }
  },

  // === ENERGY ===
  {
    name: 'Uống trà xanh',
    description: 'Năng lượng bền vững hơn cà phê',
    category: 'energy',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 2,
    unit: 'ly',
    icon: '🍵',
    color: '#22C55E',
    tags: ['energy', 'health', 'drink'],
    requiredScore: 0,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_1: [1, 2], energy_3: [1, 2] }
  },
  {
    name: 'Nghỉ ngơi giữa giờ làm việc',
    description: 'Nghỉ 5-10 phút sau mỗi giờ',
    category: 'energy',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 4,
    unit: 'lần',
    icon: '⏰',
    color: '#F59E0B',
    tags: ['break', 'rest', 'productivity'],
    requiredScore: 0,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: { productivity_1: [1, 2], energy_2: [1, 2] }
  },
  {
    name: 'Ăn healthy snack',
    description: 'Ăn trái cây hoặc hạt giữa buổi',
    category: 'energy',
    difficulty: 'easy',
    frequency: 'daily',
    trackingMode: 'count',
    targetCount: 2,
    unit: 'lần',
    icon: '🍎',
    color: '#EF4444',
    tags: ['nutrition', 'energy', 'snack'],
    requiredScore: 0,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_4: [1, 2], energy_4: [1, 2] }
  },

  // === CONTROL (Breaking bad habits) ===
  {
    name: 'Giảm uống nước ngọt',
    description: 'Thay bằng nước lọc hoặc trà',
    category: 'control',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🚫',
    color: '#EF4444',
    tags: ['quit', 'health', 'sugar'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_4: [1, 2], energy_6: [1, 2] }
  },
  {
    name: 'Giảm ăn đồ ăn nhanh',
    description: 'Hạn chế fast food',
    category: 'control',
    difficulty: 'medium',
    frequency: 'weekly',
    trackingMode: 'check',
    icon: '🍔',
    color: '#F59E0B',
    tags: ['quit', 'health', 'diet'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_4: [1, 2] }
  },
  {
    name: 'Giảm xem TV/Netflix',
    description: 'Hạn chế xem TV',
    category: 'control',
    difficulty: 'hard',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '📺',
    color: '#6B7280',
    tags: ['quit', 'digital-detox', 'time-management'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven', 'balanced-lifestyle'],
    triggerConditions: { productivity_1: [1, 2] }
  },
  {
    name: 'Bỏ thói quen trì hoãn',
    description: 'Áp dụng quy tắc 2 phút: làm ngay việc dưới 2 phút',
    category: 'control',
    difficulty: 'hard',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '⏱️',
    color: '#EF4444',
    tags: ['quit', 'productivity', 'procrastination'],
    requiredScore: 2,
    targetPersonas: ['productivity-driven'],
    triggerConditions: { productivity_1: [1, 2], productivity_4: [1, 2], control_5: [1, 2] }
  },
  {
    name: 'Giảm dùng điện thoại trong WC',
    description: 'Không mang điện thoại vào nhà vệ sinh',
    category: 'control',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🚽',
    color: '#8B5CF6',
    tags: ['quit', 'digital-detox', 'mindfulness'],
    requiredScore: 1,
    targetPersonas: ['balanced-lifestyle', 'mindful-seeker'],
    triggerConditions: { digital_1: [1, 2], digital_2: [1, 2] }
  },
  {
    name: 'Không ăn vặt sau 8 giờ tối',
    description: 'Ngừng ăn uống trước khi ngủ',
    category: 'control',
    difficulty: 'medium',
    frequency: 'daily',
    trackingMode: 'check',
    icon: '🌙',
    color: '#6366F1',
    tags: ['quit', 'health', 'diet'],
    requiredScore: 1,
    targetPersonas: ['health-focused'],
    triggerConditions: { health_4: [1, 2], sleep_1: [1, 2] }
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
