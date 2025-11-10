import fs from 'fs';
import https from 'https';
import http from 'http';

/**
 * DREAMBANK WEB SCRAPER
 * 
 * Scrapes real dreams from DreamBank (www.dreambank.net)
 * Academic research database by G. William Domhoff
 * 
 * Strategy:
 * 1. Use DreamBank's random sample feature
 * 2. Parse HTML to extract dream texts
 * 3. Categorize by emotion keywords
 * 4. Translate to Vietnamese (simple mapping)
 */

const TARGET_DREAMS = 1100;

// DreamBank collections to sample from
const DREAMBANK_COLLECTIONS = [
  'barb_sanders',  // 4,000+ dreams
  'izzy',          // 4,300+ dreams
  'jasmine',       // 3,000+ dreams
  'vietnam_vet',   // Vietnam War dreams
  'college_women', // College students
  'rosamund',      // Young woman
  'bea',           // Middle-aged woman
  'emma',          // Teenage girl
];

// Emotion keywords for categorization (English)
const EMOTION_KEYWORDS = {
  stress: [
    'chase', 'run', 'escape', 'trap', 'stuck', 'fall', 'late', 'test', 
    'exam', 'lost', 'drown', 'suffocate', 'control', 'brake', 'naked'
  ],
  fear: [
    'monster', 'ghost', 'dark', 'shadow', 'attack', 'kill', 'death', 
    'blood', 'scream', 'danger', 'threat', 'scary', 'terror', 'evil'
  ],
  anxiety: [
    'worry', 'forget', 'lost', 'confuse', 'search', 'find', 'miss',
    'unprepared', 'deadline', 'wrong', 'mistake', 'problem'
  ],
  sadness: [
    'cry', 'sad', 'die', 'death', 'funeral', 'goodbye', 'alone', 
    'reject', 'loss', 'tear', 'mourn', 'grief', 'heartbreak'
  ],
  happy: [
    'happy', 'joy', 'laugh', 'celebrate', 'win', 'success', 'beautiful',
    'love', 'fun', 'play', 'dance', 'party', 'gift', 'friend'
  ],
  neutral: [
    'walk', 'talk', 'sit', 'eat', 'drink', 'read', 'watch', 'work',
    'drive', 'shop', 'cook', 'clean', 'routine', 'normal'
  ],
  confusion: [
    'strange', 'weird', 'bizarre', 'surreal', 'impossible', 'transform',
    'change', 'float', 'distort', 'unreal', 'dream', 'lucid'
  ]
};

// Simple Vietnamese translation mapping
const TRANSLATION_DICT = {
  'I': 'Tôi',
  'was': 'đã',
  'being': 'bị',
  'chased': 'đuổi',
  'through': 'qua',
  'dark': 'tối',
  'building': 'tòa nhà',
  'could not': 'không thể',
  'couldn\'t': 'không thể',
  'find': 'tìm',
  'the': '',
  'exit': 'lối ra',
  'falling': 'rơi',
  'from': 'từ',
  'very': 'rất',
  'tall': 'cao',
  'and': 'và',
  'stop': 'dừng',
  'myself': 'bản thân',
  'trapped': 'mắc kẹt',
  'in': 'trong',
  'elevator': 'thang máy',
  'that': '',
  'kept': 'cứ',
  'going': 'đi',
  'down': 'xuống',
  // ... (thêm nhiều từ nữa nếu cần)
};

/**
 * Fetch random dreams from DreamBank using proper form submission
 */
async function fetchRandomDreams(series, count = 100) {
  return new Promise((resolve, reject) => {
    // DreamBank random sample form parameters
    const postData = `series=${series}&minwords=50&maxwords=300&n=${count}`;
    
    const options = {
      hostname: 'www.dreambank.net',
      port: 80,
      path: '/cgi-bin/DreamBank/random_sample.cgi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Academic Research)'
      }
    };
    
    console.log(`Fetching ${count} dreams from ${series}...`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Parse HTML to extract dreams
          const dreams = parseHtmlDreams(data);
          resolve(dreams);
        } catch (error) {
          console.error(`Error parsing ${series}:`, error.message);
          resolve([]);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`Error fetching ${series}:`, err.message);
      resolve([]);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Parse HTML to extract dream texts
 */
function parseHtmlDreams(html) {
  const dreams = [];
  
  // DreamBank displays dreams between <HR> tags
  // Each dream is typically in format: "dream_id: dream_text"
  
  // Split by HR tags
  const sections = html.split(/<hr[^>]*>/i);
  
  for (const section of sections) {
    // Extract text content, remove HTML tags
    let text = section.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    
    // Remove dream IDs (e.g., "barb001:")
    text = text.replace(/^\s*\w+\d+:\s*/i, '');
    
    // Clean whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Filter valid dreams
    if (text.length > 50 && text.length < 1000) {
      // Skip non-dream content
      if (!text.toLowerCase().includes('dreambank') && 
          !text.toLowerCase().includes('copyright') &&
          !text.toLowerCase().includes('select a dream') &&
          !text.toLowerCase().includes('random sample')) {
        dreams.push(text);
      }
    }
  }
  
  return dreams;
}

/**
 * Categorize dream by emotion
 */
function categorizeDream(text) {
  const textLower = text.toLowerCase();
  const scores = {};
  
  // Count keyword matches for each emotion
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = 0;
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        scores[emotion]++;
      }
    }
  }
  
  // Return emotion with highest score
  let maxEmotion = 'neutral';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }
  
  return maxEmotion;
}

/**
 * Simple translation (English -> Vietnamese)
 */
function translateToVietnamese(text) {
  // This is a very basic translation
  // In production, you would use Google Translate API
  // For now, just keep English text (DreamBank is in English)
  return text;
}

/**
 * Main scraping function
 */
async function scrapeDreamBank() {
  console.log('\n🕷️  DREAMBANK WEB SCRAPER');
  console.log('Source: https://www.dreambank.net/');
  console.log(`Target: ${TARGET_DREAMS} dreams\n`);
  
  const allDreams = [];
  const dreamsPerSeries = 150; // Request more per series
  
  // Fetch from each collection
  for (const series of DREAMBANK_COLLECTIONS) {
    try {
      const dreams = await fetchRandomDreams(series, dreamsPerSeries);
      
      for (const dreamText of dreams) {
        const category = categorizeDream(dreamText);
        const vietnamese = translateToVietnamese(dreamText);
        
        allDreams.push({
          text: vietnamese,  // Keep English for now
          category: category,
          source: 'dreambank',
          series: series
        });
      }
      
      console.log(`   ✅ ${series}: ${dreams.length} dreams`);
      
      // Delay to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`   ❌ ${series}: ${error.message}`);
    }
    
    // Stop if we have enough
    if (allDreams.length >= TARGET_DREAMS) {
      break;
    }
  }
  
  // Shuffle
  for (let i = allDreams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allDreams[i], allDreams[j]] = [allDreams[j], allDreams[i]];
  }
  
  // Limit to target
  const finalDreams = allDreams.slice(0, TARGET_DREAMS);
  
  console.log(`\n📊 Scraped ${finalDreams.length} dreams from DreamBank`);
  
  // Category distribution
  const categoryCount = finalDreams.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nCategory Distribution:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / finalDreams.length) * 100).toFixed(1);
      console.log(`   ${cat.padEnd(10)} ${count.toString().padStart(3)} (${pct}%)`);
    });
  
  // Save
  fs.writeFileSync(
    './dreambank_scraped.json',
    JSON.stringify(finalDreams, null, 2),
    'utf8'
  );
  
  console.log('\n✅ Saved to: dreambank_scraped.json');
  console.log('\nNext: Merge with self-generated dreams');
  console.log('   Run mergeDreams.js to combine datasets\n');
  
  console.log('📖 CITATION:');
  console.log('   Domhoff, G. W. DreamBank. Retrieved from https://www.dreambank.net/\n');
  
  return finalDreams;
}

// Run scraper
scrapeDreamBank().catch(console.error);
