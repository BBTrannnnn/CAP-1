import { chat as llmChat } from '../services/llmService.js';
import SleepLog from '../models/SleepLog.js';
import Note from '../models/Note.js';
import mongoose from 'mongoose';

const USE_FALLBACK = String(process.env.AI_FALLBACK_ON_ERROR || '').toLowerCase() === 'true';

function fallbackChat(language = 'vi') {
  return language === 'vi'
    ? 'Chatbot đang quá tải. Mẹo nhanh: thử hít 4s, giữ 7s, thở 8s trong 3–5 vòng để thư giãn.'
    : 'Chatbot limit. Quick tip: try 4-7-8 breathing for 3–5 rounds to relax.';
}

const MAX_LEN = 5000;

const getUserId = (req) => req.user?._id?.toString?.() || req.user?.id;

const toObjectId = (id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null);

const fmtHM = (mins) => {
  if (!mins && mins !== 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m.toString().padStart(2,'0')}`;
};

export async function chat(req, res, next) {
  try {
    const { messages, language = 'vi' } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages must be non-empty array' });
    }
    const trimmed = messages.slice(-15).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || m.text || '').slice(0, MAX_LEN)
    }));

    // Lấy note gần nhất của user (nếu có)
    const userId = toObjectId(getUserId(req));
    if (userId) {
      const note = await Note.findOne({ userId }).sort({ date: -1 }).lean();
      if (note && note.content) {
        return res.json({ success: true, reply: note.content });
      }
    }

    // ===== LẤY SLEEP LOGS VÀ NOTES CỦA USER (như cũ) =====
    let sleepContext = '';
    if (userId) {
      try {
        const now = Date.now();
        const cutoff = new Date(now - 7 * 864e5); // 7 ngày
        const logs = await SleepLog.find({ 
          userId, 
          wakeAt: { $gte: cutoff } 
        })
          .sort({ wakeAt: -1 })
          .limit(10)
          .lean();
        if (logs.length > 0) {
          sleepContext = '\n\n NHẬT KÝ GIẤC NGỦ GẦN ĐÂY CỦA NGƯỜI DÙNG:\n';
          logs.forEach(log => {
            const sleepDate = new Date(log.sleepAt).toLocaleString('vi-VN', { 
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
            });
            const wakeDate = new Date(log.wakeAt).toLocaleString('vi-VN', { 
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
            });
            const duration = fmtHM(log.durationMin);
            sleepContext += `\n ${sleepDate} → ${wakeDate} (${duration})`;
            sleepContext += '\n';
          });
          sleepContext += '\n---\n';
        }
        // Lấy 5 notes gần nhất (7 ngày)
        const notes = await Note.find({
          userId,
          date: { $gte: cutoff }
        })
          .sort({ date: -1 })
          .limit(5)
          .lean();
        if (notes.length > 0) {
          sleepContext += '\n NHẬT KÝ CẢM XÚC/GHI CHÚ GẦN ĐÂY:\n';
          notes.forEach(note => {
            const noteDate = new Date(note.date).toLocaleString('vi-VN', { 
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
            });
            let content = note.content || '';
            if (content.length > 300) content = content.slice(0, 300) + '...';
            sleepContext += `\n ${noteDate}: ${content}`;
          });
          sleepContext += '\n---\n';
        }
      } catch (err) {
        console.error(' Lỗi khi fetch sleep logs/notes:', err);
      }
    }
    const system = {
      role: 'system',
      content: [
        'Bạn là trợ lý giấc ngủ FlowState: trò chuyện như bạn bè, lịch sự, hữu ích, sẵn sàng tâm sự, Không nói quá ngắn cục súc.',
        'Có thể kể chuyện ru ngủ, thiền 4-7-8, mẹo vệ sinh giấc ngủ.',
        'Không chẩn đoán bệnh; khuyến khích gặp chuyên gia khi cần.',
        'Ứng dụng giúp tạo thói quen tốt, hỗ trợ tâm lý, cải thiện giấc ngủ.',
        `Trả lời bằng ngôn ngữ: ${language}.`,
        sleepContext 
      ].join(' ')
    };
    const { text } = await llmChat([system, ...trimmed], { max_tokens: 550 });
    res.json({ success: true, reply: text });
  } catch (err) {
    if ((err?.statusCode === 429 || err?.statusCode === 503) && USE_FALLBACK) {
      const { language = 'vi' } = req.body || {};
      return res.json({ success: true, reply: fallbackChat(language), _fallback: true });
    }
    if (err?.statusCode === 429) {
      return res.status(429).json({ success: false, message: 'AI quota exceeded. Please try later.' });
    }
    next(err);
  }
}