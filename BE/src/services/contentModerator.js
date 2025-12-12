// Content Moderation Service
// Handles text profanity detection and AI-based image moderation

import stringSimilarity from 'string-similarity';
import axios from 'axios';
import sharp from 'sharp';

// ========== TEXT MODERATION ==========

// Vietnamese profanity patterns (Tier 1: Severe - auto block)
const SEVERE_PROFANITY_PATTERNS = [
    /đ[ịiíìỉĩ\*\.\s]*t\s*m[ẹeéèẻẽ\*\.\s]*[^a-z]/gi,           // đit mẹ
    /c[ặaáàảãạ\*\.\s]*c\s*[^a-z]/gi,                           // cặc, c*c
    /l[ồoóòỏõọ\*\.\s]*n\s*[^a-z]/gi,                           // lồn, l*n
    /bu[ồoóòỏõọ\*\.\s]*i\s*[^a-z]/gi,                          // buồi
    /đ[ĩiíìỉ\*\.\s]*\s*đ[iíìỉĩ\*\.\s]*[êế]m/gi,               // đĩ điếm
    /m[ẹeéèẻẽ\*\.\s]*\s*m[áàảãạ\*\.\s]*y/gi,                  // mẹ mày
    /đ[ụuúùủũ\*\.\s]*\s*m[áàảãạ\*\.\s]*[^a-z]/gi,             // địt má
    /v[cklồ]\s*l[^a-z]/gi,                                      // vcl, vkl
];

// Moderate profanity (Tier 2: Warning - needs review if multiple)
const MODERATE_PROFANITY_PATTERNS = [
    /n[gđ][uủú][^a-z]/gi,                                       // ngu
    /[đd][iíìỉĩ][êế]n\s*[^a-z]/gi,                              // điên
    /ch[óoồ]\s*[^a-z]/gi,                                       // chó
    /n[gđ][uủú]\s*[đd][ốoồ]\s*[^a-z]/gi,                       // ngu đần
    /th[ằa]ng\s*n[gđ][uủú]/gi,                                  // thằng ngu
];

// English profanity
const ENGLISH_PROFANITY_PATTERNS = [
    /\bf+u+c+k+\w*\b/gi,
    /\bs+h+i+t+\w*\b/gi,
    /\bb+i+t+c+h+\w*\b/gi,
    /\ba+s+s+h+o+l+e+\b/gi,
    /\bc+u+n+t+\b/gi,
    /\bd+a+m+n+\b/gi,
];

/**
 * Check text for profanity
 * @param {string} text - Text to check
 * @returns {Object} { blocked: boolean, score: number (0-100), reason: string, matches: array }
 */
export function checkTextProfanity(text) {
    if (!text || typeof text !== 'string') {
        return { blocked: false, score: 0, reason: null, matches: [] };
    }

    // Normalize text
    const normalized = text.toLowerCase()
        .replace(/[íìỉĩị]/g, 'i')
        .replace(/[óòỏõọ]/g, 'o')
        .replace(/[ắằẳẵặ]/g, 'a')
        .replace(/[éèẻẽẹ]/g, 'e')
        .replace(/[úùủũụ]/g, 'u');

    const matches = [];
    let severeCount = 0;
    let moderateCount = 0;

    // Check severe profanity
    for (const pattern of SEVERE_PROFANITY_PATTERNS) {
        const found = normalized.match(pattern);
        if (found) {
            severeCount += found.length;
            matches.push(...found.map(m => ({ type: 'severe', word: m.trim() })));
        }
    }

    // If severe profanity detected → Block immediately
    if (severeCount > 0) {
        return {
            blocked: true,
            score: 100,
            reason: 'Nội dung chứa từ ngữ nghiêm trọng không phù hợp',
            matches
        };
    }

    // Check moderate profanity
    for (const pattern of MODERATE_PROFANITY_PATTERNS) {
        const found = normalized.match(pattern);
        if (found) {
            moderateCount += found.length;
            matches.push(...found.map(m => ({ type: 'moderate', word: m.trim() })));
        }
    }

    // Check English profanity
    for (const pattern of ENGLISH_PROFANITY_PATTERNS) {
        const found = text.match(pattern);
        if (found) {
            moderateCount += found.length;
            matches.push(...found.map(m => ({ type: 'moderate', word: m.trim() })));
        }
    }

    // Score calculation
    const score = Math.min(100, moderateCount * 35); // Each moderate word = 35 points

    // Block if 2+ moderate profanity words or score >= 70
    if (moderateCount >= 2 || score >= 70) {
        return {
            blocked: true,
            score,
            reason: 'Nội dung chứa nhiều từ ngữ không phù hợp',
            matches
        };
    }

    // Warning if 1 moderate word (needs review based on trust score)
    if (moderateCount === 1) {
        return {
            blocked: false,
            score,
            reason: 'Nội dung có thể chứa từ ngữ không phù hợp',
            matches,
            needsReview: true
        };
    }

    return { blocked: false, score: 0, reason: null, matches: [] };
}

// ========== URL VALIDATION ==========

// Blacklisted domains (shortened URLs, known spam)
const BLACKLISTED_DOMAINS = [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    't.co',
    'ow.ly',
    'adf.ly',
    'bc.vc',
    'ouo.io',
];

/**
 * Check URLs in text
 * @param {string} text - Text to check
 * @returns {Object} { blocked: boolean, reason: string, urls: array }
 */
export function checkUrls(text) {
    if (!text || typeof text !== 'string') {
        return { blocked: false, urls: [] };
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex) || [];

    if (urls.length === 0) {
        return { blocked: false, urls: [] };
    }

    // Check URL count limit
    if (urls.length > 3) {
        return {
            blocked: true,
            reason: 'Bài viết chứa quá nhiều links (tối đa 3)',
            urls
        };
    }

    // Check blacklisted domains
    for (const url of urls) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            
            const isBlacklisted = BLACKLISTED_DOMAINS.some(domain => 
                hostname.includes(domain)
            );

            if (isBlacklisted) {
                return {
                    blocked: true,
                    reason: 'Bài viết chứa link không được phép (shortened URLs)',
                    urls
                };
            }
        } catch (error) {
            // Invalid URL
            return {
                blocked: true,
                reason: 'Bài viết chứa link không hợp lệ',
                urls
            };
        }
    }

    return { blocked: false, urls };
}

// ========== SPAM DETECTION ==========

// In-memory cache for recent posts (in production, use Redis)
const recentPosts = new Map(); // userId -> [{ content, timestamp }]
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Check for duplicate/similar content
 * @param {string} userId - User ID
 * @param {string} content - Content to check
 * @returns {Object} { blocked: boolean, reason: string, similarity: number }
 */
export function checkDuplicateContent(userId, content) {
    if (!userId || !content) {
        return { blocked: false };
    }

    // Get user's recent posts
    const userPosts = recentPosts.get(userId) || [];

    // Clean old posts
    const now = Date.now();
    const validPosts = userPosts.filter(p => (now - p.timestamp) < CACHE_DURATION);

    // Check exact duplicate
    const exactMatch = validPosts.find(p => p.content === content);
    if (exactMatch) {
        return {
            blocked: true,
            reason: 'Nội dung trùng lặp với bài viết trước',
            similarity: 100
        };
    }

    // Check similarity (using string-similarity)
    for (const post of validPosts) {
        const similarity = stringSimilarity.compareTwoStrings(content, post.content);
        
        if (similarity > 0.85) { // 85% similar
            return {
                blocked: true,
                reason: 'Nội dung quá giống với bài viết trước',
                similarity: Math.round(similarity * 100)
            };
        }
    }

    // Add to cache
    validPosts.push({ content, timestamp: now });
    recentPosts.set(userId, validPosts);

    // Cleanup cache if too large
    if (recentPosts.size > 1000) {
        const oldestKey = recentPosts.keys().next().value;
        recentPosts.delete(oldestKey);
    }

    return { blocked: false, similarity: 0 };
}

/**
 * Clear user's spam cache (e.g., after successful post)
 * @param {string} userId - User ID
 */
export function clearSpamCache(userId) {
    if (recentPosts.has(userId)) {
        const posts = recentPosts.get(userId);
        // Keep only last post
        recentPosts.set(userId, posts.slice(-1));
    }
}

// ========== IMAGE MODERATION (AI + Manual Hybrid) ==========

/**
 * Load NSFW model (using Sightengine Free API as fallback)
 */
export async function loadNSFWModel() {
    console.log('✅ Image moderation: AI auto-check + Manual review hybrid mode');
    console.log('📸 Using heuristic analysis + Sightengine free tier API');
    return true;
}

/**
 * Check image properties for potential NSFW content (heuristic analysis)
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} { suspicious: boolean, reason: string }
 */
async function analyzeImageHeuristics(imageBuffer) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const stats = await sharp(imageBuffer).stats();
        
        // Heuristic checks (basic filters)
        const warnings = [];
        let suspicionScore = 0;

        // 1. Check image size (very small or very large images are suspicious)
        if (metadata.width < 100 || metadata.height < 100) {
            warnings.push('Kích thước ảnh quá nhỏ');
            suspicionScore += 20;
        }

        // 2. Check aspect ratio (extremely wide/tall images)
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio > 3 || aspectRatio < 0.33) {
            warnings.push('Tỉ lệ ảnh bất thường');
            suspicionScore += 15;
        }

        // 3. Analyze color distribution (skin tone detection - very basic)
        if (stats.channels && stats.channels.length >= 3) {
            const [r, g, b] = stats.channels;
            const avgR = r.mean;
            const avgG = g.mean;
            const avgB = b.mean;

            // Rough skin tone range: R>G>B with R high
            const isSkinTone = avgR > 95 && avgG > 40 && avgG < 100 && avgB > 20 && avgB < 70;
            const skinDominance = avgR > avgG && avgG > avgB && avgR > 160;

            if (isSkinTone || skinDominance) {
                warnings.push('Phát hiện nhiều vùng màu da');
                suspicionScore += 30;
            }
        }

        return {
            suspicious: suspicionScore >= 40,
            suspicionScore,
            warnings,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            }
        };
    } catch (error) {
        console.error('Heuristic analysis error:', error);
        return { suspicious: false, suspicionScore: 0, warnings: [] };
    }
}

/**
 * Check image using Sightengine free API (100 requests/day free)
 * @param {string} imageUrl - Image URL
 * @returns {Promise<Object>} { blocked: boolean, scores: object, source: string }
 */
async function checkImageWithSightengine(imageUrl) {
    // Sightengine free tier API keys (you need to sign up at sightengine.com)
    const API_USER = process.env.SIGHTENGINE_USER || null;
    const API_SECRET = process.env.SIGHTENGINE_SECRET || null;

    if (!API_USER || !API_SECRET) {
        console.log('ℹ️  Sightengine API not configured, skipping external check');
        return null;
    }

    try {
        const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
            params: {
                url: imageUrl,
                models: 'nudity,wad',
                api_user: API_USER,
                api_secret: API_SECRET
            },
            timeout: 5000
        });

        const data = response.data;
        
        // Parse nudity scores
        const nudityScore = data.nudity?.sexual || 0;
        const partialScore = data.nudity?.partial || 0;
        
        return {
            blocked: nudityScore > 0.6 || partialScore > 0.7,
            scores: {
                sexual: nudityScore,
                partial: partialScore,
                safe: data.nudity?.safe || 0
            },
            source: 'sightengine'
        };
    } catch (error) {
        console.warn('Sightengine API error:', error.message);
        return null;
    }
}

/**
 * Check image for NSFW content (AI auto + manual review)
 * @param {string} imageUrl - Cloudinary URL
 * @returns {Promise<Object>} { blocked: boolean, needsReview: boolean, scores: object }
 */
export async function checkImageNSFW(imageUrl) {
    if (!imageUrl) {
        return { blocked: false, needsReview: false };
    }

    try {
        // Step 1: Download image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(response.data);

        // Step 2: Heuristic analysis (local, free)
        const heuristicResult = await analyzeImageHeuristics(imageBuffer);

        // Step 3: External API check (if configured)
        const apiResult = await checkImageWithSightengine(imageUrl);

        // Decision logic
        let blocked = false;
        let needsReview = false;
        let autoCheckPassed = false;
        const reasons = [];

        // If API detected NSFW
        if (apiResult && apiResult.blocked) {
            blocked = true;
            reasons.push('AI phát hiện nội dung không phù hợp (Sightengine)');
        }
        // If heuristics are highly suspicious
        else if (heuristicResult.suspicious && heuristicResult.suspicionScore >= 60) {
            needsReview = true;
            reasons.push(...heuristicResult.warnings);
        }
        // If heuristics are moderately suspicious
        else if (heuristicResult.suspicious) {
            needsReview = true;
            reasons.push('Cần kiểm tra thêm');
        }
        // All checks passed
        else {
            autoCheckPassed = true;
        }

        return {
            blocked,
            needsReview,
            autoCheckPassed,
            scores: {
                heuristic: heuristicResult.suspicionScore,
                ...(apiResult ? apiResult.scores : {})
            },
            reason: reasons.join(', ') || null,
            checks: {
                heuristic: heuristicResult,
                api: apiResult ? 'completed' : 'skipped'
            }
        };

    } catch (error) {
        console.error('Image moderation error:', error.message);
        // Fail-safe: allow but flag for review
        return {
            blocked: false,
            needsReview: true,
            autoCheckPassed: false,
            error: error.message,
            reason: 'Không thể kiểm tra ảnh tự động'
        };
    }
}

/**
 * Check multiple images
 * @param {Array<string>} imageUrls - Array of Cloudinary URLs
 * @returns {Promise<Object>} { blocked: boolean, needsReview: boolean, results: array }
 */
export async function checkImagesNSFW(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) {
        return { blocked: false, needsReview: false, results: [] };
    }

    const results = [];
    let anyBlocked = false;
    let anyNeedsReview = false;

    for (const url of imageUrls) {
        const result = await checkImageNSFW(url);
        results.push({ url, ...result });

        if (result.blocked) {
            anyBlocked = true;
            break; // Stop checking if one is blocked
        }
        if (result.needsReview) {
            anyNeedsReview = true;
        }
    }

    return {
        blocked: anyBlocked,
        needsReview: anyNeedsReview,
        autoCheckPassed: !anyBlocked && !anyNeedsReview,
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
