import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Dream from '../models/Dream.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//LOAD MODEL, CONFIG 
let model = null;
let tokenizer = null;
let config = null;

//Load từ trained model
async function loadModel() {
  if (model) return;
  
  try {
    console.log('Loading dream analysis model...');
    
    const modelDir = path.join(__dirname, '../../trained_model');
    
    // Load config
    const configPath = path.join(modelDir, 'config.json');
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Load tokenizer
    const tokenizerPath = path.join(modelDir, 'tokenizer.json');
    tokenizer = JSON.parse(fs.readFileSync(tokenizerPath, 'utf8'));
    
    // Load model using loadGraphModel for Keras models
    const modelJsonPath = path.join(modelDir, 'model.json');
    const handler = tf.io.withSaveHandler(async (artifacts) => {
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    });
    
    // Create custom loader
    handler.load = async () => {
      const modelJSON = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
      const weightsManifest = modelJSON.weightsManifest[0];
      const weightPath = path.join(modelDir, weightsManifest.paths[0]);
      const weightsBuffer = fs.readFileSync(weightPath);
      
      // Fix InputLayer batch_shape to inputShape
      const topology = JSON.parse(JSON.stringify(modelJSON.modelTopology));
      if (topology.model_config && topology.model_config.config && topology.model_config.config.layers) {
        topology.model_config.config.layers.forEach(layer => {
          if (layer.class_name === 'InputLayer' && layer.config.batch_shape) {
            layer.config.inputShape = layer.config.batch_shape.slice(1);
            delete layer.config.batch_shape;
          }
        });
      }
      
      // Fix weight specs - remove "sequential/" prefix from Keras 3 models
      const weightSpecs = weightsManifest.weights.map(spec => ({
        ...spec,
        name: spec.name.replace(/^sequential\//, '')
      }));
      
      return {
        modelTopology: topology,
        weightSpecs: weightSpecs,
        weightData: weightsBuffer.buffer.slice(
          weightsBuffer.byteOffset,
          weightsBuffer.byteOffset + weightsBuffer.byteLength
        ),
        format: modelJSON.format,
        generatedBy: modelJSON.generatedBy,
        convertedBy: modelJSON.convertedBy
      };
    };
    
    model = await tf.loadLayersModel(handler);
    
    console.log('Dream analysis model loaded successfully');
  } catch (error) {
    console.error('Failed to load dream analysis model:', error);
    throw error;
  }
}

//TOKENIZE, PREDICT
function preprocessText(text) {
  //check xem tokenizer đã load 
  if (!tokenizer || !tokenizer.word_index) {
    throw new Error('Tokenizer not loaded');
  }
  
  const vocabSize = 2000; // Model chỉ có 2000 từ
  const maxLen = 50;
  const words = text.toLowerCase().match(/\S+/g) || [];
  const sequence = [];
  for (const word of words) {
    let idx = tokenizer.word_index[word];
    if (!idx || idx >= vocabSize) idx = 1; // <OOV> token
    sequence.push(idx);
  }
  while (sequence.length < maxLen) sequence.push(0);
  if (sequence.length > maxLen) sequence.length = maxLen;
  return sequence;
}

async function predictCategory(dreamText) {
  await loadModel();
  
  // Preprocess
  const sequence = preprocessText(dreamText);
  
  // Predict
  const inputTensor = tf.tensor2d([sequence], undefined, 'float32');
  const prediction = model.predict(inputTensor);
  const probabilities = await prediction.data();
  
  // Cleanup
  inputTensor.dispose();
  prediction.dispose();
  
  // Get category with highest probability
  const categories = config.categories;
  const maxProb = Math.max(...probabilities);
  const categoryIndex = Array.from(probabilities).indexOf(maxProb);
  const category = categories[categoryIndex];
  const confidence = (maxProb * 100).toFixed(2);
  
  // Build probabilities object
  const probabilitiesObj = {};
  categories.forEach((cat, idx) => {
    probabilitiesObj[cat] = parseFloat((probabilities[idx] * 100).toFixed(2));
  });
  
  return {
    category,
    confidence: parseFloat(confidence),
    probabilities: probabilitiesObj,
  };
}

//LANGUAGE DETECTION
function detectLanguage(text) {
  // Ưu tiên kiểm tra ký tự có dấu tiếng Việt
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const englishWords = /\b(I|you|he|she|it|we|they|dream|was|were|about|the|and|in|on|at|my|your|their|feeling|felt|scared|ghost|afraid|happy|sad|stress|confused|anxious|fear|love|hate|school|work|job|friend|family|sleep|nightmare|run|chase|fall|lost|exam|test|teacher|deadline|project|meeting|client|colleague|cry|laugh|smile|angry|worry|anxiety|depressed|lonely|miss|grief|sorrow|miserable|unhappy|tears|panic|danger|threat|frighten|alarm|horror|dread|normal|daily|routine|usual|ordinary|regular|common|typical|everyday|mundane|nervous|tense|restless|uneasy|concern|anticipation|death|killed|murder|attack|chased|trapped|monster|blood|scream|escape|weird|strange|surreal|bizarre|unusual|odd|peculiar|mysterious|supernatural|alien)\b/i;
  const vietnameseWords = /\b(tôi|toi|mơ|mo|giấc|giac|thấy|thay|bị|bi|đang|dang|của|cua|là|la|có|co|không|khong|này|nay|được|duoc|với|voi|cho|trong|ve|và|va|một|mot|các|cac|những|nhung|ngày|ngay|người|nguoi|buồn|buon|vui|minh|bay|sợ|so|lo|hạnh phúc|hanh phuc|yêu|ghét|trường|học|bạn|gia đình|ngủ|ác mộng|chạy|đuổi|rơi|lạc|thi|kiểm tra|giáo viên|deadline|dự án|họp|khách hàng|đồng nghiệp|khóc|cười|mỉm cười|tức giận|lo lắng|lo âu|trầm cảm|cô đơn|nhớ|đau buồn|nỗi buồn|khổ sở|không vui|nước mắt|hoảng loạn|nguy hiểm|đe dọa|hoảng sợ|báo động|kinh dị|sợ hãi|bình thường|hàng ngày|thói quen|thường lệ|phổ biến|điển hình|thường nhật|tầm thường|lo lắng|căng thẳng|bồn chồn|khó chịu|quan tâm|dự đoán|chết|bị giết|giết người|tấn công|bị đuổi|bị nhốt|quái vật|máu|la hét|thoát|kỳ lạ|lạ|siêu thực|kỳ quặc|bất thường|kỳ dị|đặc biệt|bí ẩn|siêu nhiên|người ngoài hành tinh)\b/i;

  // Nếu có ký tự tiếng Việt, chắc chắn là tiếng Việt
  if (vietnameseChars.test(text)) return 'vi';

  // Đếm số từ tiếng Anh và tiếng Việt
  const englishMatches = (text.match(englishWords) || []).length;
  const vietnameseMatches = (text.match(vietnameseWords) || []).length;

  // Nếu số từ tiếng Anh nhiều hơn rõ rệt, trả về tiếng Anh
  if (englishMatches > vietnameseMatches) return 'en';
  // Nếu số từ tiếng Việt nhiều hơn rõ rệt, trả về tiếng Việt
  if (vietnameseMatches > englishMatches) return 'vi';

  // Nếu không rõ, kiểm tra độ dài text: nếu có nhiều từ tiếng Anh, trả về 'en', ngược lại 'vi'
  if (englishMatches > 0) return 'en';
  if (vietnameseMatches > 0) return 'vi';

  // Mặc định: nếu không xác định được, trả về 'en'
  return 'en';
}

//INTERPRETATION 
function generateInterpretation(category, confidence, dreamText) {
  // Detect language from dream text
  const language = detectLanguage(dreamText);
  
  // Phân tích từ khóa trong dream (bilingual)
  const keywords = {
    exam: /thi|học|điểm|lớp|giáo viên|bài tập|deadline học|exam|test|school|grade|teacher|study|homework|quiz/i,
    work: /sếp|công ty|làm việc|họp|dự án|deadline|khách hàng|đồng nghiệp|boss|work|office|meeting|project|client|colleague|job/i,
    late: /muộn|trễ|lỡ|quên|không kịp|late|miss|forget|rush|hurry/i,
    chase: /đuổi|chạy trốn|bị theo|truy đuổi|chase|run|escape|pursue|follow/i,
    fall: /rơi|ngã|té|hụt chân|mất thăng bằng|fall|drop|slip|tumble|lose balance/i,
    lost: /lạc|không tìm thấy|mất|quên đường|lost|can't find|missing|lose way|confused direction/i,
  };
  
  // Bilingual interpretations: category × language × level × [variants]
  const interpretations = {
    stress: {
      vi: {
        high: [
          `Giấc mơ của bạn cho thấy dấu hiệu căng thẳng rõ rệt. ${
            keywords.chase.test(dreamText) 
              ? 'Cảm giác bị đuổi trong giấc mơ là biểu tượng rất phổ biến của căng thẳng - nó phản ánh việc bạn đang cố gắng trốn tránh hoặc né tránh một vấn đề, trách nhiệm, hoặc cảm xúc nào đó trong thực tế. Càng cố trốn, áp lực càng lớn.' 
              : keywords.fall.test(dreamText)
              ? 'Cảm giác rơi hoặc té trong giấc mơ thường xuất hiện khi bạn cảm thấy mất kiểm soát trong cuộc sống. Đây có thể liên quan đến công việc, học tập, hoặc các mối quan hệ mà bạn cảm thấy không nắm được tình hình.'
              : 'Bạn có thể đang đối mặt với nhiều áp lực đồng thời từ công việc, học tập, hoặc các mối quan hệ cá nhân. Cơ thể đang phát tín hiệu qua giấc mơ rằng bạn cần tạm dừng.'
          } Đây không chỉ là giấc mơ đơn thuần - đây là tín hiệu cảnh báo từ tiềm thức rằng cơ thể và tâm trí đang cần được nghỉ ngơi, chăm sóc. Căng thẳng kéo dài có thể ảnh hưởng đến sức khỏe thể chất và tinh thần. Hãy ưu tiên bản thân và tìm cách giảm tải những gánh nặng không cần thiết.`,
          
          `Tâm trí bạn đang trong trạng thái quá tải rõ ràng. Khi căng thẳng tích tụ đến mức cao, não bộ sử dụng giấc mơ như một "lối thoát khẩn cấp" để xử lý cảm xúc mà bạn không có thời gian đối mặt trong ngày. ${
            keywords.work.test(dreamText)
              ? 'Áp lực công việc đang ăn mòn sức khỏe tinh thần của bạn. Bạn có thể đang làm việc quá nhiều giờ, đảm nhận quá nhiều trách nhiệm, hoặc cảm thấy không được đánh giá đúng mức.'
              : 'Những giấc mơ hỗn loạn, đầy cảm giác bị áp lực như thế này thường xuất hiện khi bạn đang cố gắng "giữ mọi thứ lại với nhau" nhưng cảm thấy sắp không còn kiểm soát được.'
          } Cơ thể bạn đang kêu cứu. Nếu không thay đổi, căng thẳng mãn tính có thể dẫn đến kiệt sức, suy giảm hệ miễn dịch, và các vấn đề sức khỏe nghiêm trọng. Đã đến lúc phải nói "không" với một số việc và ưu tiên sức khỏe của chính bạn.`,
          
          `Giấc mơ này là một hồi chuông cảnh báo từ tiềm thức. Bạn đang sống trong chế độ "chiến đấu hoặc bỏ chạy" kéo dài - hệ thần kinh giao cảm liên tục hoạt động, cortisol (hormone căng thẳng) tăng cao, và cơ thể không có cơ hội phục hồi. ${
            keywords.chase.test(dreamText)
              ? 'Việc liên tục chạy trốn trong mơ cho thấy bạn đang tránh đối mặt với nguồn gốc căng thẳng thay vì giải quyết nó. Càng trốn, vấn đề càng lớn theo thời gian.'
              : 'Những giấc mơ như thế này là cách não bộ "thực hành" đối phó với nguy hiểm - nhưng trong thế giới hiện đại, "nguy hiểm" thường chỉ là deadline, email, và cuộc họp.'
          } Bạn cần tạm ngừng và đánh giá lại: Điều gì thực sự quan trọng? Điều gì có thể để sau? Ai có thể giúp đỡ? Quản lý căng thẳng không phải là xa xỉ - đó là điều cần thiết cho cuộc sống bền vững.`,
        ],
        medium: [
          `Bạn đang trải qua một số áp lực nhất định trong cuộc sống. ${
            keywords.work.test(dreamText) 
              ? 'Áp lực từ công việc hoặc học tập có thể đang len lỏi vào giấc ngủ của bạn. Tâm trí đang cố xử lý những lo lắng về deadline, hiệu suất, hoặc kỳ vọng từ người khác.' 
              : 'Bạn có thể đang lo lắng về một số vấn đề chưa được giải quyết hoặc quyết định chưa đưa ra.'
          } Giấc mơ này là cách não bộ "luyện tập" đối phó với căng thẳng - một quá trình tự nhiên giúp bạn chuẩn bị tinh thần. Tuy nhiên, nếu những giấc mơ kiểu này lặp lại thường xuyên, đó là lúc bạn cần xem xét lại lịch trình, ưu tiên công việc, và tìm cách cân bằng cuộc sống tốt hơn. Hãy nhớ: căng thẳng vừa phải có thể là động lực, nhưng quá mức sẽ gây hại.`,
          
          `Tâm trí bạn đang gửi tín hiệu rằng bạn cần chú ý đến mức độ căng thẳng hiện tại. Chưa đến mức báo động đỏ, nhưng đã là lúc cần có kế hoạch hành động. ${
            keywords.exam.test(dreamText)
              ? 'Áp lực về học tập hoặc đánh giá đang tạo ra gánh nặng tâm lý. Bạn có thể đang quá tập trung vào kết quả mà quên mất quá trình học cũng quan trọng không kém.'
              : 'Cuộc sống đang đòi hỏi nhiều hơn bạn thoải mái xử lý, nhưng bạn vẫn đang đối phó được.'
          } Đây là cơ hội để điều chỉnh trước khi căng thẳng leo thang. Hãy kiểm tra lại lịch trình: bạn có đang cam kết quá nhiều không? Có đang bỏ qua việc chăm sóc bản thân không? Có đang cố làm mọi thứ một mình không? Những thay đổi nhỏ bây giờ có thể ngăn ngừa kiệt sức sau này.`,
        ],
        low: [
          `Có dấu hiệu căng thẳng nhẹ trong tâm trí bạn, nhưng ở mức độ có thể quản lý được. Điều này hoàn toàn bình thường - cuộc sống hiện đại luôn có những áp lực nhỏ hàng ngày. Giấc mơ này cho thấy bạn đang xử lý tốt những căng thẳng này, nhưng vẫn cần chú ý không để chúng tích tụ thành gánh nặng lớn hơn. Hãy duy trì các hoạt động giải tỏa căng thẳng như nghỉ ngơi đủ, vận động, và dành thời gian cho bản thân.`,
          
          `Mức độ căng thẳng của bạn đang ở mức cơ bản khỏe mạnh - có một chút căng thẳng nhưng không quá tải. Đây thực ra là bình thường và thậm chí có thể có lợi, vì căng thẳng nhẹ giúp chúng ta tỉnh táo và có động lực. Giấc mơ này chỉ là bộ não đang xử lý những căng thẳng nhỏ hàng ngày. Hãy tiếp tục những gì bạn đang làm, nhưng vẫn chú ý để không để căng thẳng tăng lên mà không nhận ra.`,
        ],
      },
      en: {
        high: [
          `Your dream shows clear signs of significant stress. ${
            keywords.chase.test(dreamText)
              ? 'Being chased in dreams is a very common stress symbol - it reflects that you are trying to avoid or escape a problem, responsibility, or emotion in reality. The more you run, the greater the pressure builds.'
              : keywords.fall.test(dreamText)
              ? 'The sensation of falling in dreams often appears when you feel a loss of control in life. This may relate to work, studies, or relationships where you feel unable to handle the situation.'
              : 'You may be facing multiple pressures simultaneously from work, studies, or personal relationships. Your body is sending signals through dreams that you need to pause.'
          } This is not just a simple dream - it's a warning signal from your subconscious that your body and mind need rest and care. Prolonged stress can affect both physical and mental health. Prioritize yourself and find ways to reduce unnecessary burdens.`,
          
          `Your mind is clearly in an overloaded state. When stress accumulates to high levels, the brain uses dreams as an "emergency exit" to process emotions you don't have time to face during the day. ${
            keywords.work.test(dreamText)
              ? 'Work pressure is eroding your mental health. You may be working too many hours, taking on too many responsibilities, or feeling undervalued.'
              : 'These chaotic, pressure-filled dreams typically appear when you are trying to "hold everything together" but feel you are losing control.'
          } Your body is crying for help. Without change, chronic stress can lead to burnout, weakened immune system, and serious health issues. It's time to say "no" to some things and prioritize your own health.`,
          
          `This dream is a warning bell from your subconscious. You are living in prolonged "fight or flight" mode - your sympathetic nervous system is constantly activated, cortisol (stress hormone) is elevated, and your body has no chance to recover. ${
            keywords.chase.test(dreamText)
              ? 'Constantly running away in dreams shows you are avoiding confronting the source of stress rather than resolving it. The more you avoid, the bigger the problem grows over time.'
              : 'Dreams like this are the brain\'s way of "practicing" dealing with danger - but in the modern world, "danger" is often just deadlines, emails, and meetings.'
          } You need to pause and reassess: What really matters? What can wait? Who can help? Stress management is not a luxury - it's a necessity for sustainable living.`,
        ],
        medium: [
          `You are experiencing some pressure in your life. ${
            keywords.work.test(dreamText)
              ? 'Pressure from work or studies may be creeping into your sleep. Your mind is trying to process worries about deadlines, performance, or expectations from others.'
              : 'You may be worrying about some unresolved issues or decisions not yet made.'
          } This dream is the brain's way of "practicing" coping with stress - a natural process that helps you prepare mentally. However, if these types of dreams repeat frequently, it's time to review your schedule, prioritize work, and find better ways to balance life. Remember: moderate stress can be motivating, but too much is harmful.`,
          
          `Your mind is sending signals that you need to pay attention to your current stress level. Not at red alert yet, but it's time for an action plan. ${
            keywords.exam.test(dreamText)
              ? 'Pressure about academic performance or evaluation is creating psychological burden. You may be too focused on results and forgetting that the learning process is equally important.'
              : 'Life is demanding more than you are comfortable handling, but you are still coping.'
          } This is a window of opportunity to adjust before stress escalates. Audit your schedule: are you overcommitting? Are you neglecting self-care? Are you trying to do everything alone? Small changes now can prevent burnout later.`,
        ],
        low: [
          `There are signs of mild stress in your mind, but at a manageable level. This is completely normal - modern life always has small daily pressures. This dream shows you are handling these stresses well, but still need to be careful not to let them accumulate into bigger burdens. Maintain stress-relief activities like getting enough rest, exercising, and taking time for yourself.`,
          
          `Your stress level is at a healthy baseline - some tension but not overwhelming. This is actually normal and can even be beneficial, as mild stress helps us stay alert and motivated. This dream is just the brain processing daily micro-stresses. Keep doing what you're doing, but stay mindful so stress doesn't creep up unnoticed.`,
        ],
      },
    },
    
    fear: {
      vi: {
        high: [
          `Giấc mơ này thể hiện nỗi sợ hãi sâu sắc đang ẩn trong tiềm thức của bạn. Nỗi sợ trong giấc mơ thường được phóng đại và siêu thực hơn thực tế nhiều lần - đây là cách não bộ xử lý và đối mặt với những lo lắng mà có thể bạn đang cố gắng không nghĩ đến khi tỉnh táo. ${
            keywords.chase.test(dreamText)
              ? 'Việc bị đuổi bởi thứ gì đó đáng sợ trong mơ thường biểu thị việc bạn đang trốn tránh một nỗi sợ hoặc vấn đề trong đời thực - có thể là sợ thất bại, sợ bị từ chối, hoặc sợ đối mặt với sự thật nào đó.'
              : ''
          } Đây là dấu hiệu quan trọng cần được quan tâm. Nỗi sợ không được giải quyết có thể ảnh hưởng đến chất lượng cuộc sống, gây lo lắng, tránh né, và hạn chế khả năng phát triển của bạn. Hãy nhớ: phần lớn những gì chúng ta sợ hãi không bao giờ xảy ra, và ngay cả khi xảy ra, chúng ta thường có khả năng đối phó tốt hơn mình nghĩ. Hãy từng bước nhỏ đối mặt với nỗi sợ, hoặc tìm sự hỗ trợ từ chuyên gia nếu cảm thấy quá tải.`,
          
          `Nỗi sợ hãi này đang ảnh hưởng sâu sắc đến giấc ngủ của bạn. Khi chúng ta sợ hãi, bộ não vào chế độ "đối mặt hoặc trốn chạy" ngay cả khi ngủ, khiến giấc mơ trở nên căng thẳng và đáng sợ. Điều quan trọng là phải nhận ra: nỗi sợ trong mơ thường không phản ánh nguy hiểm thực tế, mà là cách tâm trí xử lý lo lắng. Hãy tìm nguồn gốc của nỗi sợ và đối mặt từng bước nhỏ.`,
        ],
        medium: [
          `Bạn đang có cảm giác lo sợ hoặc bất an về một tình huống cụ thể nào đó trong cuộc sống. ${
            keywords.chase.test(dreamText)
              ? 'Việc bị đuổi trong mơ thường liên quan đến việc bạn đang sợ đối mặt với một vấn đề, một cuộc trò chuyện khó khăn, hoặc một quyết định quan trọng.'
              : 'Giấc mơ này có thể là phản ánh của những lo lắng chưa được giải tỏa hoặc các tình huống khiến bạn cảm thấy không an toàn.'
          } Nỗi sợ ở mức độ này là tín hiệu từ cơ thể rằng có điều gì đó cần được chú ý. Thay vì bỏ qua hoặc đè nén, hãy thử xác định rõ nguyên nhân: Bạn đang sợ điều gì? Điều đó có thực sự nguy hiểm không? Liệu có cách nào chuẩn bị tốt hơn? Việc đặt tên cho nỗi sợ và lập kế hoạch cụ thể để đối phó sẽ giúp giảm bớt cảm giác bất lực.`,
          
          `Mức độ lo sợ này cho thấy bạn đang đối mặt với điều gì đó bất an, nhưng vẫn trong tầm kiểm soát. Hãy thử kỹ thuật "phơi nhiễm từ từ" - đối mặt với nỗi sợ theo từng bước nhỏ, an toàn. Mỗi lần đối mặt thành công sẽ giảm bớt sức mạnh của nó.`,
        ],
        low: [
          `Có chút lo sợ nhẹ trong tâm trí, nhưng không ảnh hưởng nghiêm trọng đến cuộc sống hàng ngày của bạn. Đây có thể chỉ là phản ánh của những lo lắng nhỏ, những bất ổn tự nhiên của cuộc sống, hoặc dư âm từ những trải nghiệm trong ngày. Mức độ lo sợ này là bình thường và có thể tự khắc phục. Hãy thư giãn, tin tưởng vào khả năng xử lý của bản thân, và nhớ rằng: lo sợ là cảm xúc bảo vệ, nhưng đôi khi não bộ "báo động sai" - hãy kiểm tra lại xem liệu mối nguy có thực sự tồn tại không.`,
        ],
      },
      en: {
        high: [
          `This dream reflects deep-seated fear hidden in your subconscious. Fear in dreams is often magnified and more surreal than reality - this is how the brain processes and confronts worries you may be trying not to think about when awake. ${
            keywords.chase.test(dreamText)
              ? 'Being chased by something frightening in dreams often indicates you are avoiding a fear or problem in real life - it could be fear of failure, rejection, or facing a certain truth.'
              : ''
          } This is an important sign that needs attention. Unresolved fear can affect quality of life, cause anxiety, avoidance, and limit your growth potential. Remember: most of what we fear never happens, and even when it does, we usually have better coping abilities than we think. Face your fears in small steps, or seek professional support if feeling overwhelmed.`,
          
          `This fear is deeply affecting your sleep. When we are afraid, the brain goes into "fight or flight" mode even during sleep, making dreams tense and frightening. The important thing is to recognize: fear in dreams often does not reflect real danger, but is the mind's way of processing worry. Find the source of the fear and face it in small steps.`,
        ],
        medium: [
          `You are experiencing feelings of fear or insecurity about a specific situation in life. ${
            keywords.chase.test(dreamText)
              ? 'Being chased in dreams often relates to being afraid to face a problem, a difficult conversation, or an important decision.'
              : 'This dream may reflect unresolved worries or situations that make you feel unsafe.'
          } Fear at this level is a signal from your body that something needs attention. Instead of ignoring or suppressing it, try to identify the cause clearly: What are you afraid of? Is it really dangerous? Is there a way to better prepare? Naming the fear and making a specific plan to deal with it will help reduce feelings of helplessness.`,
          
          `This level of fear shows you are facing something unsettling, but still within control. Try the "gradual exposure" technique - face the fear in small, safe steps. Each successful confrontation will reduce its power.`,
        ],
        low: [
          `There is some mild fear in your mind, but it does not seriously affect your daily life. This may just reflect small worries, natural uncertainties of life, or echoes from experiences during the day. This level of fear is normal and can self-resolve. Relax, trust your coping abilities, and remember: fear is a protective emotion, but sometimes the brain "false alarms" - check whether the danger really exists.`,
        ],
      },
    },
    
    anxiety: {
      vi: {
        high: [
          `Giấc mơ này phản ánh mức độ lo âu cao - một trạng thái mà nhiều người đang trải qua trong cuộc sống hiện đại. ${
          keywords.exam.test(dreamText)
            ? 'Lo âu về thi cử, kiểm tra, hoặc đánh giá là một trong những giấc mơ phổ biến nhất. Cảm giác "không chuẩn bị" hoặc "không đủ giỏi" trong mơ phản ánh sự thiếu tự tin, áp lực kỳ vọng (từ bản thân hoặc người khác), hoặc nỗi sợ thất bại. Ngay cả khi bạn đã tốt nghiệp nhiều năm, giấc mơ này vẫn có thể quay lại khi bạn đối mặt với tình huống mới đòi hỏi phải chứng minh năng lực.'
            : keywords.work.test(dreamText)
            ? 'Lo âu về công việc đang len lỏi vào giấc ngủ của bạn. Bạn có thể đang lo lắng về năng lực bản thân, so sánh với đồng nghiệp, sợ mắc sai lầm, hoặc áp lực từ deadline và kỳ vọng. Những giấc mơ này thường xuất hiện khi bạn cảm thấy bị overwhelm bởi khối lượng công việc hoặc không chắc chắn về kết quả.'
            : keywords.late.test(dreamText)
            ? 'Cảm giác đến muộn, lỡ hẹn, hoặc không kịp trong mơ là biểu tượng của lo âu về việc bỏ lỡ cơ hội, không đáp ứng kỳ vọng, hoặc sợ bị bỏ lại phía sau. Đây thường liên quan đến áp lực thời gian trong cuộc sống thực.'
            : 'Bạn đang lo lắng về tương lai, sợ những điều chưa biết, hoặc cảm thấy bất an về các quyết định quan trọng. Lo âu làm não bộ liên tục "lập kế hoạch cho tình huống xấu" để chuẩn bị - nhưng điều này lại khiến bạn kiệt sức.'
        } Hãy nhớ rằng: lo âu là cảm xúc tự nhiên của con người, được thiết kế để giúp chúng ta chuẩn bị cho nguy hiểm. Nhưng trong thế giới hiện đại, hệ thống này thường "báo động quá mức" với những mối đe dọa không thực sự nguy hiểm. Bạn cần học cách phân biệt giữa lo âu hữu ích (thúc đẩy chuẩn bị) và lo âu vô ích (chỉ gây stress). Các kỹ thuật như lập kế hoạch cụ thể, chia nhỏ mục tiêu, và mindfulness có thể giúp quản lý lo âu hiệu quả.`,
        
        `Anxiety level của bạn đang ở mức cao - đây là red flag cần được addressed. ${
          keywords.exam.test(dreamText)
            ? 'Giấc mơ về thi cử này không chỉ là về bài thi - nó biểu trưng cho nỗi sợ bị đánh giá, sợ không đủ giỏi, sợ thất vọng người khác. Đây là pattern rất phổ biến ở những người perfectionist hoặc có impostor syndrome.'
            : keywords.lost.test(dreamText)
            ? 'Cảm giác lạc lối trong mơ mirror feeling lost trong cuộc sống thực. Bạn có thể đang facing major decision mà không biết đâu là lựa chọn đúng, hoặc cảm thấy cuộc sống đang đi sai hướng.'
            : 'Tâm trí bạn đang trong trạng thái "hypervigilance" - liên tục scan môi trường để tìm nguy hiểm, chuẩn bị cho worst-case scenarios, không thể relax.'
        } Lo âu ở mức này không chỉ ảnh hưởng giấc ngủ mà còn impact quality of life: khó tập trung, dễ irritable, tránh né situations, physical symptoms (đau đầu, đau bụng, tim đập nhanh). Đây là lúc cần intervention: therapy (CBT rất effective cho anxiety), medication nếu cần, và lifestyle changes (giảm caffeine, tăng exercise, practice relaxation). Đừng để anxiety control cuộc sống bạn.`,
        
        `Giấc mơ đầy lo âu này cho thấy amygdala (vùng não xử lý sợ hãi) đang hoạt động overtime. ${
          keywords.work.test(dreamText)
            ? 'Work anxiety thường stem từ imposter syndrome, fear of failure, hoặc perfectionism. Bạn có thể đang set standards quá cao cho bản thân, constantly comparing với người khác, hoặc catastrophizing kết quả.'
            : keywords.late.test(dreamText)
            ? 'Fear of missing out (FOMO) hoặc fear of not meeting expectations đang haunt bạn. Trong thế giới "always-on" này, chúng ta cảm thấy phải luôn available, luôn productive, không được phép "trễ" - nhưng đây là unsustainable.'
            : 'General anxiety đang permeate mọi aspect của life. Bạn có thể đang overthinking mọi thứ, worrying about things chưa xảy ra, và exhausted from constant mental gymnastics.'
        } Root cause của anxiety thường không phải là external situations, mà là how we perceive and interpret them. Cognitive distortions như catastrophizing, all-or-nothing thinking, mind reading đang fuel anxiety. Cần learn to challenge these thoughts: Evidence cho thought này là gì? Worst case thực sự tệ như mình nghĩ không? Alternative explanations là gì? Với practice, bạn có thể rewire brain để respond differently to anxiety triggers.`,
      ],
      
      medium: [
        `Bạn đang có những lo âu nhất định, nhưng chưa đến mức nghiêm trọng. ${
          keywords.lost.test(dreamText)
            ? 'Cảm giác lạc đường, không tìm thấy đường đi trong mơ thường liên quan đến việc bạn đang không chắc chắn về hướng đi trong cuộc sống - có thể là sự nghiệp, mối quan hệ, hoặc quyết định quan trọng. Bạn cảm thấy thiếu bản đồ, thiếu hướng dẫn, hoặc không biết bước tiếp theo nên làm gì.'
            : 'Giấc mơ này cho thấy tâm trí bạn đang tích cực tìm cách giải quyết các vấn đề đang trăn trở. Não bộ sử dụng giấc mơ như "phòng lab" để thử nghiệm các kịch bản và chuẩn bị cho những tình huống khó khăn.'
        } Lo âu ở mức độ này là dấu hiệu tốt để bạn tạm dừng, đánh giá lại tình hình, và lập kế hoạch rõ ràng hơn. Thay vì để lo âu lan tỏa thành cảm giác choáng ngợp, hãy cụ thể hóa: Bạn lo âu về điều gì chính xác? Bạn có thể kiểm soát yếu tố nào? Hành động nhỏ nào có thể làm ngay hôm nay? Việc chuyển lo âu mơ hồ thành action plan cụ thể sẽ giảm stress đáng kể.`,
        
        `Moderate anxiety như thế này là "sweet spot" để intervention hiệu quả nhất. Chưa severe enough để impact daily functioning, nhưng đủ noticeable để bạn recognize cần change. ${
          keywords.exam.test(dreamText)
            ? 'Anxiety về performance/evaluation đang present nhưng manageable. Đây có thể là motivating nếu channeled đúng cách - một chút nervous energy giúp prepare tốt hơn.'
            : 'Bạn có awareness về anxiety và đang trying to cope, which is positive. Điều quan trọng là không let nó escalate.'
        } Đây là perfect time để establish anxiety management habits: daily mindfulness practice (even 5 minutes), regular exercise (natural anxiety reducer), good sleep hygiene, limiting caffeine và alcohol, building support network. Những habits này sẽ serve as buffer khi life throws challenges. Think of it as building psychological resilience - như strengthen immune system nhưng cho mental health.`,
      ],
      
      low: [
        `Có một chút lo âu nhẹ, điều này hoàn toàn bình thường trong cuộc sống hàng ngày. ${
          keywords.late.test(dreamText)
            ? 'Sợ trễ hẹn, lỡ deadline là lo lắng phổ biến, thường xuất phát từ mong muốn làm tốt và không muốn làm người khác thất vọng. Đây là dấu hiệu của trách nhiệm và sự cẩn thận.'
            : 'Lo âu ở mức độ này thường là phản ứng tự nhiên với những thay đổi nhỏ hoặc những việc cần hoàn thành.'
        } Mức độ lo âu này không đáng lo ngại, nhưng vẫn cần chú ý không để nó tích tụ. Hãy duy trì các thói quen tốt như ngủ đủ giấc, vận động đều đặn, và có khoảng thời gian thư giãn mỗi ngày. Những hoạt động này là "lá chắn" giúp ngăn lo âu nhẹ phát triển thành lo âu nặng.`,
        
        `Low-level anxiety này là completely normal - part of being human. Nó actually serves protective function, keeping us alert và cautious trong situations cần careful attention. Key là not letting small anxieties snowball. Quick check: Are you sleeping okay? Eating regularly? Moving your body? Có human connection? Nếu basic needs được meet và bạn có healthy outlets, low anxiety này sẽ pass naturally. No need to overthink it.`,
      ],
      },
      en: {
        high: [
          `This dream reflects high anxiety - a state many people experience in modern life. ${
            keywords.exam.test(dreamText)
              ? 'Anxiety about exams, tests, or evaluations is one of the most common dreams. The feeling of being "unprepared" or "not good enough" reflects lack of confidence, performance pressure (from self or others), or fear of failure. Even years after graduation, this dream can return when facing new situations requiring proof of competence.'
              : keywords.work.test(dreamText)
              ? 'Work anxiety is creeping into your sleep. You may be worried about your abilities, comparing yourself to colleagues, fearing mistakes, or pressure from deadlines and expectations. These dreams often appear when you feel overwhelmed by workload or uncertain about outcomes.'
              : keywords.late.test(dreamText)
              ? 'Feelings of being late, missing appointments, or not making it on time in dreams symbolize anxiety about missing opportunities, not meeting expectations, or fear of being left behind. This often relates to time pressure in real life.'
              : 'You are worrying about the future, fearing the unknown, or feeling insecure about important decisions. Anxiety causes the brain to constantly "plan for worst-case scenarios" to prepare - but this exhausts you.'
          } Remember: anxiety is a natural human emotion, designed to help us prepare for danger. But in the modern world, this system often "over-alerts" to threats that are not truly dangerous. You need to learn to distinguish between helpful anxiety (motivating preparation) and unhelpful anxiety (just causing stress). Techniques like specific planning, breaking down goals, and mindfulness can help manage anxiety effectively.`,
          
          `Your anxiety level is high - this is a red flag that needs to be addressed. ${
            keywords.exam.test(dreamText)
              ? 'This exam dream is not just about the test - it symbolizes fear of being judged, fear of not being good enough, fear of disappointing others. This is a very common pattern in perfectionists or those with impostor syndrome.'
              : keywords.lost.test(dreamText)
              ? 'Feeling lost in dreams mirrors feeling lost in real life. You may be facing a major decision without knowing the right choice, or feeling life is going in the wrong direction.'
              : 'Your mind is in a state of "hypervigilance" - constantly scanning the environment for danger, preparing for worst-case scenarios, unable to relax.'
          } Anxiety at this level not only affects sleep but also impacts quality of life: difficulty concentrating, easy irritability, avoidance of situations, physical symptoms (headaches, stomachaches, rapid heartbeat). This is when intervention is needed: therapy (CBT is very effective for anxiety), medication if necessary, and lifestyle changes (reduce caffeine, increase exercise, practice relaxation). Don\'t let anxiety control your life.`,
        ],
        medium: [
          `You have some anxiety, but not at a serious level yet. ${
            keywords.lost.test(dreamText)
              ? 'Feeling lost or unable to find your way in dreams often relates to being uncertain about life direction - could be career, relationships, or important decisions. You feel lacking a map, lacking guidance, or not knowing what the next step should be.'
              : 'This dream shows your mind is actively trying to solve troubling issues. The brain uses dreams as a "lab" to test scenarios and prepare for difficult situations.'
          } Anxiety at this level is a good sign to pause, reassess the situation, and make clearer plans. Instead of letting anxiety spread into overwhelming feelings, be specific: What exactly are you anxious about? What factors can you control? What small action can you take today? Converting vague anxiety into a specific action plan will significantly reduce stress.`,
        ],
        low: [
          `There is some mild anxiety, which is completely normal in daily life. ${
            keywords.late.test(dreamText)
              ? 'Fear of being late or missing deadlines is a common worry, often stemming from wanting to do well and not wanting to disappoint others. This is a sign of responsibility and carefulness.'
              : 'Anxiety at this level is usually a natural response to small changes or tasks that need to be completed.'
          } This level of anxiety is not concerning, but still need to watch that it doesn't accumulate. Maintain good habits like getting enough sleep, regular exercise, and having relaxation time each day. These activities act as "shields" to prevent mild anxiety from developing into severe anxiety.`,
        ],
      },
    },
    
    sadness: {
      vi: {
        high: [`Giấc mơ này thể hiện nỗi buồn sâu sắc, một cảm xúc nặng nề đang hiện diện trong cuộc sống của bạn. Bạn có thể đang trải qua giai đoạn khó khăn về mặt cảm xúc - có thể là mất mát (người thân, mối quan hệ, công việc, cơ hội), chia ly đau đớn, hoặc cảm giác cô đơn sâu sắc. Buồn không phải là dấu hiệu của sự yếu đuối - đây là phản ứng tự nhiên và cần thiết của con người khi đối mặt với mất mát. Giấc mơ này cho thấy tâm trí đang xử lý nỗi đau, đang cố gắng hiểu và chấp nhận thực tế. Hãy cho phép bản thân được buồn, được khóc, được cảm nhận đầy đủ cảm xúc này - đó là quá trình chữa lành cần thiết, không phải điều cần phải xấu hổ hoặc trốn tránh. Tuy nhiên, nếu nỗi buồn kéo dài nhiều tuần không thuyên giảm, ảnh hưởng đến khả năng hoạt động hàng ngày, hoặc đi kèm với suy nghĩ tiêu cực về bản thân, hãy nghiêm túc xem xét việc tìm kiếm sự hỗ trợ từ chuyên gia tâm lý. Bạn không phải đối mặt với nỗi buồn này một mình.`],
      
        medium: [`Bạn đang có những cảm xúc buồn bã, tâm trạng u ám trong thời gian gần đây. Giấc mơ này là sự phản ánh của trạng thái tinh thần không vui - có thể do công việc không như ý, mối quan hệ căng thẳng, hoặc đơn giản là cảm giác trống rỗng, thiếu ý nghĩa. Buồn là cảm xúc hoàn toàn tự nhiên và quan trọng - nó giúp chúng ta nhận ra điều gì không ổn, điều gì cần thay đổi. Đừng cố gắng "vui lên" một cách cưỡng bức hoặc đè nén cảm xúc. Thay vào đó, hãy thừa nhận nỗi buồn, tìm hiểu nguyên nhân, và từ từ tìm cách cải thiện tình hình. Các hoạt động như viết nhật ký cảm xúc, nói chuyện với người thân, tham gia hoạt động sáng tạo, hoặc dành thời gian ngoài trời có thể giúp xử lý nỗi buồn một cách lành mạnh. Nếu kéo dài hoặc trở nặng, đừng ngần ngại tìm sự hỗ trợ chuyên nghiệp.`],
      
        low: [`Có chút buồn trong tâm trí, nhưng không phải là mức độ nghiêm trọng. Đây có thể là tâm trạng thoáng qua do những sự việc nhỏ trong ngày, hoặc là cảm xúc nhẹ còn sót lại từ những trải nghiệm trước đó. Buồn ở mức độ này là một phần tự nhiên của cuộc sống - không ai có thể vui vẻ 100% thời gian. Hãy chấp nhận cảm xúc này mà không phán xét bản thân. Đồng thời, hãy chủ động tìm kiếm những khoảnh khắc vui vẻ nhỏ: một bữa ăn ngon, cuộc gọi với bạn bè, bài hát yêu thích, hoặc chỉ đơn giản là nghỉ ngơi đầy đủ. Những điều nhỏ này có sức mạnh lớn trong việc cải thiện tâm trạng.`],
      },
      en: {
        high: [`This dream reflects deep sadness, a heavy emotion present in your life. You may be going through an emotionally difficult period - possibly loss (loved ones, relationships, job, opportunities), painful separation, or deep loneliness. Sadness is not a sign of weakness - it is a natural and necessary human response when facing loss. This dream shows your mind is processing the pain, trying to understand and accept reality. Allow yourself to be sad, to cry, to fully feel this emotion - it is a necessary healing process, not something to be ashamed of or avoid. However, if sadness persists for weeks without improvement, affects daily functioning, or comes with negative thoughts about yourself, seriously consider seeking support from a mental health professional. You don't have to face this sadness alone.`],
        medium: [`You are experiencing sad feelings and a gloomy mood recently. This dream reflects an unhappy mental state - possibly due to unsatisfactory work, strained relationships, or simply feelings of emptiness and meaninglessness. Sadness is a completely natural and important emotion - it helps us recognize what is wrong, what needs to change. Don't try to "cheer up" forcibly or suppress emotions. Instead, acknowledge the sadness, understand the cause, and gradually find ways to improve the situation. Activities like emotional journaling, talking with loved ones, engaging in creative activities, or spending time outdoors can help process sadness in a healthy way. If it persists or worsens, don't hesitate to seek professional support.`],
        low: [`There is some sadness in your mind, but not at a serious level. This may be a passing mood due to small daily events, or light emotions lingering from previous experiences. Sadness at this level is a natural part of life - no one can be happy 100% of the time. Accept this emotion without judging yourself. At the same time, proactively seek small happy moments: a good meal, a call with friends, a favorite song, or simply getting enough rest. These small things have great power in improving mood.`],
      },
    },
    
    happy: {
      vi: {
        high: [`Giấc mơ tích cực và vui vẻ này là phản ánh tuyệt vời của trạng thái tinh thần lành mạnh của bạn! Bạn đang ở trong giai đoạn tốt đẹp của cuộc sống - có thể đạt được thành tựu, mối quan hệ hạnh phúc, hoặc đơn giản là cảm thấy hài lòng với cuộc sống hiện tại. Não bộ khi được "nạp đầy" những cảm xúc tích cực sẽ tạo ra những giấc mơ đẹp như thế này. Đây là kết quả của serotonin (hormone hạnh phúc) và endorphin được tiết ra ổn định. Giấc mơ vui vẻ không chỉ là trải nghiệm dễ chịu - nó còn giúp củng cố ký ức tích cực, tăng cường hệ miễn dịch, và cải thiện sức khỏe tinh thần tổng thể. Hãy trân trọng giai đoạn này, ghi nhớ những cảm giác tích cực, và sử dụng chúng như "nguồn năng lượng dự trữ" cho những lúc khó khăn. Đồng thời, hãy duy trì những thói quen, hoạt động, và mối quan hệ đang mang lại niềm vui này cho bạn.`],
      
        medium: [`Bạn đang có những trải nghiệm vui vẻ trong cuộc sống. Giấc mơ này cho thấy tâm trạng tích cực và cảm giác thoải mái - có thể từ những sự kiện nhỏ nhưng ý nghĩa, những mối quan hệ ấm áp, hoặc tiến triển tích cực trong công việc/học tập. Đây là dấu hiệu tốt cho thấy bạn đang đi đúng hướng, cuộc sống đang cân bằng hợp lý. Hạnh phúc không phải lúc nào cũng là những cảm xúc mãnh liệt - đôi khi chỉ là sự bình yên, hài lòng với những gì mình đang có. Hãy tiếp tục nuôi dưỡng những nguồn năng lượng tích cực này.`],
      
        low: [`Có những khoảnh khắc vui trong tâm trí bạn. Mặc dù có thể cuộc sống vẫn có những thách thức, nhưng bạn vẫn tìm được những điểm sáng nhỏ. Đây là khả năng phục hồi tuyệt vời - dấu hiệu của sức khỏe tinh thần tốt. Hãy chủ động tìm kiếm thêm những trải nghiệm tích cực, dù chỉ là những điều đơn giản, để tăng cường mức độ hạnh phúc tổng thể.`],
      },
      en: {
        high: [`This positive and joyful dream is a wonderful reflection of your healthy mental state! You are in a good phase of life - perhaps achieving accomplishments, happy relationships, or simply feeling satisfied with current life. When the brain is "filled" with positive emotions, it creates beautiful dreams like this. This is the result of stable serotonin (happiness hormone) and endorphin release. Happy dreams are not just pleasant experiences - they also help reinforce positive memories, boost the immune system, and improve overall mental health. Cherish this phase, remember the positive feelings, and use them as "reserve energy" for difficult times. Also, maintain the habits, activities, and relationships that are bringing you this joy.`],
        medium: [`You are having joyful experiences in life. This dream shows a positive mood and comfortable feeling - perhaps from small but meaningful events, warm relationships, or positive progress in work/studies. This is a good sign that you are going in the right direction, life is reasonably balanced. Happiness is not always intense emotions - sometimes it is just peace, contentment with what you have. Continue to nurture these positive energy sources.`],
        low: [`There are moments of joy in your mind. Although life may still have challenges, you still find small bright spots. This is wonderful resilience - a sign of good mental health. Proactively seek more positive experiences, even simple ones, to enhance overall happiness.`],
      },
    },
    
    neutral: {
      vi: {
        high: [`Giấc mơ của bạn không mang cảm xúc mạnh mẽ - đây là dấu hiệu của sự cân bằng và ổn định trong tinh thần. Não bộ đang ở trạng thái trung tính - không quá căng thẳng, không quá hưng phấn, chỉ đơn giản là xử lý thông tin và sắp xếp lại ký ức của ngày hôm đó. Điều này hoàn toàn lành mạnh và bình thường, thậm chí rất tích cực! Nó cho thấy bạn không đang phải đối phó với cảm xúc quá tải, mà đang sống trong trạng thái cân bằng, ổn định.`],
        medium: [`Giấc mơ khá bình thường, không có cảm xúc đặc biệt nổi bật. Đây là trạng thái phổ biến nhất của giấc mơ - não bộ đang xử lý những sự kiện hàng ngày mà không gắn với cảm xúc mạnh. Bạn đang sống trong trạng thái tương đối ổn định, không có biến động lớn về mặt cảm xúc.`],
        low: [`Giấc mơ có phần trung tính, không rõ ràng về cảm xúc. Đây có thể do não bộ đang xử lý nhiều loại thông tin khác nhau, hoặc đơn giản là bạn đang trong giai đoạn chuyển tiếp giữa các cảm xúc. Hoàn toàn bình thường.`],
      },
      en: {
        high: [`Your dream carries no strong emotions - this is a sign of balance and stability in your mental state. The brain is in neutral mode - not too stressed, not too excited, simply processing information and reorganizing memories from the day. This is completely healthy and normal, even very positive! It shows you are not dealing with emotional overload, but living in a balanced, stable state.`],
        medium: [`The dream is quite ordinary, without particularly prominent emotions. This is the most common dream state - the brain is processing daily events without strong emotional attachment. You are living in a relatively stable state, without major emotional fluctuations.`],
        low: [`The dream is somewhat neutral, emotions are not clear. This may be because the brain is processing many types of information, or simply you are in a transition phase between emotions. Completely normal.`],
      },
    },
    
    confusion: {
      vi: {
        high: [`Giấc mơ này phản ánh sự bối rối, mất phương hướng trong suy nghĩ và quyết định. Bạn có thể đang đối mặt với một tình huống phức tạp mà chưa tìm ra câu trả lời rõ ràng. ${
          keywords.lost.test(dreamText)
            ? 'Cảm giác lạc đường trong mơ là biểu tượng rất trực tiếp của việc bạn cảm thấy không biết nên đi về đâu trong cuộc sống.'
            : 'Giấc mơ hỗn loạn, không theo logic là dấu hiệu tâm trí đang quá tải thông tin.'
        } Đây là giai đoạn tự nhiên trong quá trình ra quyết định. Não bộ đang cân nhắc nhiều khả năng khác nhau.`],
        medium: [`Bạn đang có sự không chắc chắn về một số vấn đề trong cuộc sống. Có thể bạn đang trong giai đoạn chuyển tiếp, đối mặt với nhiều lựa chọn, hoặc nhận được các thông tin mâu thuẫn khiến khó quyết định. Hãy tạm dừng, thu thập thêm thông tin, và suy nghĩ cẩn thận trước khi hành động.`],
        low: [`Có chút bối rối nhẹ, có thể do những sự kiện không như kế hoạch hoặc nhận được thông tin mới. Đây là phản ứng tự nhiên khi gặp điều bất ngờ. Sự bối rối nhỏ này sẽ tự giải quyết khi bạn có thêm thời gian xử lý thông tin.`],
      },
      en: {
        high: [`This dream reflects confusion and loss of direction in thinking and decisions. You may be facing a complex situation without clear answers. ${
          keywords.lost.test(dreamText)
            ? 'Feeling lost in dreams is a very direct symbol of feeling uncertain about where to go in life.'
            : 'Chaotic, illogical dreams are signs the mind is overloaded with information.'
        } This is a natural stage in the decision-making process. The brain is weighing many different possibilities.`],
        medium: [`You have uncertainty about some issues in life. You may be in a transition phase, facing many choices, or receiving conflicting information that makes decisions difficult. Pause, gather more information, and think carefully before acting.`],
        low: [`Some mild confusion, possibly due to events not going as planned or receiving new information. This is a natural reaction to encountering the unexpected. This small confusion will resolve itself when you have more time to process information.`],
      },
    },
  };
  
  // Determine confidence level
  let level = 'low';
  if (confidence >= 80) level = 'high';
  else if (confidence >= 60) level = 'medium';
  
  // Get category data (bilingual structure)
  const categoryData = interpretations[category];
  if (!categoryData) {
    return language === 'vi' 
      ? 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.'
      : 'This dream reflects your current mental state.';
  }
  
  // Get language data
  const languageData = categoryData[language];
  if (!languageData) {
    // Fallback to Vietnamese if English not available
    const fallbackData = categoryData['vi'];
    if (!fallbackData) {
      return 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.';
    }
    const variants = fallbackData[level];
    if (Array.isArray(variants) && variants.length > 0) {
      return variants[Math.floor(Math.random() * variants.length)];
    }
    return variants || 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.';
  }
  
  // Get variants for this level
  const variants = languageData[level];
  
  // If variants is array → pick random; if string → return as-is
  if (Array.isArray(variants) && variants.length > 0) {
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
  
  return variants || (language === 'vi' 
    ? 'Giấc mơ này phản ánh trạng thái tinh thần hiện tại của bạn.'
    : 'This dream reflects your current mental state.');
}


//TIPS 
function generateTips(category) {
  const allTips = {
    stress: [
      'Thiền và thở sâu: Dành 10-15 phút mỗi ngày để thực hành mindfulness. Ngồi yên, tập trung vào hơi thở, để tâm trí được nghỉ ngơi.',
      'Viết nhật ký: Viết ra cảm xúc và suy nghĩ giúp "đổ" stress ra khỏi đầu. Không cần viết hay, chỉ cần thành thật.',
      'Vận động nhẹ nhàng: Đi bộ, yoga, hoặc stretching 20-30 phút giúp giải phóng endorphin - hormone hạnh phúc tự nhiên.',
      'Ngủ đủ giấc: Đảm bảo 7-8 tiếng mỗi đêm. Thiếu ngủ làm stress tăng gấp đôi. Tạo thói quen ngủ đúng giờ.',
      'Chia sẻ cảm xúc: Nói chuyện với người thân hoặc bạn bè tin tưởng. Đôi khi chỉ cần ai đó lắng nghe cũng đủ giảm gánh nặng.',
      'Nghỉ ngơi thường xuyên: Áp dụng quy tắc 52-17: Làm việc tập trung 52 phút, nghỉ 17 phút. Tránh làm việc liên tục nhiều giờ.',
      'Nhạc thư giãn: Nghe nhạc không lời, âm thanh thiên nhiên (sóng biển, mưa rừng) giúp giảm cortisol - hormone stress.',
    ],
    fear: [
      'Đối mặt từng bước: Chia nỗi sợ thành các bước nhỏ. Ví dụ sợ nói trước đám đông: bắt đầu với 2-3 người, rồi tăng dần.',
      'Kỹ thuật 5-4-3-2-1: Khi sợ hãi: kể 5 thứ nhìn thấy, 4 thứ chạm vào, 3 thứ nghe thấy, 2 thứ ngửi được, 1 thứ nếm được. Giúp grounding.',
      'Nhạc an thần: Nghe nhạc thư giãn trước khi ngủ giúp giảm ác mộng và cảm giác sợ hãi kéo dài từ giấc mơ.',
      'Nội dung tích cực: Đọc sách, xem phim truyền cảm hứng trước ngủ thay vì tin tức tiêu cực hoặc phim kinh dị.',
      'Hỗ trợ chuyên môn: Nếu nỗi sợ ảnh hưởng đến cuộc sống hàng ngày, hãy tìm gặp chuyên gia tâm lý để được hướng dẫn phù hợp.',
    ],
    anxiety: [
      'Lập kế hoạch cụ thể: Viết ra công việc/học tập cần làm, chia thành checklist nhỏ. Mỗi item hoàn thành = giảm lo lắng.',
      'Chia nhỏ mục tiêu: Mục tiêu lớn gây choáng ngợp. Chia thành 3-5 bước nhỏ, tập trung hoàn thành từng bước một.',
      'Kiểm soát được gì: Tập trung vào những gì trong tầm kiểm soát (chuẩn bị tốt), buông những gì không kiểm soát được (kết quả).',
      'Thở 4-7-8: Hít vào 4 giây, giữ 7 giây, thở ra 8 giây. Lặp lại 4 lần. Kích hoạt hệ thần kinh phó giao cảm, giảm lo âu ngay lập tức.',
      'Giảm stimulant: Hạn chế caffeine (cà phê, trà, năng lượng) và đường sau 2PM. Chúng làm lo âu tăng và khó ngủ.',
      'Brain dump: Viết ra TẤT CẢ lo lắng trong đầu (10-15 phút). "Đổ" ra giấy giúp não bộ nhẹ nhõm, không phải nhớ.',
      'Thói quen ngủ: Ngủ và dậy cùng giờ mỗi ngày (kể cả cuối tuần). Giúp cơ thể có rhythm ổn định, giảm lo âu.',
    ],
    sadness: [
      'Ánh sáng tự nhiên: Dành 15-30 phút ngoài trời mỗi ngày. Ánh sáng mặt trời tăng serotonin - chất chống trầm cảm tự nhiên.',
      'Hoạt động sáng tạo: Vẽ, viết, chơi nhạc, làm vườn... Sáng tạo giúp xử lý cảm xúc buồn một cách lành mạnh.',
      'Kết nối con người: Gọi điện, gặp mặt người thân yêu. Cô đơn làm buồn tăng. Kết nối là "thuốc" mạnh nhất.',
      'Nhật ký biết ơn: Mỗi tối viết 3 điều biết ơn trong ngày (dù nhỏ). Giúp não bộ tập trung vào tích cực thay vì tiêu cực.',
      'Vận động: Chạy bộ, gym, nhảy... bất kỳ hoạt động nào tăng nhịp tim. Endorphin từ vận động giảm buồn hiệu quả.',
      'Cho phép buồn: Đừng ép mình vui. Buồn là cảm xúc tự nhiên. Cho phép bản thân khóc, buồn một lúc, rồi từ từ vượt qua.',
    ],
    happy: [
      'Duy trì habits tốt: Ghi lại những hoạt động đang làm bạn hạnh phúc (thể thao, sở thích, gặp bạn...) và duy trì đều đặn.',
      'Lưu giữ kỷ niệm: Chụp ảnh, viết nhật ký, ghi âm... Khi khó khăn, xem lại sẽ giúp bạn nhớ rằng cuộc sống có nhiều điều tốt đẹp.',
      'Chia sẻ niềm vui: Kể cho người khác nghe điều tốt đẹp. Chia sẻ làm hạnh phúc tăng gấp đôi.',
      'Mục tiêu mới: Đặt mục tiêu phát triển (học kỹ năng, đi du lịch, làm dự án...). Có điều mong đợi giúp duy trì động lực.',
      'Hành động tử tế: Làm một điều tốt cho người khác mỗi ngày (khen, giúp đỡ, tặng quà nhỏ). Cho đi càng nhiều, nhận lại càng nhiều.',
    ],
    neutral: [
      'Thử nghiệm mới: Làm điều chưa từng làm (món ăn mới, đường đi mới, sở thích mới). Phá vỡ routine tạo sự thú vị.',
      'Học kỹ năng: Học ngôn ngữ, nhạc cụ, nấu ăn, code... Phát triển bản thân tạo ý nghĩa cho cuộc sống.',
      'Duy trì habits: Bạn đang ổn, hãy giữ vững thói quen tốt hiện tại (ngủ đủ, ăn healthy, vận động...).',
      'Micro goals: Đặt mục tiêu nhỏ hàng tuần (đọc 1 chương sách, chạy 5km, gọi 1 người bạn cũ...) để tạo động lực.',
      'Mindfulness: Tận hưởng những điều đơn giản: tách cà phê buổi sáng, ánh nắng chiều, cuộc gọi với người thân...',
    ],
    confusion: [
      'Mind mapping: Viết vấn đề ở giữa, vẽ các nhánh cho mỗi khía cạnh. Visualize giúp làm rõ suy nghĩ rối.',
      'Nói chuyện: Giải thích vấn đề cho người khác (hoặc nói to với bản thân). Quá trình diễn đạt giúp suy nghĩ rõ ràng hơn.',
      'Pause quyết định: Nếu bối rối, đừng quyết định gấp. Ngủ một đêm, suy nghĩ lại vào sáng hôm sau khi đầu óc tỉnh táo.',
      'Chia nhỏ vấn đề: Vấn đề phức tạp = nhiều vấn đề nhỏ. Giải quyết từng cái một, rồi ghép lại thành giải pháp tổng thể.',
      'Grounding: Thực hành mindfulness 10 phút/ngày. Tập trung vào hiện tại giúp giảm suy nghĩ rối bời về quá khứ/tương lai.',
      'Ưu tiên: Liệt kê tất cả, xếp hạng độ quan trọng. Tập trung vào top 3, bỏ qua phần còn lại tạm thời.',
    ],
  };
  
  const categoryTips = allTips[category];
  // Shuffle và lấy 3-4 tips ngẫu nhiên
  const shuffled = [...categoryTips].sort(() => Math.random() - 0.5);
  const numTips = Math.min(4, categoryTips.length);
  return shuffled.slice(0, numTips).join('\n\n');
}

//ANALYZE DREAM
export const analyzeDream = async (req, res, next) => {
  try {
    const dreamText = req.body.dreamText || req.body.dream;
    const userId = req.user._id;
    
    // Validate
    if (!dreamText || dreamText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Dream text must be at least 10 characters',
      });
    }
    
    if (dreamText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Dream text cannot exceed 2000 characters',
      });
    }
    
    // Predict
    const prediction = await predictCategory(dreamText);
    
    // Generate interpretation & tips (truyền dreamText để phân tích từ khóa)
    const interpretation = generateInterpretation(prediction.category, prediction.confidence, dreamText);
    const tips = generateTips(prediction.category);
    
    // Save to database
    const dream = await Dream.create({
      userId,
      dreamText: dreamText.trim(),
      category: prediction.category,
      confidence: prediction.confidence,
      probabilities: {
        stress: prediction.probabilities.stress / 100,
        fear: prediction.probabilities.fear / 100,
        anxiety: prediction.probabilities.anxiety / 100,
        sadness: prediction.probabilities.sadness / 100,
        happy: prediction.probabilities.happy / 100,
        neutral: prediction.probabilities.neutral / 100,
        confusion: prediction.probabilities.confusion / 100,
      },
      interpretation,
      tips,
    });
    
    res.status(201).json({
      success: true,
      data: {
        _id: dream._id,
        category: dream.category,
        confidence: dream.confidence,
        probabilities: prediction.probabilities,
        interpretation: dream.interpretation,
        tips: dream.tips,
        analyzedAt: dream.analyzedAt,
      },
      message: 'Dream analyzed successfully',
    });
  } catch (error) {
    next(error);
  }
};

//GET DREAM HISTORY
export const getDreamHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, category } = req.query;
    
    const query = { userId };
    if (category) {
      query.category = category;
    }
    
    const dreams = await Dream.find(query)
      .sort({ analyzedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const count = await Dream.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: dreams,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

//GET DREAM STATS
export const getDreamStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Total dreams
    const totalDreams = await Dream.countDocuments({ userId });
    
    // Category distribution
    const categoryStats = await Dream.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
      { $sort: { count: -1 } },
    ]);
    
    // Recent trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDreams = await Dream.countDocuments({
      userId,
      analyzedAt: { $gte: thirtyDaysAgo },
    });
    
    // Most common category
    const mostCommon = categoryStats.length > 0 ? categoryStats[0]._id : null;
    
    res.status(200).json({
      success: true,
      data: {
        totalDreams,
        recentDreams,
        mostCommonCategory: mostCommon,
        categoryDistribution: categoryStats.map(stat => ({
          category: stat._id,
          count: stat.count,
          percentage: ((stat.count / totalDreams) * 100).toFixed(1),
          avgConfidence: stat.avgConfidence.toFixed(2),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};


//GET SINGLE DREAM
export const getDream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const dream = await Dream.findOne({ _id: id, userId }).select('-__v');
    
    if (!dream) {
      return res.status(404).json({
        success: false,
        message: 'Dream not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: dream,
    });
  } catch (error) {
    next(error);
  }
};


//DELETE DREAM
export const deleteDream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const dream = await Dream.findOneAndDelete({ _id: id, userId });
    
    if (!dream) {
      return res.status(404).json({
        success: false,
        message: 'Dream not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Dream deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

//GET RETRAINING STATS
export const getRetrainingStats = async (req, res, next) => {
  try {
    const totalDreams = await Dream.countDocuments();
    const needsRetraining = await Dream.countDocuments({ needsRetraining: true });
    const alreadyTrained = await Dream.countDocuments({ needsRetraining: false });
    
    // Get last trained dream
    const lastTrained = await Dream.findOne({ needsRetraining: false })
      .sort({ lastTrainedAt: -1 })
      .select('lastTrainedAt')
      .lean();
    
    // Count by category for new dreams
    const categoryBreakdown = await Dream.aggregate([
      { $match: { needsRetraining: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count by language for new dreams
    const vietnameseDreams = await Dream.countDocuments({
      needsRetraining: true,
      dreamText: { $regex: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i }
    });
    
    const englishDreams = needsRetraining - vietnameseDreams;
    
    res.status(200).json({
      success: true,
      data: {
        total: totalDreams,
        needsRetraining,
        alreadyTrained,
        percentage: totalDreams > 0 ? ((needsRetraining / totalDreams) * 100).toFixed(2) : 0,
        lastTrainedAt: lastTrained?.lastTrainedAt || null,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c._id,
          count: c.count
        })),
        languageBreakdown: {
          vietnamese: vietnameseDreams,
          english: englishDreams
        },
        recommendation: needsRetraining >= 100 ? 
          'Recommended to train new model - sufficient new data available' :
          `Need ${100 - needsRetraining} more dreams before retraining`
      }
    });
  } catch (error) {
    next(error);
  }
};

//MANUAL TRIGGER EXPORT
export const manualExportDreams = async (req, res, next) => {
  try {
    const { exportNewDreamsForTraining } = await import('../jobs/dailyModelRetraining.js');
    
    const result = await exportNewDreamsForTraining();
    
    res.status(200).json({
      success: true,
      message: 'Dreams exported successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

//MANUAL TRIGGER MERGE
export const manualMergeData = async (req, res, next) => {
  try {
    const { mergeTrainingData } = await import('../jobs/dailyModelRetraining.js');
    
    const result = await mergeTrainingData();
    
    res.status(200).json({
      success: true,
      message: 'Training data merged successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
