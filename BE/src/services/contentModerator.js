import stringSimilarity from 'string-similarity';
import axios from 'axios';
import sharp from 'sharp';

// ========== TEXT MODERATION (100% API) ==========

/**
 * Check text for profanity using Sightengine API
 * @param {string} text - Text to check
 * @returns {Promise<Object>} { blocked: boolean, score: number, reason: string, matches: array }
 */
export async function checkTextProfanity(text) {
    // 1. Kiểm tra đầu vào
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return { blocked: false, score: 0, reason: null, matches: [] };
    }

    // 2. Lấy Key
    const API_USER = process.env.SIGHTENGINE_USER;
    const API_SECRET = process.env.SIGHTENGINE_SECRET;

    if (!API_USER || !API_SECRET) {
        console.warn('⚠️ Sightengine Keys missing. Skipping text moderation.');
        return { blocked: false };
    }

    try {
        // 3. Gọi API (Standard Mode - Hỗ trợ đa ngôn ngữ bao gồm tiếng Việt)
        const response = await axios.get('https://api.sightengine.com/1.0/text/check.json', {
            params: {
                text: text,
                lang: 'en,vi', // Ưu tiên tiếng Anh và Việt
                mode: 'standard',
                api_user: API_USER,
                api_secret: API_SECRET
            },
            timeout: 5000 // Timeout 5s
        });

        const data = response.data;

        // 4. Xử lý lỗi API
        if (data.status === 'failure') {
            console.error('Sightengine API Error:', data.error);
            return { blocked: false };
        }

        // 5. Kiểm tra kết quả (Profanity)
        const matches = data.profanity?.matches || [];
        
        if (matches.length > 0) {
            // Lấy từ vi phạm đầu tiên để báo lỗi
            const badWord = matches[0].match;
            return {
                blocked: true,
                score: 100, // API bắt được thì tính là 100 điểm
                reason: `Ngôn từ không phù hợp: "${badWord}"`,
                matches: matches.map(m => ({ 
                    word: m.match, 
                    type: m.type,
                    intensity: m.intensity 
                }))
            };
        }

        // Optional: Kiểm tra thông tin cá nhân (Email/Phone) nếu muốn
        // if (data.personal && (data.personal.email || data.personal.phone_number)) ...

        // Sạch
        return { blocked: false, score: 0, reason: null, matches: [] };

    } catch (error) {
        console.error('Text Moderation Error:', error.message);
        // Lỗi mạng -> Cho qua để không chặn user oan (Fail-open)
        return { blocked: false, reason: 'Lỗi kiểm duyệt' };
    }
}

// ========== URL VALIDATION ==========
// (Giữ lại logic check link này vì nó nhanh và không tốn tiền API)

const BLACKLISTED_DOMAINS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'adf.ly', 'bc.vc', 'ouo.io',
];

export function checkUrls(text) {
    if (!text || typeof text !== 'string') return { blocked: false, urls: [] };

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex) || [];

    if (urls.length === 0) return { blocked: false, urls: [] };
    if (urls.length > 3) return { blocked: true, reason: 'Bài viết chứa quá nhiều links (tối đa 3)', urls };

    for (const url of urls) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            if (BLACKLISTED_DOMAINS.some(domain => hostname.includes(domain))) {
                return { blocked: true, reason: 'Bài viết chứa link rút gọn không an toàn', urls };
            }
        } catch (e) {
            return { blocked: true, reason: 'Link không hợp lệ', urls };
        }
    }
    return { blocked: false, urls };
}

// ========== SPAM DETECTION ==========
// (Giữ lại logic check spam trùng lặp)

const recentPosts = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function checkDuplicateContent(userId, content) {
    if (!userId || !content) return { blocked: false };

    const userPosts = recentPosts.get(userId) || [];
    const now = Date.now();
    const validPosts = userPosts.filter(p => (now - p.timestamp) < CACHE_DURATION);

    const exactMatch = validPosts.find(p => p.content === content);
    if (exactMatch) {
        return { blocked: true, reason: 'Nội dung trùng lặp với bài viết trước', similarity: 100 };
    }

    for (const post of validPosts) {
        const similarity = stringSimilarity.compareTwoStrings(content, post.content);
        if (similarity > 0.85) {
            return { blocked: true, reason: 'Nội dung quá giống với bài viết trước', similarity: Math.round(similarity * 100) };
        }
    }

    validPosts.push({ content, timestamp: now });
    recentPosts.set(userId, validPosts);
    if (recentPosts.size > 1000) recentPosts.delete(recentPosts.keys().next().value);

    return { blocked: false, similarity: 0 };
}

export function clearSpamCache(userId) {
    if (recentPosts.has(userId)) {
        const posts = recentPosts.get(userId);
        recentPosts.set(userId, posts.slice(-1));
    }
}

// ========== IMAGE MODERATION (Sightengine API) ==========

export async function loadNSFWModel() {
    console.log('✅ Image moderation: Sightengine API enabled');
    return true;
}

// Hàm gọi API check ảnh
async function checkImageWithSightengine(imageUrl) {
    const API_USER = process.env.SIGHTENGINE_USER;
    const API_SECRET = process.env.SIGHTENGINE_SECRET;

    if (!API_USER || !API_SECRET) return null;

    try {
        const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
                url: imageUrl,
                models: 'nudity,wad,offensive', // Check: Khỏa thân, Vũ khí/Rượu/Thuốc, Phản cảm
                api_user: API_USER,
                api_secret: API_SECRET
            },
            timeout: 10000 // 10s cho ảnh
        });

        const data = response.data;
        if (data.status === 'failure') return null;

        // 1. Nudity
        const nudityScore = data.nudity?.sexual || 0;
        const partialScore = data.nudity?.partial || 0;
        
        // 2. WAD
        const weaponScore = data.weapon || 0;
        const drugsScore = data.drugs || 0;
        
        // 3. Offensive
        const offensiveScore = data.offensive?.prob || 0;

        // Logic chặn
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

// Wrapper cho check 1 ảnh
export async function checkImageNSFW(imageUrl) {
    if (!imageUrl) return { blocked: false };
    
    // Gọi API trực tiếp
    const apiResult = await checkImageWithSightengine(imageUrl);

    if (apiResult && apiResult.blocked) {
        return {
            blocked: true,
            needsReview: false,
            reason: apiResult.reason,
            scores: apiResult.scores
        };
    }

    return { blocked: false, needsReview: false, autoCheckPassed: true };
}

// Wrapper cho check nhiều ảnh
export async function checkImagesNSFW(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return { blocked: false, results: [] };

    const results = [];
    let anyBlocked = false;

    for (const url of imageUrls) {
        const result = await checkImageNSFW(url);
        results.push({ url, ...result });

        if (result.blocked) {
            anyBlocked = true;
            break; // Chặn ngay nếu thấy 1 ảnh vi phạm
        }
    }

    return {
        blocked: anyBlocked,
        reason: anyBlocked ? results.find(r => r.blocked).reason : null,
        results
    };
}

export default {
    checkTextProfanity,
    checkUrls,
    checkDuplicateContent,
    clearSpamCache,
    loadNSFWModel,
    checkImageNSFW,
    checkImagesNSFW
};