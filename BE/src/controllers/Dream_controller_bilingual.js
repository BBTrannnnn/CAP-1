// This is the updated Dream_controller with bilingual support
// Language detection based on user input dream text

//LANGUAGE DETECTION
function detectLanguage(text) {
  // Check for Vietnamese diacritics
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  
  // Check for common Vietnamese words
  const vietnameseWords = /\b(tôi|mơ|giấc|thấy|bị|đang|của|là|có|không|này|được|với|cho|trong|về)\b/i;
  
  if (vietnameseChars.test(text) || vietnameseWords.test(text)) {
    return 'vi';
  }
  return 'en';
}

//INTERPRETATION 
function generateInterpretation(category, confidence, dreamText) {
  // Detect language from dream text
  const language = detectLanguage(dreamText);
  
  // Analyze keywords in dream (bilingual)
  const keywords = {
    exam: /thi|học|điểm|lớp|giáo viên|bài tập|deadline học|exam|test|school|grade|teacher|study|homework|quiz/i,
    work: /sếp|công ty|làm việc|họp|dự án|deadline|khách hàng|đồng nghiệp|boss|work|office|meeting|project|client|colleague|job/i,
    late: /muộn|trễ|lỡ|quên|không kịp|late|miss|forget|rush|hurry/i,
    chase: /đuổi|chạy trốn|bị theo|truy đuổi|chase|run|escape|pursue|follow/i,
    fall: /rơi|ngã|té|hụt chân|mất thăng bằng|fall|drop|slip|tumble|lose balance/i,
    lost: /lạc|không tìm thấy|mất|quên đường|lost|can't find|missing|lose way|confused direction/i,
  };
  
  // Bilingual interpretations: category → language → level → [variants]
  const interpretations = {
    stress: {
      vi: {
        high: [
          `Giấc mơ của bạn cho thấy dấu hiệu căng thẳng rõ rệt. ${
            keywords.chase.test(dreamText) 
              ? 'Cảm giác bị đuổi trong giấc mơ là biểu tượng rất phổ biến của stress - nó phản ánh việc bạn đang cố gắng trốn tránh hoặc né tránh một vấn đề, trách nhiệm, hoặc cảm xúc nào đó trong thực tế. Càng cố trốn, áp lực càng lớn.' 
              : keywords.fall.test(dreamText)
              ? 'Cảm giác rơi hoặc té trong giấc mơ thường xuất hiện khi bạn cảm thấy mất kiểm soát trong cuộc sống. Đây có thể liên quan đến công việc, học tập, hoặc các mối quan hệ mà bạn cảm thấy không nắm được tình hình.'
              : 'Bạn có thể đang đối mặt với nhiều áp lực đồng thời từ công việc, học tập, hoặc các mối quan hệ cá nhân. Cơ thể đang phát tín hiệu qua giấc mơ rằng bạn cần tạm dừng.'
          } Đây không chỉ là giấc mơ đơn thuần - đây là tín hiệu cảnh báo từ tiềm thức rằng cơ thể và tâm trí đang cần được nghỉ ngơi, chăm sóc. Căng thẳng kéo dài có thể ảnh hưởng đến sức khỏe thể chất và tinh thần. Hãy ưu tiên bản thân và tìm cách giảm tải những gánh nặng không cần thiết.`,
        ],
      },
      en: {
        high: [
          `Your dream shows clear signs of stress. ${
            keywords.chase.test(dreamText)
              ? 'Being chased in dreams is a very common stress symbol - it reflects that you are trying to avoid or escape a problem, responsibility, or emotion in reality. The more you run, the greater the pressure.'
              : keywords.fall.test(dreamText)
              ? 'The sensation of falling in dreams often appears when you feel a loss of control in life. This may relate to work, studies, or relationships where you feel unable to handle the situation.'
              : 'You may be facing multiple pressures simultaneously from work, studies, or personal relationships. Your body is sending signals through dreams that you need to pause.'
          } This is not just a simple dream - it's a warning signal from your subconscious that your body and mind need rest and care. Prolonged stress can affect both physical and mental health. Prioritize yourself and find ways to reduce unnecessary burdens.`,
        ],
      },
    },
  };
  
  // Determine confidence level
  let level = 'low';
  if (confidence >= 80) level = 'high';
  else if (confidence >= 60) level = 'medium';
  
  // Get variants for this category × language × level
  const categoryData = interpretations[category];
  if (!categoryData) {
    return language === 'vi' 
      ? 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.'
      : 'This dream reflects your current mental state.';
  }
  
  const languageData = categoryData[language];
  if (!languageData) {
    // Fallback to Vietnamese if language not found
    const fallbackLanguage = 'vi';
    const fallbackData = categoryData[fallbackLanguage];
    if (!fallbackData) return 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.';
    const variants = fallbackData[level];
    if (!Array.isArray(variants) || variants.length === 0) {
      return 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.';
    }
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  const variants = languageData[level];
  
  // If variants is array → pick random
  if (Array.isArray(variants) && variants.length > 0) {
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
  
  return language === 'vi'
    ? 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.'
    : 'This dream reflects your current mental state.';
}

// Test the function
console.log('=== LANGUAGE DETECTION TEST ===');
console.log('Vietnamese text:', detectLanguage('Tôi mơ thấy đi thi bị té'));
console.log('English text:', detectLanguage('I dreamed about falling during exam'));
console.log('Mixed but Vietnamese dominant:', detectLanguage('Tôi mơ exam và fall'));
console.log('Mixed but English dominant:', detectLanguage('I dreamed about thi'));

console.log('\n=== INTERPRETATION TEST ===');
console.log('Vietnamese stress high:', generateInterpretation('stress', 85, 'Tôi mơ thấy bị đuổi'));
console.log('\nEnglish stress high:', generateInterpretation('stress', 85, 'I dreamed about being chased'));
