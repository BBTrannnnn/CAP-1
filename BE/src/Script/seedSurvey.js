
// Survey Questions
// Survey Questions
const surveyQuestions = [
  {
    "id": "health_1",
    "text": "Bạn thường xuyên tập thể dục không?",
    "type": "single",
    "category": "health",
    "options": [
      {
        "id": "h1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "h1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "h1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "h1_4",
        "text": "Mỗi ngày",
        "value": 4
      }
    ]
  },
  {
    "id": "health_2",
    "text": "Bạn thường xuyên ăn rau và trái cây không?",
    "type": "single",
    "category": "health",
    "options": [
      {
        "id": "h2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "h2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "h2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "h2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "health_3",
    "text": "Bạn thường xuyên uống đủ nước không?",
    "type": "single",
    "category": "health",
    "options": [
      {
        "id": "h3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "h3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "h3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "h3_4",
        "text": "Mỗi ngày",
        "value": 4
      }
    ]
  },
  {
    "id": "health_4",
    "text": "Bạn thường xuyên đi khám sức khỏe không?",
    "type": "single",
    "category": "health",
    "options": [
      {
        "id": "h4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "h4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "h4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "h4_4",
        "text": "Định kỳ",
        "value": 4
      }
    ]
  },
  {
    "id": "health_5",
    "text": "Bạn thường xuyên ngủ đủ giấc không?",
    "type": "single",
    "category": "health",
    "options": [
      {
        "id": "h5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "h5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "h5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "h5_4",
        "text": "Mỗi ngày",
        "value": 4
      }
    ]
  },
  {
    "id": "health_6",
    "text": "Bạn thường xuyên quản lý stress không?",
    "type": "single",
    "category": "health",
    "options": [
      {
        "id": "h6_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "h6_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "h6_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "h6_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "productivity_1",
    "text": "Bạn thường dành bao nhiêu thời gian mỗi ngày để lên kế hoạch và tổ chức công việc?",
    "type": "single",
    "category": "productivity",
    "options": [
      {
        "id": "p1_1",
        "text": "Ít hơn 15 phút",
        "value": 1
      },
      {
        "id": "p1_2",
        "text": "15-30 phút",
        "value": 2
      },
      {
        "id": "p1_3",
        "text": "30-60 phút",
        "value": 3
      },
      {
        "id": "p1_4",
        "text": "Trên 60 phút",
        "value": 4
      }
    ]
  },
  {
    "id": "productivity_2",
    "text": "Bạn thường bắt đầu công việc vào lúc nào trong ngày?",
    "type": "single",
    "category": "productivity",
    "options": [
      {
        "id": "p2_1",
        "text": "Sau 10h sáng",
        "value": 1
      },
      {
        "id": "p2_2",
        "text": "8-10h sáng",
        "value": 2
      },
      {
        "id": "p2_3",
        "text": "7-8h sáng",
        "value": 3
      },
      {
        "id": "p2_4",
        "text": "Trước 7h sáng",
        "value": 4
      }
    ]
  },
  {
    "id": "productivity_3",
    "text": "Bạn thường dành bao nhiêu thời gian mỗi ngày để học hỏi và phát triển kỹ năng mới?",
    "type": "single",
    "category": "productivity",
    "options": [
      {
        "id": "p3_1",
        "text": "Ít hơn 15 phút",
        "value": 1
      },
      {
        "id": "p3_2",
        "text": "15-30 phút",
        "value": 2
      },
      {
        "id": "p3_3",
        "text": "30-60 phút",
        "value": 3
      },
      {
        "id": "p3_4",
        "text": "Trên 60 phút",
        "value": 4
      }
    ]
  },
  {
    "id": "productivity_4",
    "text": "Bạn thường xử lý bao nhiêu công việc cùng lúc?",
    "type": "single",
    "category": "productivity",
    "options": [
      {
        "id": "p4_1",
        "text": "Trên 5 công việc",
        "value": 1
      },
      {
        "id": "p4_2",
        "text": "3-5 công việc",
        "value": 2
      },
      {
        "id": "p4_3",
        "text": "2 công việc",
        "value": 3
      },
      {
        "id": "p4_4",
        "text": "1 công việc",
        "value": 4
      }
    ]
  },
  {
    "id": "productivity_5",
    "text": "Bạn thường dành bao nhiêu thời gian mỗi tuần để xem xét và điều chỉnh kế hoạch?",
    "type": "single",
    "category": "productivity",
    "options": [
      {
        "id": "p5_1",
        "text": "Ít hơn 30 phút",
        "value": 1
      },
      {
        "id": "p5_2",
        "text": "30 phút đến 1 giờ",
        "value": 2
      },
      {
        "id": "p5_3",
        "text": "1-2 giờ",
        "value": 3
      },
      {
        "id": "p5_4",
        "text": "Trên 2 giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "productivity_6",
    "text": "Bạn thường cảm thấy mức độ tập trung khi làm việc như thế nào?",
    "type": "single",
    "category": "productivity",
    "options": [
      {
        "id": "p6_1",
        "text": "Rất dễ bị phân tâm",
        "value": 1
      },
      {
        "id": "p6_2",
        "text": "Dễ bị phân tâm",
        "value": 2
      },
      {
        "id": "p6_3",
        "text": "Khá tập trung",
        "value": 3
      },
      {
        "id": "p6_4",
        "text": "Rất tập trung",
        "value": 4
      }
    ]
  },
  {
    "id": "learning_1",
    "text": "Bạn thường dành bao nhiêu thời gian mỗi ngày để đọc sách hoặc tài liệu không liên quan đến công việc?",
    "type": "single",
    "category": "learning",
    "options": [
      {
        "id": "l1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "l1_2",
        "text": "Dưới 30 phút",
        "value": 2
      },
      {
        "id": "l1_3",
        "text": "Từ 30 phút đến 1 giờ",
        "value": 3
      },
      {
        "id": "l1_4",
        "text": "Trên 1 giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "learning_2",
    "text": "Bạn tham gia các khóa học trực tuyến hoặc offline để cải thiện kỹ năng của mình bao nhiêu lần trong năm?",
    "type": "single",
    "category": "learning",
    "options": [
      {
        "id": "l2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "l2_2",
        "text": "1-2 lần",
        "value": 2
      },
      {
        "id": "l2_3",
        "text": "3-5 lần",
        "value": 3
      },
      {
        "id": "l2_4",
        "text": "Trên 5 lần",
        "value": 4
      }
    ]
  },
  {
    "id": "learning_3",
    "text": "Bạn thường thảo luận về chủ đề phát triển cá nhân hoặc học hỏi với bạn bè hoặc đồng nghiệp bao nhiêu lần trong tuần?",
    "type": "single",
    "category": "learning",
    "options": [
      {
        "id": "l3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "l3_2",
        "text": "1-2 lần",
        "value": 2
      },
      {
        "id": "l3_3",
        "text": "3-4 lần",
        "value": 3
      },
      {
        "id": "l3_4",
        "text": "Trên 4 lần",
        "value": 4
      }
    ]
  },
  {
    "id": "learning_4",
    "text": "Bạn thường dành bao nhiêu thời gian để xem video hoặc podcast giáo dục ngoài công việc?",
    "type": "single",
    "category": "learning",
    "options": [
      {
        "id": "l4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "l4_2",
        "text": "Dưới 30 phút",
        "value": 2
      },
      {
        "id": "l4_3",
        "text": "Từ 30 phút đến 1 giờ",
        "value": 3
      },
      {
        "id": "l4_4",
        "text": "Trên 1 giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "learning_5",
    "text": "Bạn thường ghi chú và xem lại những nội dung quan trọng từ các nguồn học tập bao nhiêu lần trong tuần?",
    "type": "single",
    "category": "learning",
    "options": [
      {
        "id": "l5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "l5_2",
        "text": "1-2 lần",
        "value": 2
      },
      {
        "id": "l5_3",
        "text": "3-4 lần",
        "value": 3
      },
      {
        "id": "l5_4",
        "text": "Trên 4 lần",
        "value": 4
      }
    ]
  },
  {
    "id": "mindful_1",
    "text": "Bạn thường dành thời gian mỗi ngày để thiền hoặc thực hành thở sâu không?",
    "type": "single",
    "category": "mindful",
    "options": [
      {
        "id": "m1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "m1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "m1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "m1_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "mindful_2",
    "text": "Khi đối mặt với tình huống khó khăn, bạn thường cố gắng giữ bình tĩnh và tập trung vào giải pháp không?",
    "type": "single",
    "category": "mindful",
    "options": [
      {
        "id": "m2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "m2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "m2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "m2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "mindful_3",
    "text": "Bạn thường dành thời gian để quan sát và đánh giá cảm xúc của mình không?",
    "type": "single",
    "category": "mindful",
    "options": [
      {
        "id": "m3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "m3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "m3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "m3_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "mindful_4",
    "text": "Khi làm việc hoặc học tập, bạn thường tập trung vào nhiệm vụ hiện tại và tránh phân tâm không?",
    "type": "single",
    "category": "mindful",
    "options": [
      {
        "id": "m4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "m4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "m4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "m4_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "mindful_5",
    "text": "Bạn thường thực hành lòng biết ơn và trân trọng những gì mình có không?",
    "type": "single",
    "category": "mindful",
    "options": [
      {
        "id": "m5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "m5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "m5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "m5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "mindful_6",
    "text": "Khi giao tiếp với người khác, bạn thường cố gắng lắng nghe và hiểu quan điểm của họ không?",
    "type": "single",
    "category": "mindful",
    "options": [
      {
        "id": "m6_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "m6_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "m6_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "m6_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "finance_1",
    "text": "Bạn thường xuyên kiểm tra tài khoản ngân hàng của mình?",
    "type": "single",
    "category": "finance",
    "options": [
      {
        "id": "f1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "f1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "f1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "f1_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "finance_2",
    "text": "Bạn có lập ngân sách hàng tháng cho chi tiêu của mình?",
    "type": "single",
    "category": "finance",
    "options": [
      {
        "id": "f2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "f2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "f2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "f2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "finance_3",
    "text": "Bạn có tiết kiệm một phần thu nhập hàng tháng?",
    "type": "single",
    "category": "finance",
    "options": [
      {
        "id": "f3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "f3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "f3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "f3_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "finance_4",
    "text": "Bạn thường xuyên đầu tư vào các tài sản như chứng khoán, bất động sản?",
    "type": "single",
    "category": "finance",
    "options": [
      {
        "id": "f4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "f4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "f4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "f4_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "finance_5",
    "text": "Bạn có tránh mua những thứ không cần thiết để tiết kiệm tiền?",
    "type": "single",
    "category": "finance",
    "options": [
      {
        "id": "f5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "f5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "f5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "f5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "digital_1",
    "text": "Bạn thường xuyên sử dụng điện thoại di động để truy cập internet?",
    "type": "single",
    "category": "digital",
    "options": [
      {
        "id": "d1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "d1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "d1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "d1_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "digital_2",
    "text": "Bạn thường cập nhật các thông tin mới về công nghệ?",
    "type": "single",
    "category": "digital",
    "options": [
      {
        "id": "d2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "d2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "d2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "d2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "digital_3",
    "text": "Bạn thường sử dụng các ứng dụng trực tuyến để quản lý công việc?",
    "type": "single",
    "category": "digital",
    "options": [
      {
        "id": "d3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "d3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "d3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "d3_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "digital_4",
    "text": "Bạn thường chia sẻ thông tin trên mạng xã hội?",
    "type": "single",
    "category": "digital",
    "options": [
      {
        "id": "d4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "d4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "d4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "d4_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "digital_5",
    "text": "Bạn thường sử dụng các dịch vụ trực tuyến để thanh toán hóa đơn?",
    "type": "single",
    "category": "digital",
    "options": [
      {
        "id": "d5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "d5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "d5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "d5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "digital_6",
    "text": "Bạn thường sử dụng các công cụ trực tuyến để học tập và phát triển kỹ năng?",
    "type": "single",
    "category": "digital",
    "options": [
      {
        "id": "d6_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "d6_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "d6_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "d6_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "social_1",
    "text": "Tôi thường xuyên tham gia vào các hoạt động xã hội như tình nguyện, hội thảo, hoặc các sự kiện cộng đồng?",
    "type": "single",
    "category": "social",
    "options": [
      {
        "id": "s1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "s1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "s1_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "social_2",
    "text": "Tôi sẵn sàng giúp đỡ bạn bè, gia đình khi họ cần?",
    "type": "single",
    "category": "social",
    "options": [
      {
        "id": "s2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "s2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "s2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "social_3",
    "text": "Tôi thường xuyên giữ liên lạc với bạn bè, người thân qua điện thoại, thư từ, hoặc các phương tiện trực tuyến?",
    "type": "single",
    "category": "social",
    "options": [
      {
        "id": "s3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "s3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "s3_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "social_4",
    "text": "Tôi sẵn sàng tham gia vào các cuộc thảo luận, tranh luận về các vấn đề xã hội?",
    "type": "single",
    "category": "social",
    "options": [
      {
        "id": "s4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "s4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "s4_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "social_5",
    "text": "Tôi thường xuyên thể hiện sự quan tâm, chăm sóc đến những người xung quanh?",
    "type": "single",
    "category": "social",
    "options": [
      {
        "id": "s5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "s5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "s5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "fitness_1",
    "text": "Bạn thường tập thể dục bao nhiêu lần trong tuần?",
    "type": "single",
    "category": "fitness",
    "options": [
      {
        "id": "f1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "f1_2",
        "text": "1-2 lần",
        "value": 2
      },
      {
        "id": "f1_3",
        "text": "3-4 lần",
        "value": 3
      },
      {
        "id": "f1_4",
        "text": "Trên 4 lần",
        "value": 4
      }
    ]
  },
  {
    "id": "fitness_2",
    "text": "Bạn thường dành bao nhiêu thời gian cho việc tập thể dục mỗi lần?",
    "type": "single",
    "category": "fitness",
    "options": [
      {
        "id": "f2_1",
        "text": "Dưới 30 phút",
        "value": 1
      },
      {
        "id": "f2_2",
        "text": "30-60 phút",
        "value": 2
      },
      {
        "id": "f2_3",
        "text": "1-2 giờ",
        "value": 3
      },
      {
        "id": "f2_4",
        "text": "Trên 2 giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "fitness_3",
    "text": "Bạn thường ăn bao nhiêu bữa mỗi ngày?",
    "type": "single",
    "category": "fitness",
    "options": [
      {
        "id": "f3_1",
        "text": "Dưới 3 bữa",
        "value": 1
      },
      {
        "id": "f3_2",
        "text": "3 bữa",
        "value": 2
      },
      {
        "id": "f3_3",
        "text": "4 bữa",
        "value": 3
      },
      {
        "id": "f3_4",
        "text": "Trên 4 bữa",
        "value": 4
      }
    ]
  },
  {
    "id": "fitness_4",
    "text": "Bạn thường uống bao nhiêu lít nước mỗi ngày?",
    "type": "single",
    "category": "fitness",
    "options": [
      {
        "id": "f4_1",
        "text": "Dưới 1 lít",
        "value": 1
      },
      {
        "id": "f4_2",
        "text": "1-2 lít",
        "value": 2
      },
      {
        "id": "f4_3",
        "text": "2-3 lít",
        "value": 3
      },
      {
        "id": "f4_4",
        "text": "Trên 3 lít",
        "value": 4
      }
    ]
  },
  {
    "id": "fitness_5",
    "text": "Bạn thường đi ngủ vào lúc mấy giờ?",
    "type": "single",
    "category": "fitness",
    "options": [
      {
        "id": "f5_1",
        "text": "Sau 12h đêm",
        "value": 1
      },
      {
        "id": "f5_2",
        "text": "11-12h đêm",
        "value": 2
      },
      {
        "id": "f5_3",
        "text": "10-11h đêm",
        "value": 3
      },
      {
        "id": "f5_4",
        "text": "Trước 10h đêm",
        "value": 4
      }
    ]
  },
  {
    "id": "fitness_6",
    "text": "Bạn thường dành bao nhiêu thời gian cho việc nghỉ ngơi mỗi ngày?",
    "type": "single",
    "category": "fitness",
    "options": [
      {
        "id": "f6_1",
        "text": "Dưới 30 phút",
        "value": 1
      },
      {
        "id": "f6_2",
        "text": "30-60 phút",
        "value": 2
      },
      {
        "id": "f6_3",
        "text": "1-2 giờ",
        "value": 3
      },
      {
        "id": "f6_4",
        "text": "Trên 2 giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "sleep_1",
    "text": "Bạn thường đi ngủ vào lúc mấy giờ?",
    "type": "single",
    "category": "sleep",
    "options": [
      {
        "id": "s1_1",
        "text": "Sau 12 giờ đêm",
        "value": 1
      },
      {
        "id": "s1_2",
        "text": "Từ 10 giờ đến 12 giờ đêm",
        "value": 2
      },
      {
        "id": "s1_3",
        "text": "Từ 9 giờ đến 10 giờ tối",
        "value": 3
      },
      {
        "id": "s1_4",
        "text": "Trước 9 giờ tối",
        "value": 4
      }
    ]
  },
  {
    "id": "sleep_2",
    "text": "Bạn thường ngủ bao nhiêu giờ mỗi đêm?",
    "type": "single",
    "category": "sleep",
    "options": [
      {
        "id": "s2_1",
        "text": "Ít hơn 5 giờ",
        "value": 1
      },
      {
        "id": "s2_2",
        "text": "Từ 5 đến 6 giờ",
        "value": 2
      },
      {
        "id": "s2_3",
        "text": "Từ 7 đến 8 giờ",
        "value": 3
      },
      {
        "id": "s2_4",
        "text": "Trên 8 giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "sleep_3",
    "text": "Bạn thường thức dậy vào lúc mấy giờ?",
    "type": "single",
    "category": "sleep",
    "options": [
      {
        "id": "s3_1",
        "text": "Sau 9 giờ sáng",
        "value": 1
      },
      {
        "id": "s3_2",
        "text": "Từ 8 giờ đến 9 giờ sáng",
        "value": 2
      },
      {
        "id": "s3_3",
        "text": "Từ 7 giờ đến 8 giờ sáng",
        "value": 3
      },
      {
        "id": "s3_4",
        "text": "Trước 7 giờ sáng",
        "value": 4
      }
    ]
  },
  {
    "id": "sleep_4",
    "text": "Bạn có thường xuyên bị mất ngủ không?",
    "type": "single",
    "category": "sleep",
    "options": [
      {
        "id": "s4_1",
        "text": "Luôn luôn",
        "value": 1
      },
      {
        "id": "s4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s4_3",
        "text": "Hiếm khi",
        "value": 3
      },
      {
        "id": "s4_4",
        "text": "Không bao giờ",
        "value": 4
      }
    ]
  },
  {
    "id": "sleep_5",
    "text": "Bạn có thường tạo không gian ngủ thoải mái không?",
    "type": "single",
    "category": "sleep",
    "options": [
      {
        "id": "s5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "s5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "s5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "s5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "energy_1",
    "text": "Tôi thường xuyên tập thể dục vào buổi sáng?",
    "type": "single",
    "category": "energy",
    "options": [
      {
        "id": "e1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "e1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "e1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "e1_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "energy_2",
    "text": "Tôi thường xuyên uống đủ nước trong ngày?",
    "type": "single",
    "category": "energy",
    "options": [
      {
        "id": "e2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "e2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "e2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "e2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "energy_3",
    "text": "Tôi thường xuyên đi ngủ sớm trước 11 giờ tối?",
    "type": "single",
    "category": "energy",
    "options": [
      {
        "id": "e3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "e3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "e3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "e3_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "energy_4",
    "text": "Tôi thường xuyên ăn sáng đầy đủ?",
    "type": "single",
    "category": "energy",
    "options": [
      {
        "id": "e4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "e4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "e4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "e4_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "energy_5",
    "text": "Tôi thường xuyên thực hiện các hoạt động thư giãn như thiền hoặc yoga?",
    "type": "single",
    "category": "energy",
    "options": [
      {
        "id": "e5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "e5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "e5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "e5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "energy_6",
    "text": "Tôi thường xuyên dành thời gian cho các hoạt động ngoài trời?",
    "type": "single",
    "category": "energy",
    "options": [
      {
        "id": "e6_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "e6_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "e6_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "e6_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "control_1",
    "text": "Bạn thường kiểm soát cảm xúc của mình khi gặp tình huống khó chịu?",
    "type": "single",
    "category": "control",
    "options": [
      {
        "id": "c1_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "c1_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "c1_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "c1_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "control_2",
    "text": "Bạn có thường xuyên lên kế hoạch và tổ chức công việc của mình?",
    "type": "single",
    "category": "control",
    "options": [
      {
        "id": "c2_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "c2_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "c2_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "c2_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "control_3",
    "text": "Bạn thường kiểm soát việc chi tiêu của mình?",
    "type": "single",
    "category": "control",
    "options": [
      {
        "id": "c3_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "c3_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "c3_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "c3_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "control_4",
    "text": "Bạn có thường xuyên đặt mục tiêu và theo đuổi chúng?",
    "type": "single",
    "category": "control",
    "options": [
      {
        "id": "c4_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "c4_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "c4_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "c4_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  },
  {
    "id": "control_5",
    "text": "Bạn thường kiểm soát thời gian của mình để đạt được hiệu quả cao?",
    "type": "single",
    "category": "control",
    "options": [
      {
        "id": "c5_1",
        "text": "Không bao giờ",
        "value": 1
      },
      {
        "id": "c5_2",
        "text": "Thỉnh thoảng",
        "value": 2
      },
      {
        "id": "c5_3",
        "text": "Thường xuyên",
        "value": 3
      },
      {
        "id": "c5_4",
        "text": "Luôn luôn",
        "value": 4
      }
    ]
  }
];

// Habit Templates
const habitTemplates = [
  {
    "name": "Tập thể dục 30 phút mỗi ngày",
    "description": "Duy trì sức khỏe và trạng thái thể chất tốt",
    "category": "health",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#34C759",
    "tags": [
      "tập thể dục",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể trạng",
      "Tập thể dục vào buổi sáng hoặc chiều",
      "Tìm bạn tập để tăng động lực"
    ],
    "commonObstacles": [
      "Quên tập hoặc bỏ dở",
      "Không có thời gian trong ngày"
    ],
    "benefits": [
      "Tăng cường sức khỏe tổng thể",
      "Cải thiện tâm trạng và giảm stress",
      "Tăng cường hệ miễn dịch"
    ],
    "isPopular": true
  },
  {
    "name": "Ăn 5 phần trái cây mỗi ngày",
    "description": "Bổ sung vitamin và khoáng chất cần thiết cho cơ thể",
    "category": "health",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 5,
    "unit": "phần",
    "habitType": "build",
    "icon": "🍉",
    "color": "#FFC107",
    "tags": [
      "chế độ ăn uống",
      "sức khỏe"
    ],
    "tips": [
      "Chọn trái cây theo mùa",
      "Ăn trái cây vào các bữa phụ",
      "Trộn trái cây vào salad hoặc sinh tố"
    ],
    "commonObstacles": [
      "Không thích mùi vị của một số trái cây",
      "Quên mua trái cây khi đi chợ"
    ],
    "benefits": [
      "Cải thiện hệ miễn dịch",
      "Tăng cường năng lượng",
      "Hỗ trợ tiêu hóa tốt hơn"
    ],
    "isPopular": true
  },
  {
    "name": "Ngủ đủ 7-8 giờ mỗi đêm",
    "description": "Duy trì giấc ngủ chất lượng và sức khỏe tổng thể",
    "category": "health",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "😴",
    "color": "#6495ED",
    "tags": [
      "giấc ngủ",
      "sức khỏe"
    ],
    "tips": [
      "Đặt giờ đi ngủ cố định",
      "Tạo môi trường ngủ thoải mái",
      "Tránh sử dụng điện thoại trước khi ngủ"
    ],
    "commonObstacles": [
      "Khó ngủ hoặc mất ngủ",
      "Bị làm phiền bởi tiếng ồn"
    ],
    "benefits": [
      "Cải thiện tâm trạng và giảm stress",
      "Tăng cường hệ miễn dịch",
      "Hỗ trợ hồi phục cơ thể"
    ],
    "isPopular": true
  },
  {
    "name": "Uống 2 ly sữa mỗi ngày",
    "description": "Bổ sung canxi và vitamin cần thiết cho sức khỏe xương",
    "category": "health",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 2,
    "unit": "ly",
    "habitType": "build",
    "icon": "🥛",
    "color": "#F7DC6F",
    "tags": [
      "sữa",
      "sức khỏe xương"
    ],
    "tips": [
      "Chọn loại sữa phù hợp với tuổi và thể trạng",
      "Uống sữa vào bữa sáng hoặc trước khi ngủ",
      "Kết hợp sữa với trái cây hoặc bánh mì"
    ],
    "commonObstacles": [
      "Không thích vị sữa",
      "Quên mua sữa khi đi chợ"
    ],
    "benefits": [
      "Cải thiện sức khỏe xương",
      "Tăng cường hệ miễn dịch",
      "Hỗ trợ phát triển cơ thể"
    ],
    "isPopular": true
  },
  {
    "name": "Đi bộ 30 phút mỗi ngày",
    "description": "Tăng cường sức khỏe tim mạch và giảm stress",
    "category": "health",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🚶",
    "color": "#8BC34A",
    "tags": [
      "đi bộ",
      "sức khỏe tim mạch"
    ],
    "tips": [
      "Chọn địa điểm đi bộ an toàn",
      "Đi bộ vào buổi sáng hoặc chiều",
      "Tìm bạn đi bộ để tăng động lực"
    ],
    "commonObstacles": [
      "Quên đi bộ hoặc bỏ dở",
      "Không có thời gian trong ngày"
    ],
    "benefits": [
      "Tăng cường sức khỏe tim mạch",
      "Cải thiện tâm trạng và giảm stress",
      "Tăng cường hệ miễn dịch"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục 30 phút mỗi ngày",
    "description": "Cải thiện sức khỏe và tinh thần",
    "category": "productivity",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#4ADE7E",
    "tags": [
      "sức khỏe",
      "tập thể dục"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể lực",
      "Tạo lịch trình tập luyện cố định",
      "Tìm người đồng hành tập luyện"
    ],
    "commonObstacles": [
      "Thiếu động lực",
      "Không có thời gian"
    ],
    "benefits": [
      "Tăng cường sức khỏe tổng thể",
      "Giảm cân và cải thiện vóc dáng",
      "Tăng cường năng lượng và sự tập trung"
    ],
    "isPopular": true
  },
  {
    "name": "Đọc 1 chương sách mỗi ngày",
    "description": "Mở rộng kiến thức và cải thiện kỹ năng đọc",
    "category": "productivity",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 1,
    "unit": "chương",
    "habitType": "build",
    "icon": "📖",
    "color": "#F7DC6F",
    "tags": [
      "đọc sách",
      "kiến thức"
    ],
    "tips": [
      "Chọn sách phù hợp với sở thích",
      "Tạo không gian đọc thoải mái",
      "Đặt mục tiêu đọc hàng ngày"
    ],
    "commonObstacles": [
      "Không có thời gian",
      "Khó tập trung khi đọc"
    ],
    "benefits": [
      "Mở rộng kiến thức và hiểu biết",
      "Cải thiện kỹ năng đọc và viết",
      "Tăng cường khả năng tập trung và tư duy"
    ],
    "isPopular": true
  },
  {
    "name": "Viết nhật ký 10 phút mỗi ngày",
    "description": "Tập trung vào suy nghĩ và cảm xúc",
    "category": "productivity",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📝",
    "color": "#8B9467",
    "tags": [
      "nhật ký",
      "tư duy"
    ],
    "tips": [
      "Chọn thời gian và không gian thoải mái",
      "Viết tự do và không lo lắng về lỗi",
      "Tập trung vào cảm xúc và suy nghĩ"
    ],
    "commonObstacles": [
      "Không biết viết gì",
      "Không có thời gian"
    ],
    "benefits": [
      "Tập trung vào suy nghĩ và cảm xúc",
      "Cải thiện kỹ năng viết và tư duy",
      "Giảm stress và tăng cường sự tự nhận thức"
    ],
    "isPopular": true
  },
  {
    "name": "Học 10 từ vựng mới mỗi ngày",
    "description": "Cải thiện kỹ năng ngôn ngữ",
    "category": "productivity",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 10,
    "unit": "từ",
    "habitType": "build",
    "icon": "📚",
    "color": "#34C759",
    "tags": [
      "học ngôn ngữ",
      "từ vựng"
    ],
    "tips": [
      "Chọn tài liệu học phù hợp",
      "Tạo flashcard để ôn tập",
      "Tập nói và nghe để cải thiện kỹ năng"
    ],
    "commonObstacles": [
      "Không có thời gian",
      "Khó nhớ từ vựng"
    ],
    "benefits": [
      "Cải thiện kỹ năng ngôn ngữ",
      "Tăng cường khả năng giao tiếp",
      "Mở rộng kiến thức và hiểu biết"
    ],
    "isPopular": true
  },
  {
    "name": "Tập trung 25 phút mà không kiểm tra điện thoại",
    "description": "Tăng cường khả năng tập trung và giảm phân tâm",
    "category": "productivity",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📴",
    "color": "#FFC080",
    "tags": [
      "tập trung",
      "điện thoại"
    ],
    "tips": [
      "Tắt thông báo và đặt điện thoại ở chế độ im lặng",
      "Chọn không gian làm việc thoải mái",
      "Tập trung vào nhiệm vụ và tránh phân tâm"
    ],
    "commonObstacles": [
      "Khó cưỡng lại sự cám dỗ của điện thoại",
      "Không có động lực"
    ],
    "benefits": [
      "Tăng cường khả năng tập trung",
      "Giảm phân tâm và tăng năng suất",
      "Cải thiện chất lượng công việc và cuộc sống"
    ],
    "isPopular": true
  },
  {
    "name": "Học 20 từ vựng mỗi ngày",
    "description": "Cải thiện kỹ năng ngôn ngữ và mở rộng vốn từ",
    "category": "learning",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 20,
    "unit": "từ",
    "habitType": "build",
    "icon": "📚",
    "color": "#3B82F6",
    "tags": [
      "ngôn ngữ",
      "vốn từ"
    ],
    "tips": [
      "Sử dụng flashcard",
      "Học từ vựng theo chủ đề",
      "Lặp lại từ vựng cũ"
    ],
    "commonObstacles": [
      "Quên từ vựng cũ",
      "Không có thời gian học"
    ],
    "benefits": [
      "Cải thiện kỹ năng đọc hiểu",
      "Tăng khả năng giao tiếp",
      "Mở rộng vốn từ"
    ],
    "isPopular": true
  },
  {
    "name": "Đọc sách 30 phút mỗi ngày",
    "description": "Phát triển kiến thức và tư duy",
    "category": "learning",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📖",
    "color": "#8B5CF6",
    "tags": [
      "đọc sách",
      "kiến thức"
    ],
    "tips": [
      "Chọn sách phù hợp với sở thích",
      "Tạo không gian đọc thoải mái",
      "Đặt mục tiêu đọc mỗi ngày"
    ],
    "commonObstacles": [
      "Không có thời gian đọc",
      "Không biết chọn sách nào"
    ],
    "benefits": [
      "Cải thiện kiến thức",
      "Tăng khả năng tư duy",
      "Giảm stress và căng thẳng"
    ],
    "isPopular": true
  },
  {
    "name": "Luyện viết 500 từ mỗi ngày",
    "description": "Phát triển kỹ năng viết và tư duy",
    "category": "learning",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 500,
    "unit": "từ",
    "habitType": "build",
    "icon": "📝",
    "color": "#F97316",
    "tags": [
      "viết lách",
      "tư duy"
    ],
    "tips": [
      "Chọn chủ đề phù hợp",
      "Tạo dàn ý trước khi viết",
      "Không ngừng viết dù khó"
    ],
    "commonObstacles": [
      "Không biết viết về gì",
      "Khó khăn trong việc tạo dàn ý"
    ],
    "benefits": [
      "Cải thiện kỹ năng viết",
      "Tăng khả năng tư duy",
      "Phát triển sự sáng tạo"
    ],
    "isPopular": true
  },
  {
    "name": "Học một kỹ năng mới mỗi tuần",
    "description": "Phát triển bản thân và tăng khả năng cạnh tranh",
    "category": "learning",
    "difficulty": "medium",
    "frequency": "weekly",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📈",
    "color": "#8B5CF6",
    "tags": [
      "phát triển bản thân",
      "kỹ năng mới"
    ],
    "tips": [
      "Chọn kỹ năng phù hợp với sở thích",
      "Tạo kế hoạch học tập",
      "Thực hành đều đặn"
    ],
    "commonObstacles": [
      "Không biết chọn kỹ năng nào",
      "Khó khăn trong việc thực hành"
    ],
    "benefits": [
      "Tăng khả năng cạnh tranh",
      "Phát triển bản thân",
      "Cải thiện chất lượng cuộc sống"
    ],
    "isPopular": true
  },
  {
    "name": "Tham gia một khóa học trực tuyến mỗi tháng",
    "description": "Phát triển kiến thức và kỹ năng",
    "category": "learning",
    "difficulty": "easy",
    "frequency": "monthly",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📚",
    "color": "#3B82F6",
    "tags": [
      "khóa học trực tuyến",
      "kiến thức"
    ],
    "tips": [
      "Chọn khóa học phù hợp với sở thích",
      "Tạo kế hoạch học tập",
      "Thực hành đều đặn"
    ],
    "commonObstacles": [
      "Không biết chọn khóa học nào",
      "Khó khăn trong việc thực hành"
    ],
    "benefits": [
      "Cải thiện kiến thức",
      "Tăng khả năng tư duy",
      "Phát triển bản thân"
    ],
    "isPopular": true
  },
  {
    "name": "Tập yoga buổi sáng",
    "description": "Bắt đầu ngày mới với cơ thể và tâm trí khỏe mạnh",
    "category": "mindful",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🧘",
    "color": "#F7DC6F",
    "tags": [
      "yoga",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp cho người mới",
      "Tập trung vào hơi thở",
      "Bắt đầu với 10-15 phút mỗi ngày"
    ],
    "commonObstacles": [
      "Không có thời gian buổi sáng",
      "Cảm thấy không linh hoạt"
    ],
    "benefits": [
      "Cải thiện độ dẻo của cơ thể",
      "Tăng cường khả năng tập trung",
      "Giảm stress và lo âu"
    ],
    "isPopular": true
  },
  {
    "name": "Đọc sách 30 phút mỗi ngày",
    "description": "Mở rộng kiến thức và cải thiện khả năng tập trung",
    "category": "mindful",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📚",
    "color": "#3498DB",
    "tags": [
      "đọc sách",
      "kiến thức"
    ],
    "tips": [
      "Chọn sách phù hợp với sở thích",
      "Tạo không gian đọc thoải mái",
      "Bắt đầu với 10-15 phút mỗi ngày"
    ],
    "commonObstacles": [
      "Không có thời gian",
      "Cảm thấy nhàm chán"
    ],
    "benefits": [
      "Mở rộng kiến thức",
      "Cải thiện khả năng tập trung",
      "Giảm stress và lo âu"
    ],
    "isPopular": true
  },
  {
    "name": "Viết nhật ký mỗi ngày",
    "description": "Ghi lại suy nghĩ và cảm xúc để cải thiện tâm trí",
    "category": "mindful",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📝",
    "color": "#9B59B6",
    "tags": [
      "nhật ký",
      "tâm trí"
    ],
    "tips": [
      "Chọn thời gian phù hợp để viết",
      "Viết về suy nghĩ và cảm xúc",
      "Bắt đầu với 5-10 phút mỗi ngày"
    ],
    "commonObstacles": [
      "Không biết viết về gì",
      "Cảm thấy không có thời gian"
    ],
    "benefits": [
      "Cải thiện khả năng tập trung",
      "Giảm stress và lo âu",
      "Tăng cường khả năng tự nhận thức"
    ],
    "isPopular": true
  },
  {
    "name": "Đi bộ 10,000 bước mỗi ngày",
    "description": "Cải thiện sức khỏe và tăng cường khả năng tập trung",
    "category": "mindful",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 10000,
    "unit": "bước",
    "habitType": "build",
    "icon": "🚶",
    "color": "#2ECC71",
    "tags": [
      "đi bộ",
      "sức khỏe"
    ],
    "tips": [
      "Sử dụng máy đếm bước",
      "Tạo kế hoạch đi bộ mỗi ngày",
      "Bắt đầu với 5,000 bước mỗi ngày"
    ],
    "commonObstacles": [
      "Không có thời gian",
      "Cảm thấy mệt mỏi"
    ],
    "benefits": [
      "Cải thiện sức khỏe tim mạch",
      "Tăng cường khả năng tập trung",
      "Giảm stress và lo âu"
    ],
    "isPopular": true
  },
  {
    "name": "Thực hành hít thở sâu 10 phút mỗi ngày",
    "description": "Cải thiện khả năng tập trung và giảm stress",
    "category": "mindful",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🙏",
    "color": "#1ABC9C",
    "tags": [
      "hít thở sâu",
      "tâm trí"
    ],
    "tips": [
      "Tìm không gian yên tĩnh",
      "Sử dụng ứng dụng hít thở sâu",
      "Bắt đầu với 5 phút mỗi ngày"
    ],
    "commonObstacles": [
      "Khó tập trung",
      "Cảm thấy không có thời gian"
    ],
    "benefits": [
      "Cải thiện khả năng tập trung",
      "Giảm stress và lo âu",
      "Tăng cường khả năng tự nhận thức"
    ],
    "isPopular": true
  },
  {
    "name": "Tiết kiệm 10% thu nhập",
    "description": "Xây dựng thói quen tiết kiệm để đạt được mục tiêu tài chính",
    "category": "finance",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 10,
    "unit": "%",
    "habitType": "build",
    "icon": "💸",
    "color": "#34C759",
    "tags": [
      "tiết kiệm",
      "tài chính"
    ],
    "tips": [
      "Tạo một quỹ tiết kiệm riêng",
      "Đặt mục tiêu tiết kiệm cụ thể",
      "Theo dõi thu chi hàng ngày"
    ],
    "commonObstacles": [
      "Khó khăn trong việc cắt giảm chi tiêu",
      "Không có kế hoạch tiết kiệm rõ ràng"
    ],
    "benefits": [
      "Đạt được mục tiêu tài chính dài hạn",
      "Cải thiện tình hình tài chính hiện tại",
      "Giảm stress và lo âu về tài chính"
    ],
    "isPopular": true
  },
  {
    "name": "Đánh giá và điều chỉnh ngân sách hàng tháng",
    "description": "Quản lý chi tiêu hiệu quả và thông minh",
    "category": "finance",
    "difficulty": "hard",
    "frequency": "monthly",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📊",
    "color": "#FFC107",
    "tags": [
      "quản lý chi tiêu",
      "ngân sách"
    ],
    "tips": [
      "Sử dụng công cụ quản lý chi tiêu",
      "Đánh giá và điều chỉnh ngân sách thường xuyên",
      "Tập trung vào việc cắt giảm chi tiêu không cần thiết"
    ],
    "commonObstacles": [
      "Khó khăn trong việc theo dõi chi tiêu",
      "Không có kế hoạch quản lý chi tiêu hiệu quả"
    ],
    "benefits": [
      "Cải thiện tình hình tài chính hiện tại",
      "Đạt được mục tiêu tài chính dài hạn",
      "Giảm stress và lo âu về tài chính"
    ],
    "isPopular": true
  },
  {
    "name": "Đầu tư 5% thu nhập vào chứng khoán",
    "description": "Tăng trưởng tài sản và đạt được mục tiêu tài chính",
    "category": "finance",
    "difficulty": "hard",
    "frequency": "monthly",
    "trackingMode": "count",
    "targetCount": 5,
    "unit": "%",
    "habitType": "build",
    "icon": "💰",
    "color": "#8B0A1A",
    "tags": [
      "đầu tư",
      "chứng khoán"
    ],
    "tips": [
      "Nghiên cứu và hiểu rõ về đầu tư chứng khoán",
      "Bắt đầu với số tiền nhỏ và tăng dần",
      "Đa dạng hóa danh mục đầu tư"
    ],
    "commonObstacles": [
      "Khó khăn trong việc hiểu rõ về đầu tư chứng khoán",
      "Sợ rủi ro mất mát"
    ],
    "benefits": [
      "Tăng trưởng tài sản",
      "Đạt được mục tiêu tài chính dài hạn",
      "Cải thiện tình hình tài chính hiện tại"
    ],
    "isPopular": true
  },
  {
    "name": "Trả nợ 10% mỗi tháng",
    "description": "Loại bỏ nợ nần và cải thiện tình hình tài chính",
    "category": "finance",
    "difficulty": "medium",
    "frequency": "monthly",
    "trackingMode": "count",
    "targetCount": 10,
    "unit": "%",
    "habitType": "build",
    "icon": "📈",
    "color": "#4CAF50",
    "tags": [
      "trả nợ",
      "tài chính"
    ],
    "tips": [
      "Tạo một kế hoạch trả nợ cụ thể",
      "Đánh giá và điều chỉnh ngân sách thường xuyên",
      "Tập trung vào việc cắt giảm chi tiêu không cần thiết"
    ],
    "commonObstacles": [
      "Khó khăn trong việc cắt giảm chi tiêu",
      "Không có kế hoạch trả nợ rõ ràng"
    ],
    "benefits": [
      "Loại bỏ nợ nần",
      "Cải thiện tình hình tài chính hiện tại",
      "Giảm stress và lo âu về tài chính"
    ],
    "isPopular": true
  },
  {
    "name": "Tạo một quỹ dự phòng khẩn cấp",
    "description": "Chuẩn bị cho các tình huống khẩn cấp và bất ngờ",
    "category": "finance",
    "difficulty": "easy",
    "frequency": "monthly",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🛡️",
    "color": "#03A9F4",
    "tags": [
      "quỹ dự phòng",
      "tài chính"
    ],
    "tips": [
      "Bắt đầu với số tiền nhỏ và tăng dần",
      "Đặt mục tiêu cụ thể cho quỹ dự phòng",
      "Theo dõi và điều chỉnh quỹ dự phòng thường xuyên"
    ],
    "commonObstacles": [
      "Khó khăn trong việc bắt đầu",
      "Không có kế hoạch cụ thể"
    ],
    "benefits": [
      "Chuẩn bị cho các tình huống khẩn cấp",
      "Cải thiện tình hình tài chính hiện tại",
      "Giảm stress và lo âu về tài chính"
    ],
    "isPopular": true
  },
  {
    "name": "Đọc sách 30 phút mỗi ngày",
    "description": "Phát triển trí tuệ và tưởng tượng",
    "category": "digital",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📖",
    "color": "#34C759",
    "tags": [
      "đọc sách",
      "phát triển trí tuệ"
    ],
    "tips": [
      "Chọn sách phù hợp với sở thích",
      "Đặt mục tiêu đọc mỗi ngày",
      "Tạo không gian đọc thoải mái"
    ],
    "commonObstacles": [
      "Không có thời gian",
      "Khó tập trung khi đọc"
    ],
    "benefits": [
      "Tăng kiến thức và hiểu biết",
      "Phát triển khả năng tư duy",
      "Cải thiện kỹ năng ngôn ngữ"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục 30 phút mỗi ngày",
    "description": "Duy trì sức khỏe và thể lực",
    "category": "digital",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️‍♀️",
    "color": "#FF69B4",
    "tags": [
      "tập thể dục",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể lực",
      "Tạo lịch trình tập luyện",
      "Tìm người tập cùng để động viên"
    ],
    "commonObstacles": [
      "Không có thời gian",
      "Khó khăn khi bắt đầu"
    ],
    "benefits": [
      "Tăng cường sức khỏe tổng thể",
      "Cải thiện tâm trạng",
      "Giảm nguy cơ bệnh tật"
    ],
    "isPopular": true
  },
  {
    "name": "Viết nhật ký 10 phút mỗi ngày",
    "description": "Phát triển khả năng tự phản ánh và ghi nhớ",
    "category": "digital",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📝",
    "color": "#8B9467",
    "tags": [
      "viết nhật ký",
      "phát triển khả năng tự phản ánh"
    ],
    "tips": [
      "Chọn thời gian phù hợp",
      "Viết về những trải nghiệm và cảm xúc",
      "Không cần viết quá nhiều"
    ],
    "commonObstacles": [
      "Không biết viết gì",
      "Khó duy trì thói quen"
    ],
    "benefits": [
      "Cải thiện khả năng tự phản ánh",
      "Tăng cường ghi nhớ",
      "Giúp giảm stress và lo âu"
    ],
    "isPopular": true
  },
  {
    "name": "Học 10 từ vựng mới mỗi ngày",
    "description": "Phát triển khả năng ngôn ngữ và giao tiếp",
    "category": "digital",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 10,
    "unit": "từ",
    "habitType": "build",
    "icon": "📚",
    "color": "#4B5154",
    "tags": [
      "học từ vựng",
      "phát triển khả năng ngôn ngữ"
    ],
    "tips": [
      "Sử dụng Flashcard",
      "Học từ vựng trong contexto",
      "Lặp lại từ vựng đã học"
    ],
    "commonObstacles": [
      "Khó nhớ từ vựng",
      "Không có thời gian"
    ],
    "benefits": [
      "Cải thiện khả năng ngôn ngữ",
      "Tăng cường giao tiếp",
      "Phát triển khả năng học hỏi"
    ],
    "isPopular": true
  },
  {
    "name": "Tập trung 25 phút mỗi lần làm việc",
    "description": "Tăng cường năng suất và hiệu quả công việc",
    "category": "digital",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 25,
    "unit": "phút",
    "habitType": "build",
    "icon": "🕒",
    "color": "#2F4F7F",
    "tags": [
      "tập trung",
      "năng suất"
    ],
    "tips": [
      "Sử dụng kỹ thuật Pomodoro",
      "Loại bỏ sự phân tâm",
      "Tập trung vào một nhiệm vụ tại một thời điểm"
    ],
    "commonObstacles": [
      "Khó tập trung",
      "Dễ bị phân tâm"
    ],
    "benefits": [
      "Tăng cường năng suất",
      "Cải thiện hiệu quả công việc",
      "Giảm stress và lo âu"
    ],
    "isPopular": true
  },
  {
    "name": "Gọi điện cho người thân mỗi ngày",
    "description": "Duy trì mối quan hệ gần gũi với gia đình và bạn bè",
    "category": "social",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📞",
    "color": "#34C759",
    "tags": [
      "mối quan hệ",
      "giao tiếp"
    ],
    "tips": [
      "Lập danh sách người thân cần liên hệ",
      "Chọn thời điểm phù hợp để gọi",
      "Chuẩn bị sẵn chủ đề để trò chuyện"
    ],
    "commonObstacles": [
      "Quên gọi điện khi bận rộn",
      "Không biết bắt đầu cuộc trò chuyện"
    ],
    "benefits": [
      "Cải thiện mối quan hệ với gia đình",
      "Tăng cường giao tiếp với bạn bè",
      "Giảm cảm giác cô đơn"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục với bạn bè 3 lần mỗi tuần",
    "description": "Tăng cường sức khỏe và tạo ra những kỷ niệm đẹp",
    "category": "social",
    "difficulty": "medium",
    "frequency": "weekly",
    "trackingMode": "check",
    "targetCount": 3,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#F97316",
    "tags": [
      "tập thể dục",
      "sức khỏe"
    ],
    "tips": [
      "Chọn môn thể thao phù hợp",
      "Tìm kiếm bạn tập cùng",
      "Đặt mục tiêu và theo dõi tiến độ"
    ],
    "commonObstacles": [
      "Khó tìm kiếm bạn tập cùng",
      "Không có thời gian tập thể dục"
    ],
    "benefits": [
      "Cải thiện sức khỏe thể chất",
      "Tăng cường tinh thần",
      "Tạo ra những kỷ niệm đẹp"
    ],
    "isPopular": true
  },
  {
    "name": "Học tiếng Anh mỗi ngày với 15 phút",
    "description": "Cải thiện kỹ năng tiếng Anh để mở rộng cơ hội",
    "category": "social",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📚",
    "color": "#3B82F6",
    "tags": [
      "học tiếng Anh",
      "phát triển bản thân"
    ],
    "tips": [
      "Chọn tài liệu học phù hợp",
      "Tập trung vào kỹ năng nghe và nói",
      "Sử dụng ứng dụng học tiếng Anh"
    ],
    "commonObstacles": [
      "Khó tìm kiếm tài liệu học phù hợp",
      "Không có thời gian học mỗi ngày"
    ],
    "benefits": [
      "Cải thiện kỹ năng tiếng Anh",
      "Tăng cường cơ hội việc làm",
      "Phát triển bản thân"
    ],
    "isPopular": true
  },
  {
    "name": "Đi dạo 30 phút mỗi ngày",
    "description": "Tăng cường sức khỏe và giảm stress",
    "category": "social",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🚶",
    "color": "#8B9467",
    "tags": [
      "đi dạo",
      "sức khỏe"
    ],
    "tips": [
      "Chọn địa điểm đi dạo phù hợp",
      "Tập trung vào hơi thở và môi trường",
      "Sử dụng ứng dụng theo dõi sức khỏe"
    ],
    "commonObstacles": [
      "Khó tìm kiếm địa điểm đi dạo phù hợp",
      "Không có thời gian đi dạo mỗi ngày"
    ],
    "benefits": [
      "Tăng cường sức khỏe thể chất",
      "Giảm stress và lo âu",
      "Cải thiện tâm trạng"
    ],
    "isPopular": true
  },
  {
    "name": "Tập yoga 30 phút mỗi ngày",
    "description": "Tăng cường sức khỏe và giảm stress",
    "category": "social",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🧘",
    "color": "#F7DC6F",
    "tags": [
      "tập yoga",
      "sức khỏe"
    ],
    "tips": [
      "Chọn tư thế yoga phù hợp",
      "Tập trung vào hơi thở và kỹ thuật",
      "Sử dụng ứng dụng hướng dẫn yoga"
    ],
    "commonObstacles": [
      "Khó tìm kiếm tư thế yoga phù hợp",
      "Không có thời gian tập yoga mỗi ngày"
    ],
    "benefits": [
      "Tăng cường sức khỏe thể chất",
      "Giảm stress và lo âu",
      "Cải thiện tâm trạng"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục 30 phút mỗi ngày",
    "description": "Duy trì sức khỏe và sự dẻo dai của cơ thể",
    "category": "fitness",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#34C759",
    "tags": [
      "sức khỏe",
      "tập thể dục"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể lực",
      "Tập thể dục vào buổi sáng",
      "Dùng nhạc để tăng cường động lực"
    ],
    "commonObstacles": [
      "Quên tập thể dục khi bận rộn",
      "Không thích tập thể dục"
    ],
    "benefits": [
      "Cải thiện sức khỏe tim mạch",
      "Tăng cường sức mạnh cơ bắp",
      "Giảm cân và cải thiện vóc dáng"
    ],
    "isPopular": true
  },
  {
    "name": "Đi bộ 10,000 bước mỗi ngày",
    "description": "Tăng cường sức khỏe và sự dẻo dai của cơ thể",
    "category": "fitness",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 10000,
    "unit": "bước",
    "habitType": "build",
    "icon": "🚶",
    "color": "#FFC107",
    "tags": [
      "sức khỏe",
      "đi bộ"
    ],
    "tips": [
      "Dùng máy đếm bước chân",
      "Đi bộ vào buổi trưa",
      "Tìm người bạn đi bộ cùng"
    ],
    "commonObstacles": [
      "Khó đi bộ khi thời tiết xấu",
      "Không có thời gian đi bộ"
    ],
    "benefits": [
      "Cải thiện sức khỏe tim mạch",
      "Tăng cường sức mạnh cơ bắp",
      "Giảm cân và cải thiện vóc dáng"
    ],
    "isPopular": true
  },
  {
    "name": "Tập yoga 30 phút mỗi sáng",
    "description": "Bắt đầu ngày mới với tâm trí tỉnh thức và cơ thể dẻo dai",
    "category": "fitness",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🧘",
    "color": "#8B5CF6",
    "tags": [
      "yoga",
      "sức khỏe"
    ],
    "tips": [
      "Chọn không gian yên tĩnh",
      "Dùng thảm yoga chất lượng",
      "Tập trung vào hơi thở"
    ],
    "commonObstacles": [
      "Khó tập trung ban đầu",
      "Không có thời gian buổi sáng"
    ],
    "benefits": [
      "Cải thiện sức khỏe tâm thần",
      "Tăng cường sự dẻo dai của cơ thể",
      "Giảm stress và lo âu"
    ],
    "isPopular": true
  },
  {
    "name": "Chạy bộ 5 km mỗi ngày",
    "description": "Tăng cường sức khỏe và sự dẻo dai của cơ thể",
    "category": "fitness",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 5,
    "unit": "km",
    "habitType": "build",
    "icon": "🏃",
    "color": "#FF3737",
    "tags": [
      "sức khỏe",
      "chạy bộ"
    ],
    "tips": [
      "Dùng giày chạy bộ chất lượng",
      "Chọn địa điểm chạy bộ an toàn",
      "Tập trung vào kỹ thuật chạy bộ"
    ],
    "commonObstacles": [
      "Khó chạy bộ khi thời tiết xấu",
      "Không có thời gian chạy bộ"
    ],
    "benefits": [
      "Cải thiện sức khỏe tim mạch",
      "Tăng cường sức mạnh cơ bắp",
      "Giảm cân và cải thiện vóc dáng"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể hình 45 phút mỗi ngày",
    "description": "Tăng cường sức mạnh và sự dẻo dai của cơ thể",
    "category": "fitness",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#34C759",
    "tags": [
      "sức khỏe",
      "tập thể hình"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể lực",
      "Tập thể hình vào buổi sáng",
      "Dùng nhạc để tăng cường động lực"
    ],
    "commonObstacles": [
      "Quên tập thể hình khi bận rộn",
      "Không thích tập thể hình"
    ],
    "benefits": [
      "Cải thiện sức khỏe tim mạch",
      "Tăng cường sức mạnh cơ bắp",
      "Giảm cân và cải thiện vóc dáng"
    ],
    "isPopular": true
  },
  {
    "name": "Đạp xe 20 km mỗi ngày",
    "description": "Tăng cường sức khỏe và sự dẻo dai của cơ thể",
    "category": "fitness",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 20,
    "unit": "km",
    "habitType": "build",
    "icon": "🚴",
    "color": "#FFC107",
    "tags": [
      "sức khỏe",
      "đạp xe"
    ],
    "tips": [
      "Dùng xe đạp chất lượng",
      "Chọn địa điểm đạp xe an toàn",
      "Tập trung vào kỹ thuật đạp xe"
    ],
    "commonObstacles": [
      "Khó đạp xe khi thời tiết xấu",
      "Không có thời gian đạp xe"
    ],
    "benefits": [
      "Cải thiện sức khỏe tim mạch",
      "Tăng cường sức mạnh cơ bắp",
      "Giảm cân và cải thiện vóc dáng"
    ],
    "isPopular": true
  },
  {
    "name": "Đi ngủ trước 11h mỗi ngày",
    "description": "Dành thời gian nghỉ ngơi chất lượng cho cơ thể",
    "category": "sleep",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🛋️",
    "color": "#64D2FF",
    "tags": [
      "ngủ đủ giấc",
      "lối sống lành mạnh"
    ],
    "tips": [
      "Tạo lịch trình ngủ cố định",
      "Tắt thiết bị điện tử trước giờ ngủ",
      "Tạo không gian ngủ thoải mái"
    ],
    "commonObstacles": [
      "Thói quen xem điện thoại trước giờ ngủ",
      "Cảm thấy chưa Buồn ngủ"
    ],
    "benefits": [
      "Cải thiện chất lượng giấc ngủ",
      "Tăng cường hệ miễn dịch",
      "Giúp kiểm soát cân nặng hiệu quả"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục buổi sáng 30 phút",
    "description": "Bắt đầu ngày mới với năng lượng và sự tập trung",
    "category": "sleep",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#FF69B4",
    "tags": [
      "tập thể dục",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể lực",
      "Tìm người tập cùng để tăng động lực",
      "Đặt mục tiêu cụ thể cho mỗi buổi tập"
    ],
    "commonObstacles": [
      "Khó bắt đầu do thiếu động lực",
      "Cảm thấy mệt mỏi sau tập"
    ],
    "benefits": [
      "Tăng cường sức khỏe tim mạch",
      "Cải thiện tâm trạng và giảm stress",
      "Giúp kiểm soát cân nặng hiệu quả"
    ],
    "isPopular": true
  },
  {
    "name": "Ngủ đủ 7-8 giờ mỗi đêm",
    "description": "Dành thời gian nghỉ ngơi chất lượng cho cơ thể và tâm trí",
    "category": "sleep",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "😴",
    "color": "#8B9467",
    "tags": [
      "ngủ đủ giấc",
      "sức khỏe"
    ],
    "tips": [
      "Tạo lịch trình ngủ cố định",
      "Tối ưu hóa môi trường ngủ",
      "Tránh caffeine và điện thoại trước giờ ngủ"
    ],
    "commonObstacles": [
      "Khó đi vào giấc ngủ do căng thẳng",
      "Bị làm phiền bởi tiếng ồn"
    ],
    "benefits": [
      "Cải thiện chức năng não bộ",
      "Tăng cường hệ miễn dịch",
      "Giúp kiểm soát cân nặng hiệu quả"
    ],
    "isPopular": true
  },
  {
    "name": "Thực hiện quy trình thư giãn trước giờ ngủ",
    "description": "Chuẩn bị tâm trí và cơ thể cho giấc ngủ chất lượng",
    "category": "sleep",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🧘",
    "color": "#6495ED",
    "tags": [
      "thư giãn",
      "ngủ đủ giấc"
    ],
    "tips": [
      "Tập thở sâu và thiền",
      "Đọc sách hoặc nghe nhạc nhẹ nhàng",
      "Tránh thiết bị điện tử trước giờ ngủ"
    ],
    "commonObstacles": [
      "Khó từ bỏ thói quen xem điện thoại trước ngủ",
      "Cảm thấy không thoải mái khi thực hiện quy trình"
    ],
    "benefits": [
      "Cải thiện chất lượng giấc ngủ",
      "Giảm stress và lo âu",
      "Tăng cường khả năng tập trung"
    ],
    "isPopular": true
  },
  {
    "name": "Sử dụng ánh sáng tự nhiên để điều chỉnh giấc ngủ",
    "description": "Tận dụng ánh sáng ban ngày để cải thiện chất lượng giấc ngủ",
    "category": "sleep",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "☀️",
    "color": "#F7DC6F",
    "tags": [
      "ánh sáng tự nhiên",
      "ngủ đủ giấc"
    ],
    "tips": [
      "Mở cửa sổ vào ban ngày",
      "Đi dạo ngoài trời vào buổi sáng",
      "Tránh ánh sáng mạnh vào buổi tối"
    ],
    "commonObstacles": [
      "Khó thay đổi thói quen hàng ngày",
      "Không có không gian ngoài trời để tận dụng"
    ],
    "benefits": [
      "Cải thiện chất lượng giấc ngủ",
      "Tăng cường năng lượng và tâm trạng",
      "Hỗ trợ điều hòa sinh học"
    ],
    "isPopular": true
  },
  {
    "name": "Dậy sớm lúc 6h",
    "description": "Bắt đầu ngày mới với tâm trạng sảng khoái",
    "category": "energy",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "☀️",
    "color": "#F7DC6F",
    "tags": [
      "dậy sớm",
      "sức khỏe"
    ],
    "tips": [
      "Đặt báo thức đều đặn",
      "Tạo thói quen trước khi ngủ",
      "Dành thời gian cho bản thân"
    ],
    "commonObstacles": [
      "Khó thức dậy buổi sáng",
      "Thói quen ngủ muộn"
    ],
    "benefits": [
      "Cải thiện tâm trạng",
      "Tăng năng suất làm việc",
      "Dành thời gian cho bản thân"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục 30 phút mỗi ngày",
    "description": "Duy trì sức khỏe và năng lượng",
    "category": "energy",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️‍♀️",
    "color": "#34C759",
    "tags": [
      "tập thể dục",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp",
      "Tạo lịch trình tập luyện",
      "Tìm bạn tập cùng"
    ],
    "commonObstacles": [
      "Thiếu thời gian",
      "Không có động lực"
    ],
    "benefits": [
      "Cải thiện sức khỏe tổng thể",
      "Tăng cường năng lượng",
      "Giảm stress"
    ],
    "isPopular": true
  },
  {
    "name": "Ăn trái cây 2 lần mỗi ngày",
    "description": "Bổ sung vitamin và khoáng chất cho cơ thể",
    "category": "energy",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 2,
    "unit": "lần",
    "habitType": "build",
    "icon": "🍉",
    "color": "#FF69B4",
    "tags": [
      "trái cây",
      "sức khỏe"
    ],
    "tips": [
      "Chọn trái cây theo mùa",
      "Bổ sung vào bữa ăn",
      "Tạo thói quen ăn trái cây"
    ],
    "commonObstacles": [
      "Không thích vị chua",
      "Thiếu thời gian chuẩn bị"
    ],
    "benefits": [
      "Cải thiện hệ miễn dịch",
      "Tăng cường năng lượng",
      "Hỗ trợ tiêu hóa"
    ],
    "isPopular": true
  },
  {
    "name": "Ngủ đủ 7 tiếng mỗi đêm",
    "description": "Duy trì giấc ngủ chất lượng cho sức khỏe",
    "category": "energy",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "😴",
    "color": "#3498DB",
    "tags": [
      "ngủ đủ giấc",
      "sức khỏe"
    ],
    "tips": [
      "Tạo lịch trình ngủ đều đặn",
      "Tối ưu hóa môi trường ngủ",
      "Tránh caffeine trước khi ngủ"
    ],
    "commonObstacles": [
      "Khó ngủ",
      "Thói quen thức khuya"
    ],
    "benefits": [
      "Cải thiện tâm trạng",
      "Tăng cường năng lượng",
      "Hỗ trợ hệ miễn dịch"
    ],
    "isPopular": true
  },
  {
    "name": "Tập yoga 3 lần mỗi tuần",
    "description": "Duy trì sự linh hoạt và cân bằng cho cơ thể",
    "category": "energy",
    "difficulty": "hard",
    "frequency": "weekly",
    "trackingMode": "count",
    "targetCount": 3,
    "unit": "lần",
    "habitType": "build",
    "icon": "🧘‍♀️",
    "color": "#8B9467",
    "tags": [
      "tập yoga",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp",
      "Tạo lịch trình tập luyện",
      "Tìm bạn tập cùng"
    ],
    "commonObstacles": [
      "Thiếu thời gian",
      "Không có động lực"
    ],
    "benefits": [
      "Cải thiện sự linh hoạt",
      "Tăng cường cân bằng",
      "Giảm stress"
    ],
    "isPopular": true
  },
  {
    "name": "Dậy sớm lúc 6h",
    "description": "Bắt đầu ngày mới với năng lượng và tinh thần sảng khoái",
    "category": "control",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "☀️",
    "color": "#F7DC6F",
    "tags": [
      "dậy sớm",
      "năng lượng"
    ],
    "tips": [
      "Đặt báo thức và đặt nó xa giường",
      "Tạo thói quen đi ngủ sớm",
      "Uống nước ngay sau khi thức dậy"
    ],
    "commonObstacles": [
      "Khó thức dậy vào buổi sáng",
      "Muốn ngủ thêm"
    ],
    "benefits": [
      "Tăng năng lượng và sự tập trung",
      "Cải thiện tâm trạng và giảm căng thẳng",
      "Đủ thời gian cho các hoạt động buổi sáng"
    ],
    "isPopular": true
  },
  {
    "name": "Ăn 5 bữa nhỏ mỗi ngày",
    "description": "Duy trì năng lượng và kiểm soát cân nặng",
    "category": "control",
    "difficulty": "hard",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 5,
    "unit": "bữa",
    "habitType": "build",
    "icon": "🍴",
    "color": "#8B9467",
    "tags": [
      "dinh dưỡng",
      "cân nặng"
    ],
    "tips": [
      "Lập kế hoạch ăn uống hàng ngày",
      "Chọn thực phẩm giàu dinh dưỡng",
      "Uống nước trước bữa ăn"
    ],
    "commonObstacles": [
      "Khó kiểm soát số lượng bữa ăn",
      "Thích ăn vặt"
    ],
    "benefits": [
      "Tăng cường trao đổi chất",
      "Cải thiện sức khỏe tổng thể",
      "Kiểm soát cân nặng hiệu quả"
    ],
    "isPopular": true
  },
  {
    "name": "Tập thể dục 30 phút mỗi ngày",
    "description": "Cải thiện sức khỏe và tăng cường thể lực",
    "category": "control",
    "difficulty": "medium",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "🏋️",
    "color": "#34C759",
    "tags": [
      "tập thể dục",
      "sức khỏe"
    ],
    "tips": [
      "Chọn bài tập phù hợp với thể lực",
      "Tạo lịch trình tập luyện hàng ngày",
      "Đi bộ hoặc chạy bộ vào buổi sáng"
    ],
    "commonObstacles": [
      "Khó tìm thời gian tập luyện",
      "Không thích tập thể dục"
    ],
    "benefits": [
      "Tăng cường sức khỏe tim mạch",
      "Cải thiện thể lực và sự dẻo dai",
      "Giảm stress và cải thiện tâm trạng"
    ],
    "isPopular": true
  },
  {
    "name": "Uống 2 cốc trà xanh mỗi ngày",
    "description": "Tăng cường sức khỏe và chống oxy hóa",
    "category": "control",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "count",
    "targetCount": 2,
    "unit": "cốc",
    "habitType": "build",
    "icon": "🍵",
    "color": "#3E8E41",
    "tags": [
      "trà xanh",
      "sức khỏe"
    ],
    "tips": [
      "Chọn trà xanh chất lượng cao",
      "Uống trà xanh sau bữa ăn",
      "Tránh uống trà xanh trước khi ngủ"
    ],
    "commonObstacles": [
      "Khó uống đủ 2 cốc mỗi ngày",
      "Không thích vị trà xanh"
    ],
    "benefits": [
      "Tăng cường sức khỏe tim mạch",
      "Chống oxy hóa và lão hóa",
      "Cải thiện chức năng não bộ"
    ],
    "isPopular": true
  },
  {
    "name": "Viết nhật ký 10 phút mỗi ngày",
    "description": "Tăng cường sự phản ánh và cải thiện tâm trạng",
    "category": "control",
    "difficulty": "easy",
    "frequency": "daily",
    "trackingMode": "check",
    "targetCount": 1,
    "unit": "lần",
    "habitType": "build",
    "icon": "📝",
    "color": "#FFC107",
    "tags": [
      "nhật ký",
      "tâm trạng"
    ],
    "tips": [
      "Chọn thời gian viết nhật ký phù hợp",
      "Viết về những suy nghĩ và cảm xúc",
      "Đừng lo lắng về việc viết đúng hay sai"
    ],
    "commonObstacles": [
      "Khó tìm thời gian viết nhật ký",
      "Không biết viết gì"
    ],
    "benefits": [
      "Tăng cường sự phản ánh và tự nhận thức",
      "Cải thiện tâm trạng và giảm căng thẳng",
      "Phát triển kỹ năng viết và tư duy"
    ],
    "isPopular": true
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 10,       // Đã thêm
    unit: 'phút',          // Đã thêm
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 1,       // Đã thêm
    unit: 'lần',          // Đã thêm
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 1,       // Đã thêm
    unit: 'bữa',          // Đã thêm
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 5,       // Đã thêm
    unit: 'mục',          // Đã thêm
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 1,       // Đã thêm
    unit: 'lần',          // Đã thêm
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 1,       // Đã thêm
    unit: 'việc',         // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 10,      // Đã thêm
    unit: 'phút',         // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 10,      // Đã thêm
    unit: 'phút',         // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 15,      // Đã thêm
    unit: 'phút',         // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 1,       // Đã thêm
    unit: 'lần',          // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 10,      // Đã thêm
    unit: 'email',        // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 3,       // Đã thêm
    unit: 'người',        // Đã thêm
    frequency: 'daily',
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
    trackingMode: 'count', // Đã thay đổi
    targetCount: 0,       // Đã thêm (mục tiêu là không uống)
    unit: 'chai/lon',     // Đã thêm
    frequency: 'daily',
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
