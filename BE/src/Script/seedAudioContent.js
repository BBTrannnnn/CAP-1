import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SleepContent from '../models/SleepContent.js';
import { CLOUDINARY_URLS, USE_LOCALHOST, LOCALHOST_BASE } from './cloudinary-urls.js';

dotenv.config();

// Hàm helper để lấy URL (tự động chọn Cloudinary hoặc localhost)
const getAudioUrl = (cloudinaryUrl, filename) => {
  return USE_LOCALHOST ? `${LOCALHOST_BASE}/${filename}` : cloudinaryUrl;
};

const audioData = [
  // AM THANH THU GIAN - SOUND
  {
    type: 'sound',
    name: 'Tiếng mưa',
    slug: 'tieng-mua',
    description: 'Âm thanh mưa rơi nhẹ nhàng, giúp thư giãn và dễ ngủ',
    duration: 600,
    displayDuration: '10 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.rain, 'rain.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400',
    category: 'nature',
    tags: ['rain', 'nature', 'relaxing', 'sleep'],
    language: 'vi',
    isLoopRecommended: true,
    premium: false,
    sortOrder: 1,
    active: true
  },
  {
    type: 'sound',
    name: 'Sóng biển',
    slug: 'song-bien',
    description: 'Tiếng sóng vỗ bờ êm dịu, mang lại cảm giác bình yên',
    duration: 600,
    displayDuration: '10 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.ocean, 'ocean.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
    category: 'nature',
    tags: ['ocean', 'nature', 'relaxing', 'sleep'],
    language: 'vi',
    isLoopRecommended: true,
    premium: false,
    sortOrder: 2,
    active: true
  },
  {
    type: 'sound',
    name: 'Rừng đêm',
    slug: 'rung-dem',
    description: 'Âm thanh thiên nhiên trong rừng về đêm, yên bình và thư thái',
    duration: 600,
    displayDuration: '10 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.forest, 'forest.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=400',
    category: 'nature',
    tags: ['forest', 'nature', 'night', 'sleep'],
    language: 'vi',
    isLoopRecommended: true,
    premium: false,
    sortOrder: 3,
    active: true
  },
  {
    type: 'sound',
    name: 'White noise',
    slug: 'white-noise',
    description: 'Tiếng ồn trắng giúp tập trung, che tiếng ồn xung quanh và dễ ngủ',
    duration: 600,
    displayDuration: '10 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.whitenoise, 'whitenoise.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
    category: 'white-noise',
    tags: ['white-noise', 'focus', 'sleep', 'concentration'],
    language: 'vi',
    isLoopRecommended: true,
    premium: false,
    sortOrder: 4,
    active: true
  },

  // KE CHUYEN RU NGU - STORY
  {
    type: 'story',
    name: 'Thị trấn về đêm',
    slug: 'thi-tran-ve-dem',
    description: 'Chuyến phiêu lưu trong thị trấn nhỏ về đêm, nơi mọi thứ trở nên kỳ diệu',
    duration: 2400,
    displayDuration: '40 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.storyNightTown, 'story-night-town.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
    category: 'adventure',
    tags: ['story', 'adventure', 'night', 'magical'],
    language: 'vi',
    isLoopRecommended: false,
    premium: false,
    sortOrder: 10,
    active: true
  },
  {
    type: 'story',
    name: 'Ai giao việc cho vua',
    slug: 'ai-giao-viec-cho-vua',
    description: 'Câu chuyện về sự khôn ngoan và trí tuệ trong các mẩu chuyện cổ tích',
    duration: 900,
    displayDuration: '15 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.storyAiGiaoViec, 'Story-AiGiaoViecChoVua.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    category: 'folk-tale',
    tags: ['story', 'folk-tale', 'wisdom', 'traditional'],
    language: 'vi',
    isLoopRecommended: false,
    premium: false,
    sortOrder: 11,
    active: true
  },
  {
    type: 'story',
    name: 'Chuyện Bác Hồ',
    slug: 'chuyen-bac-ho',
    description: 'Những câu chuyện cảm động về cuộc đời và sự nghiệp của Bác Hồ',
    duration: 1800,
    displayDuration: '30 phút',
    audioUrl: getAudioUrl(CLOUDINARY_URLS.storyHoChiMinh, 'story-HoChiMinh-ByGSHoangChiBao.mp3'),
    thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
    category: 'history',
    tags: ['story', 'history', 'inspiration', 'vietnam'],
    language: 'vi',
    isLoopRecommended: false,
    premium: false,
    sortOrder: 12,
    active: true
  }
];

async function seedAudioContent() {
  try {
    const DB_USERNAME = process.env.DB_Username;
    const DB_PASSWORD = process.env.DB_Password;
    const DB_NAME = process.env.DB_Name;
    
    const MONGO_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.attlhny.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
    
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database successfully');

    // Xoa du lieu cu (optional - neu muon lam moi hoan toan)
    const deleteCount = await SleepContent.deleteMany({});
    console.log(`Deleted ${deleteCount.deletedCount} existing records`);

    // Them du lieu moi
    const result = await SleepContent.insertMany(audioData);
    console.log(`Successfully inserted ${result.length} audio content items`);

    console.log('\nList of inserted items:');
    result.forEach(item => {
      console.log(`  - [${item.type.toUpperCase()}] ${item.name} (${item.displayDuration})`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedAudioContent();
