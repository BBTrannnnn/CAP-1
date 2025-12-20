import OpenAI from 'openai';
import axios from 'axios'; 

// --- CẤU HÌNH ---
// 1. Link AI của bạn (Kaggle/Ngrok)
const LOCAL_API_URL = 'https://lakier-jewell-nonhygroscopically.ngrok-free.dev/analyze'; // Thay bằng link của bạn

// 2. Cấu hình OpenAI (Mặc định cho Chatbot)
const DEFAULT_PROVIDER = process.env.LLM_PROVIDER || 'openai'; 
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('[LLM] Thiếu OPENAI_API_KEY. Chatbot sẽ không hoạt động.');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hàm Chat Đa Năng
 * - Chatbot thường: Không truyền gì -> Tự dùng OpenAI.
 * - Giải mã giấc mơ: Truyền { provider: 'local' } -> Dùng model của bạn.
 */
export async function chat(messages, opts = {}) {
  // Mặc định dùng OpenAI, trừ khi được chỉ định 'local'
  const provider = opts.provider || 'openai';

  // === TRƯỜNG HỢP 1: DÙNG MODEL CỦA BẠN (Kaggle) ===
  if (provider === 'local') {
    try {
      const userMessage = messages.find(m => m.role === 'user')?.content || '';
      if (!userMessage) throw new Error("Nội dung tin nhắn trống");

      console.log(`[LLM-Local] 🔮 Đang gửi sang Kaggle: "${userMessage.substring(0, 30)}..."`);
      
      const response = await axios.post(LOCAL_API_URL, {
        dream: userMessage
      });

      return { text: response.data.result || '' };
    } catch (e) {
      console.error('❌ [LLM-Local] Lỗi kết nối Kaggle:', e.message);
      throw new Error('AI Server (Kaggle) đang tắt hoặc bị lỗi kết nối.');
    }
  }

  // === TRƯỜNG HỢP 2: DÙNG OPENAI (Cho Chatbot) ===
  if (provider === 'openai') {
    if (!openaiClient) throw new Error('Chưa cấu hình OpenAI API Key.');

    const model = opts.model || DEFAULT_OPENAI_MODEL;
    const maxRetries = opts.maxRetries || 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await openaiClient.chat.completions.create({
          model,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.max_tokens ?? 500,
        });
        const text = res?.choices?.[0]?.message?.content?.trim() || '';
        return { text, raw: res };
      } catch (e) {
        if (e?.status === 429 && attempt < maxRetries) {
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        throw e;
      }
    }
  }
}

// Hàm này giữ nguyên dùng OpenAI để xử lý JSON cho chuẩn
export async function structuredJSON(prompt, schemaHint, opts = {}) {
  const sys = 'You are a JSON-only assistant. Always reply with valid JSON only.';
  const messages = [
    { role: 'system', content: sys },
    { role: 'user', content: `${prompt}\n\nReturn JSON with this shape: ${schemaHint}` },
  ];
  // Luôn ép dùng OpenAI cho hàm này
  const { text } = await chat(messages, { ...opts, provider: 'openai', temperature: 0.2 });
  try {
    const cleaned = text.replace(/^```json\n?|```$/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { _raw: text, error: 'JSON_PARSE_ERROR' };
  }
}

export default { chat, structuredJSON };