import { chat } from '../services/llmService.js';
import Dream from '../models/Dream.js'; 

// --- 1. PHÂN TÍCH GIẤC MƠ (DÙNG HYBRID AI) ---
export const analyzeDream = async (req, res, next) => {
  try {
    const dreamText = req.body.dreamText || req.body.dream;
    const userId = req.user._id;

    // Validate đầu vào
    if (!dreamText || dreamText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung giấc mơ quá ngắn, hãy kể chi tiết hơn.',
      });
    }

    console.log(`[DreamController] 🚀 Đang gửi giấc mơ sang AI Server (Kaggle)...`);

    // GỌI LLM SERVICE
    // Quan trọng: Truyền { provider: 'local' } để nó dùng link Ngrok/Kaggle
    const messages = [{ role: 'user', content: dreamText }];
    
    let interpretation = '';
    try {
        const aiResponse = await chat(messages, { 
            provider: 'local', // <--- Ép dùng model Mistral của bạn
            temperature: 0.7 
        });
        interpretation = aiResponse.text;
    } catch (err) {
        console.error("Lỗi gọi AI:", err.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Không kết nối được với Thầy Bói AI (Server Kaggle). Hãy kiểm tra lại link Ngrok.' 
        });
    }

    // TỰ ĐỘNG PHÂN LOẠI CẢM XÚC (ĐỂ HIỆN LÊN APP)
    // Vì model Mistral trả về văn bản, ta dùng từ khóa để gán nhãn cho đẹp đội hình
    let category = 'neutral';
    const textToCheck = (dreamText + " " + interpretation).toLowerCase();
    
    if (textToCheck.match(/sợ|ma|quỷ|đuổi|ác mộng|hãi|lo sợ|fear|chết/)) category = 'fear';
    else if (textToCheck.match(/buồn|khóc|mất mát|chia ly|cô đơn|sad|đau khổ/)) category = 'sadness';
    else if (textToCheck.match(/vui|hạnh phúc|cười|may mắn|tài lộc|happy|yêu/)) category = 'happy';
    else if (textToCheck.match(/lo lắng|căng thẳng|áp lực|thi cử|muộn|stress|bận/)) category = 'stress'; // hoặc 'anxiety' tùy enum của bạn
    else if (textToCheck.match(/lạ|mơ hồ|rối|không hiểu|confusion|kỳ quặc/)) category = 'confusion';

    // LƯU VÀO DB
    const newDream = await Dream.create({
      userId,
      dreamText: dreamText.trim(),
      interpretation: interpretation, // Lời giải mã từ AI
      category: category, 
      confidence: 90, // Model Fine-tune nên độ tin cậy cao
      analyzedAt: new Date()
    });

    console.log("✅ Đã giải mã & lưu xong:", newDream._id);

    // TRẢ VỀ CHO APP
    res.status(201).json({
      success: true,
      data: newDream,
      message: 'Giải mã giấc mơ thành công!',
    });

  } catch (error) {
    console.error("❌ Lỗi Controller:", error);
    next(error);
  }
};

// --- 2. CÁC HÀM CŨ (GIỮ NGUYÊN ĐỂ APP KHÔNG BỊ LỖI) ---

export const getDreamHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, category } = req.query;
    
    const query = { userId };
    if (category) query.category = category;
    
    const dreams = await Dream.find(query)
      .sort({ analyzedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
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
  } catch (error) { next(error); }
};

export const getDreamStats = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const totalDreams = await Dream.countDocuments({ userId });
      const categoryStats = await Dream.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
        { $sort: { count: -1 } },
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          totalDreams,
          categoryDistribution: categoryStats.map(stat => ({
            category: stat._id,
            count: stat.count,
            percentage: totalDreams ? ((stat.count / totalDreams) * 100).toFixed(1) : 0,
          })),
        },
      });
    } catch (error) { next(error); }
};

export const getDream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const dream = await Dream.findOne({ _id: id, userId });
    if (!dream) return res.status(404).json({ success: false, message: 'Dream not found' });
    res.status(200).json({ success: true, data: dream });
  } catch (error) { next(error); }
};

export const deleteDream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const dream = await Dream.findOneAndDelete({ _id: id, userId });
    if (!dream) return res.status(404).json({ success: false, message: 'Dream not found' });
    res.status(200).json({ success: true, message: 'Dream deleted' });
  } catch (error) { next(error); }
};

// Các hàm phụ trợ khác nếu cần giữ lại để tránh lỗi import ở nơi khác
export const getRetrainingStats = async (req, res) => res.json({ success: true, message: "Disabled in hybrid mode" });
export const manualExportDreams = async (req, res) => res.json({ success: true, message: "Disabled in hybrid mode" });
export const manualMergeData = async (req, res) => res.json({ success: true, message: "Disabled in hybrid mode" });