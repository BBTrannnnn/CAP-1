import axios from 'axios';
import { chat } from './llmService.js';

// ========== CONFIG ==========
const SYSTEM_PROMPT = `
Bạn là Content Moderator mạng xã hội Việt Nam. Nhiệm vụ:
1. Chặn chửi thề, xúc phạm, thù ghét (kể cả viết tắt: vl, dm, dcm, đụ...).
2. Phân biệt ngữ cảnh: "Con chó này khôn" (OK) vs "Mày là chó" (BLOCK).
3. Trả về JSON duy nhất: { "blocked": boolean, "score": number, "reason": string | null }
`;

// ========== 1. TEXT MODERATION (Sightengine + OpenAI) ==========
export async function checkTextProfanity(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return { blocked: false, score: 0, reason: null, matches: [] };
    }
    // Sightengine
    const API_USER = process.env.SIGHTENGINE_USER;
    const API_SECRET = process.env.SIGHTENGINE_SECRET;
    let sightResult = { blocked: false };
    if (API_USER && API_SECRET) {
        try {
            const response = await axios.get('https://api.sightengine.com/1.0/text/check.json', {
                params: {
                    text: text,
                    lang: 'en,vi',
                    mode: 'standard',
                    api_user: API_USER,
                    api_secret: API_SECRET
                },
                timeout: 5000
            });
            const data = response.data;
            if (data.status !== 'failure') {
                const matches = data.profanity?.matches || [];
                if (matches.length > 0) {
                    const badWord = matches[0].match;
                    sightResult = {
                        blocked: true,
                        score: 100,
                        reason: `Ngôn từ không phù hợp: "${badWord}"`,
                        matches: matches.map(m => ({ word: m.match, type: m.type, intensity: m.intensity }))
                    };
                }
            }
        } catch (error) {
            console.error('Sightengine Text Moderation Error:', error.message);
        }
    }
    // OpenAI
    let openaiResult = { blocked: false };
    try {
        const messages = [
            { role: "system", content: "Bạn là Content Moderator mạng xã hội Việt Nam. Chặn chửi thề, xúc phạm, thù ghét, bạo lực, từ nhạy cảm, phân biệt ngữ cảnh. Trả về JSON duy nhất: { blocked: boolean, score: number, reason: string | null }" },
            { role: "user", content: `Kiểm tra: "${text}"` }
        ];
        const { text: resultText } = await chat(messages, {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0,
            response_format: { type: "json_object" }
        });
        const result = JSON.parse(resultText);
        openaiResult = {
            blocked: result.blocked,
            score: result.score || (result.blocked ? 100 : 0),
            reason: result.reason,
            matches: []
        };
    } catch (error) {
        console.error('OpenAI Text Moderation Error:', error.message);
    }
    // Nếu một trong hai blocked thì blocked
    if (sightResult.blocked) return sightResult;
    if (openaiResult.blocked) return openaiResult;
    return { blocked: false, score: 0, reason: null, matches: [] };
}

// ========== 2. URL VALIDATION ==========
const BLACKLISTED_DOMAINS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'];

export function checkUrls(text) {
    if (!text || typeof text !== 'string') return { blocked: false, urls: [] };
    
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex) || [];
    
    // Rule 1: Quá nhiều link -> Spam
    if (urls.length > 3) return { blocked: true, reason: 'Quá nhiều links', urls };
    
    // Rule 2: Link rút gọn hoặc đen
    for (const url of urls) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            if (BLACKLISTED_DOMAINS.some(domain => hostname.includes(domain))) {
                return { blocked: true, reason: 'Link rút gọn không an toàn', urls };
            }
        } catch (e) { 
            return { blocked: true, reason: 'Link lỗi định dạng', urls }; 
        }
    }
    return { blocked: false, urls };
}

// ========== 3. SPAM DETECTION (Duplicate Content) ==========
const recentPosts = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 phút

export function checkDuplicateContent(userId, content) {
    if (!userId || !content) return { blocked: false };
    
    const userPosts = recentPosts.get(userId) || [];
    const now = Date.now();
    
    // Lọc bỏ bài cũ quá 10 phút
    const validPosts = userPosts.filter(p => (now - p.timestamp) < CACHE_DURATION);
    
    // Check trùng khớp hoàn toàn
    const exactMatch = validPosts.find(p => p.content === content);
    
    if (exactMatch) {
        return { blocked: true, reason: 'Spam nội dung trùng lặp', similarity: 100 };
    }
    
    // Cập nhật cache
    validPosts.push({ content, timestamp: now });
    recentPosts.set(userId, validPosts);
    
    return { blocked: false, similarity: 0 };
}

export function clearSpamCache(userId) {
    if (recentPosts.has(userId)) recentPosts.delete(userId);
}

// ========== 4. IMAGE MODERATION (Sightengine + OpenAI) ==========
export async function loadNSFWModel() {
    console.log('✅ Image moderation: Sightengine + OpenAI enabled');
    return true;
}
async function checkImageWithSightengine(imageUrl) {
    const API_USER = process.env.SIGHTENGINE_USER;
    const API_SECRET = process.env.SIGHTENGINE_SECRET;
    if (!API_USER || !API_SECRET) return null;
    try {
        const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
                url: imageUrl,
                models: 'nudity,wad,offensive',
                api_user: API_USER,
                api_secret: API_SECRET
            },
            timeout: 10000
        });
        const data = response.data;
        if (data.status === 'failure') return null;
        const nudityScore = data.nudity?.sexual || 0;
        const partialScore = data.nudity?.partial || 0;
        const weaponScore = data.weapon || 0;
        const drugsScore = data.drugs || 0;
        const offensiveScore = data.offensive?.prob || 0;
        const isNudity = nudityScore > 0.6 || partialScore > 0.8;
        const isDangerous = weaponScore > 0.6 || drugsScore > 0.6;
        const isOffensive = offensiveScore > 0.8;
        let reason = '';
        if (isNudity) reason = 'Ảnh chứa nội dung nhạy cảm/khỏa thân';
        else if (isDangerous) reason = 'Ảnh chứa vũ khí hoặc chất cấm';
        else if (isOffensive) reason = 'Ảnh chứa nội dung xúc phạm';
        return {
            blocked: isNudity || isDangerous || isOffensive,
            reason,
            scores: {
                sexual: nudityScore,
                weapon: weaponScore,
                offensive: offensiveScore
            },
            source: 'sightengine'
        };
    } catch (error) {
        console.warn('Sightengine Image API error:', error.message);
        return null;
    }
}
async function checkImageWithOpenAI(imageUrl) {
    const API_KEY = process.env.OPENAI_API_KEY;
    if (!API_KEY) return null;
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/moderations',
            { model: 'omni-moderation-latest', input: [{ type: 'image_url', image_url: { url: imageUrl } }] },
            { headers: { 'Authorization': `Bearer ${API_KEY}` }, timeout: 20000 }
        );
        const res = response.data.results[0];
        if (res.flagged) {
            const reasons = Object.keys(res.categories).filter(k => res.categories[k]).join(', ');
            return {
                blocked: true,
                reason: reasons,
                scores: res.category_scores,
                source: 'openai'
            };
        }
        return { blocked: false };
    } catch (error) {
        console.warn('OpenAI Image Moderation Error:', error.message);
        return null;
    }
}
export async function checkImageNSFW(imageUrl) {
    if (!imageUrl) return { blocked: false };
    const sightResult = await checkImageWithSightengine(imageUrl);
    const openaiResult = await checkImageWithOpenAI(imageUrl);
    if (sightResult && sightResult.blocked) return sightResult;
    if (openaiResult && openaiResult.blocked) return openaiResult;
    return { blocked: false, needsReview: false, autoCheckPassed: true };
}
export async function checkImagesNSFW(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return { blocked: false, results: [] };
    const results = [];
    let anyBlocked = false;
    for (const url of imageUrls) {
        const result = await checkImageNSFW(url);
        results.push({ url, ...result });
        if (result.blocked) {
            anyBlocked = true;
            break;
        }
    }
    return {
        blocked: anyBlocked,
        reason: anyBlocked ? results.find(r => r.blocked).reason : null,
        results
    };
}

// ========== EXPORT ==========
export default { 
    checkTextProfanity, 
    checkUrls, 
    checkDuplicateContent, 
    clearSpamCache, 
    loadNSFWModel, 
    checkImageNSFW, 
    checkImagesNSFW 
};