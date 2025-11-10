import fs from 'fs';


// CẤU HÌNH

const DREAMS_PER_CATEGORY = 80; // 80 × 7 = 560 dreams total (34% tự tạo, 66% DreamBank ~ 1,100 dreams)

// TEMPLATES CHO 7 CATEGORIES

// 1. STRESS - Căng thẳng, áp lực
const stressTemplates = [
  "Tôi mơ thấy mình bị đuổi trong bóng tối",
  "Mơ thấy mình rơi từ tầng cao xuống",
  "Bị mắc kẹt trong thang máy không thoát ra được",
  "Mơ thấy mình chạy trốn nhưng chân như bị trói",
  "Bị kẹt trong đám cháy không tìm được lối thoát",
  "Mơ thấy mình bị tấn công nhưng không thể phản kháng",
  "Không thể hét lên được khi gặp nguy hiểm",
  "Mơ thấy mất hết tiền bạc và tài sản",
  "Bị đuổi khỏi nhà không biết đi đâu",
  "Mơ thấy mình đang chìm trong nước sâu",
  "Không tìm thấy đường ra khỏi mê cung",
  "Mơ thấy bị sa thải khỏi công việc",
  "Thi cử nhưng không làm được câu nào",
  "Mơ thấy mình trần truồng giữa đám đông",
  "Bị lạc trong rừng tối không có ai",
  "Mơ thấy điện thoại hỏng khi cần gọi cấp cứu",
  "Bị đuổi bởi người lạ trên đường tối",
  "Mơ thấy mất con trong siêu thị đông người",
  "Không thể tìm thấy nhà vệ sinh khi gấp",
  "Mơ thấy xe mất phanh trên đường dốc",
];

// 2. FEAR - Sợ hãi, kinh hoàng
const fearTemplates = [
  "Tôi mơ thấy quái vật đuổi theo mình",
  "Gặp con rắn khổng lồ trong phòng ngủ",
  "Mơ thấy ma quỷ xuất hiện",
  "Bị nhốt trong căn nhà ma ám",
  "Mơ thấy zombie tấn công",
  "Nhìn thấy bóng đen đáng sợ trong góc tối",
  "Mơ thấy mình trong nghĩa địa đêm khuya",
  "Bị ma ám không thoát ra được",
  "Mơ thấy người chết sống lại",
  "Gặp sát nhân trong hẻm tối",
  "Mơ thấy quỷ dữ tấn công",
  "Bị nhốt trong hầm tối đầy côn trùng",
  "Mơ thấy thảm họa thiên nhiên kinh hoàng",
  "Gặp động vật dữ tợn hung hãn",
  "Mơ thấy nhà sập xuống",
  "Bị rơi vào hố sâu không đáy",
  "Mơ thấy núi lửa phun trào",
  "Bị cuốn vào lốc xoáy",
  "Mơ thấy sóng thần ập đến",
  "Nhìn thấy tai nạn kinh hoàng",
];

// 3. ANXIETY - Lo âu, bất an (FOCUS: thi cử, công việc, deadline)
const anxietyTemplates = [
  // Thi cử - Học tập (25 templates)
  "Tôi đang đi thi bước hụt té tôi giật mình dậy",
  "Đi thi nhưng quên hết kiến thức đã học",
  "Mơ thấy mình đến trễ phòng thi và không được vào",
  "Ngồi trong phòng thi nhưng không biết làm câu nào",
  "Vào phòng thi muộn và mọi người đã làm xong",
  "Viết bài thi nhưng bút không có mực",
  "Kết quả thi ra và bị điểm kém không thể tin được",
  "Chuẩn bị thi nhưng không đọc được chữ trong sách",
  "Đến trường nhưng quên mất hôm nay có thi",
  "Thi xong mới nhớ ra mình học sai chương",
  "Làm bài thi nhưng thời gian trôi quá nhanh",
  "Quên mang giấy báo thi vào phòng thi",
  "Mơ thấy mình làm nhầm đề thi",
  "Không tìm thấy phòng thi trong trường lớn",
  "Làm bài thi nhưng giấy trắng xóa mất chữ",
  "Nộp bài thi nhưng mất giữa đường",
  "Bị đuổi ra khỏi phòng thi vì vi phạm",
  "Thi lại môn đã trượt nhiều lần",
  "Không đủ điều kiện để tốt nghiệp",
  "Bảo vệ luận văn nhưng không chuẩn bị gì",
  "Quên nộp bài tập quan trọng quyết định điểm",
  "Giáo viên gọi lên bảng nhưng không biết làm",
  "Thi vấn đáp nhưng quên hết nội dung",
  "Không đạt điểm đầu vào đại học",
  "Bị cha mẹ mắng vì thi kém",
  
  // Công việc - Deadline (20 templates)
  "Sếp gọi họp gấp nhưng tôi không chuẩn bị gì cả",
  "Có deadline quan trọng nhưng máy tính bị hỏng",
  "Đi làm muộn và sếp đứng chờ ở cửa",
  "Phải thuyết trình nhưng quên hết nội dung",
  "Gửi email sai cho khách hàng không thu hồi được",
  "Làm việc cả đêm nhưng file bị lỗi",
  "Bị sa thải vì không hoàn thành dự án",
  "Họp online nhưng micro camera không hoạt động",
  "Quên mật khẩu máy tính không thể làm việc",
  "Bị sếp phê bình trước đồng nghiệp",
  "Mất hết dữ liệu quan trọng của dự án",
  "Không hoàn thành KPI cuối tháng",
  "Bị đánh giá năng suất thấp",
  "Làm sai việc gây thiệt hại lớn",
  "Không hiểu yêu cầu của khách hàng",
  "Trình bày báo cáo nhưng số liệu sai",
  "Quên tham gia cuộc họp quan trọng",
  "Bị từ chối tăng lương vì năng lực kém",
  "Không theo kịp tiến độ của nhóm",
  "Làm việc nhóm nhưng mình không đóng góp được gì",
  
  // Lỡ hẹn - Đến muộn (15 templates)
  "Lỡ chuyến bay quan trọng không đặt lại được",
  "Đi phỏng vấn xin việc nhưng đến nhầm địa chỉ",
  "Có cuộc hẹn quan trọng nhưng tắc đường",
  "Lỡ buổi bảo vệ luận văn tốt nghiệp",
  "Chạy đuổi xe bus nhưng nó chạy mất",
  "Ngủ quên không đến dự đám cưới bạn thân",
  "Phải đi gặp bác sĩ gấp nhưng bị lạc đường",
  "Quên sinh nhật người thân và mọi người buồn",
  "Đặt vé xem phim nhưng đến rạp quá muộn",
  "Đi thi bằng lái xe nhưng đến muộn",
  "Hẹn người yêu nhưng không đến được",
  "Mất chuyến tàu về quê dịp Tết",
  "Đến sân bay nhưng quên mang hộ chiếu",
  "Cuộc hẹn quan trọng nhưng quên lịch",
  "Không kịp đón con tan học",
  
  // Chuẩn bị không đủ (15 templates)
  "Đi du lịch nhưng quên mang hộ chiếu",
  "Đi làm nhưng mặc đồ ngủ không thể về thay",
  "Phải nấu ăn đãi khách nhưng tủ lạnh trống",
  "Đi thi nhưng không mang bút và giấy nháp",
  "Chuẩn bị thuyết trình nhưng slide bị lỗi",
  "Đi phỏng vấn nhưng quên mang CV và bằng cấp",
  "Ký hợp đồng quan trọng nhưng quên đọc điều khoản",
  "Đi khám bệnh nhưng quên mang bảo hiểm",
  "Rút tiền nhưng quên mã PIN thẻ bị khóa",
  "Đi thi mà quên học bài hoàn toàn",
  "Không tìm thấy chìa khóa xe khi cần gấp",
  "Lạc trong thành phố lạ không có bản đồ",
  "Điện thoại hết pin khi cần gọi cấp cứu",
  "Mất ví có tiền và giấy tờ quan trọng",
  "Không nhớ đường về nhà trong giấc mơ",
  
  // Lo lắng tương lai (15 templates)
  "Lo lắng về việc thất nghiệp không kiếm được tiền",
  "Không đủ tiền trả học phí kỳ tới",
  "Sợ không tốt nghiệp được và gia đình thất vọng",
  "Bị từ chối khi xin việc ở nhiều công ty",
  "Lo lắng về khoản nợ ngày càng tăng",
  "Già đi mà chưa đạt được mục tiêu nào",
  "Sợ không đủ năng lực để thăng tiến",
  "Bị bạn bè bỏ rơi vì không thành công",
  "Cha mẹ ốm đau mà không có tiền chữa bệnh",
  "Thất bại trong kỳ thi quyết định tương lai",
  "Không đủ khả năng nuôi gia đình",
  "Sợ bị so sánh với người khác và thua kém",
  "Lo lắng về sức khỏe trong tương lai",
  "Không theo kịp công nghệ mới",
  "Bị bỏ lại phía sau trong cuộc đua nghề nghiệp",
  
  // Áp lực xã hội (10 templates)
  "Bị đồng nghiệp buộc tội không ai tin",
  "Bị cô lập trong nhóm bạn không ai nói chuyện",
  "Phải chọn giữa gia đình và công việc",
  "Bị mọi người nhìn chằm chằm và bàn tán",
  "Bạn bè phát hiện bí mật và xa lánh",
  "Bị hiểu lầm trong cuộc họp quan trọng",
  "Thuyết trình nhưng mọi người cười nhạo",
  "Bị gia đình ép buộc làm điều không muốn",
  "Người yêu phát hiện lỗi lầm và chia tay",
  "Bị bạn bè so sánh và cảm thấy thua kém",
];

// 4. SADNESS - Buồn bã, mất mát
const sadnessTemplates = [
  "Tôi mơ thấy người thân qua đời",
  "Chia tay với người yêu trong nước mắt",
  "Mơ thấy bạn bè rời xa mình",
  "Nhìn thấy gia đình tan vỡ",
  "Mơ thấy mình cô đơn một mình",
  "Người thân bỏ rơi mình",
  "Mơ thấy pet cưng chết",
  "Ngồi khóc một mình trong phòng tối",
  "Mơ thấy mình bị bệnh nặng",
  "Mất đi tất cả kỷ niệm đẹp",
  "Mơ thấy ngôi nhà tuổi thơ bị phá hủy",
  "Không được tha thứ dù đã xin lỗi",
  "Mơ thấy mình già yếu và cô đơn",
  "Nhìn thấy ảnh cũ và nhớ quá khứ",
  "Mơ thấy mình khóc suốt",
  "Bị từ chối bởi người mình yêu",
  "Mơ thấy mình thất bại và tuyệt vọng",
  "Nhìn thấy người thân đau khổ",
  "Mơ thấy mình không còn bạn bè",
  "Cảm thấy trống rỗng và buồn bã",
];

// 5. HAPPY - Vui vẻ, hạnh phúc
const happyTemplates = [
  "Tôi bay trên bầu trời xanh thật vui",
  "Gặp người thân yêu trong giấc mơ",
  "Mơ thấy mình du lịch nơi đẹp",
  "Được tặng món quà bất ngờ",
  "Mơ thấy mình trúng xổ số",
  "Bay lượn tự do như chim",
  "Gặp thần tượng của mình",
  "Mơ thấy đám cưới tuyệt đẹp",
  "Được tăng lương và thăng chức",
  "Mơ thấy mình nổi tiếng",
  "Chơi đùa với động vật dễ thương",
  "Mơ thấy bữa tiệc vui vẻ",
  "Nhảy múa trong mưa hoa",
  "Mơ thấy mình có siêu năng lực",
  "Bay vào không gian vũ trụ",
  "Gặp lại người bạn cũ",
  "Mơ thấy kỳ nghỉ tuyệt vời",
  "Được khen ngợi trước mọi người",
  "Mơ thấy mình thành công lớn",
  "Chơi ở công viên giải trí",
];

// 6. NEUTRAL - Trung tính, sinh hoạt bình thường
const neutralTemplates = [
  "Tôi đi dạo trong công viên",
  "Ăn cơm với gia đình",
  "Mơ thấy mình đi làm bình thường",
  "Nấu ăn trong bếp",
  "Dọn dẹp nhà cửa",
  "Mơ thấy mình đọc sách",
  "Xem TV với người thân",
  "Đi mua sắm ở siêu thị",
  "Mơ thấy mình đi bộ trên phố",
  "Ngồi uống cafe",
  "Tưới cây trong vườn",
  "Mơ thấy mình gặp bạn bè",
  "Lái xe trên đường",
  "Ngồi trong công viên",
  "Mơ thấy mình làm việc nhà",
  "Chơi game trên điện thoại",
  "Dọn phòng ngủ",
  "Mơ thấy mình nấu ăn",
  "Đi bộ đến cửa hàng",
  "Ngồi nghe nhạc",
];

// 7. CONFUSION - Lộn xộn, kỳ lạ
const confusionTemplates = [
  "Tôi mơ thấy màu sắc kỳ lạ không tồn tại",
  "Đồ vật biến hình liên tục",
  "Mơ thấy mình ở nhiều nơi cùng lúc",
  "Thời gian chạy ngược",
  "Mơ thấy người quen với khuôn mặt lạ",
  "Nhà cửa thay đổi hình dạng liên tục",
  "Mơ thấy mình vừa là người vừa là động vật",
  "Trọng lực không còn tác dụng",
  "Mơ thấy ngôn ngữ lạ không hiểu được",
  "Đường đi không có điểm cuối",
  "Mơ thấy sự vật phi logic",
  "Không gian xoắn vặn kỳ lạ",
  "Mơ thấy mình nhìn mình từ xa",
  "Mọi thứ chuyển động chậm rãi",
  "Mơ thấy cảnh vật trộn lẫn không rõ ràng",
  "Âm thanh kỳ lạ không xác định",
  "Mơ thấy con số và ký hiệu bay lượn",
  "Hiện thực và mơ ảo lẫn lộn",
  "Mơ thấy cảnh tượng siêu thực",
  "Mọi thứ tan biến và xuất hiện ngẫu nhiên",
];

// GENERATE VARIATIONS
function generateVariation(template) {
  const prefixes = [
    "",
    "Đêm qua ",
    "Hôm qua ",
    "Tối hôm qua ",
    "Tôi vừa ",
    "Tôi ",
    "Trong giấc mơ, ",
    "Lúc ngủ tôi ",
  ];
  
  const suffixes = [
    "",
    " và cảm thấy sợ hãi",
    " rất rõ ràng",
    " nhưng không nhớ rõ lắm",
    " thật kỳ lạ",
    " rất đáng nhớ",
    "",
    " trong giấc mơ",
    " khiến tôi giật mình",
    " thật bất ngờ",
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${template}${suffix}`.trim();
}


// GENERATE DATA
function generateData() {
  const data = [];
  const categories = [
    { name: 'stress', templates: stressTemplates },
    { name: 'fear', templates: fearTemplates },
    { name: 'anxiety', templates: anxietyTemplates },
    { name: 'sadness', templates: sadnessTemplates },
    { name: 'happy', templates: happyTemplates },
    { name: 'neutral', templates: neutralTemplates },
    { name: 'confusion', templates: confusionTemplates },
  ];
  
  console.log(`🔧 Generating training data...`);
  console.log(`${DREAMS_PER_CATEGORY} dreams per category`);
  console.log(`Total: ${DREAMS_PER_CATEGORY * 7} dreams\n`);
  
  categories.forEach(({ name, templates }) => {
    for (let i = 0; i < DREAMS_PER_CATEGORY; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      data.push({
        text: generateVariation(template),
        category: name
      });
    }
  });
  
  // Shuffle data
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  
  return data;
}

// SAVE

const data = generateData();

fs.writeFileSync(
  './dream_training_data.json',
  JSON.stringify(data, null, 2),
  'utf8'
);

console.log(`✅ Generated ${data.length} dreams`);
console.log(`\n📊 Distribution:`);

const categoryCount = data.reduce((acc, d) => {
  acc[d.category] = (acc[d.category] || 0) + 1;
  return acc;
}, {});

Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    const pct = ((count / data.length) * 100).toFixed(1);
    console.log(`   ${cat.padEnd(10)} ${count.toString().padStart(3)} (${pct}%)`);
  });

console.log(`\n File saved: dream_training_data.json`);
console.log(` Next: node src/Script/trainDreamModel.js`);
