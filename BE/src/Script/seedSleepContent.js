import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SleepContent from '../models/SleepContent.js';

dotenv.config();

// Ưu tiên MONGO_URI nếu có, fallback 3 biến cũ
const uri = process.env.MONGO_URI || `mongodb+srv://${process.env.DB_Username}:${process.env.DB_Password}@cluster0.attlhny.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority&appName=Cluster0`;

/*
  Seed dữ liệu âm thanh & truyện sử dụng đường dẫn LOCAL static (/audio/...).
  Bạn cần tự đặt file mp3 tương ứng vào thư mục: BE/public/audio
  Ví dụ:
    BE/public/audio/rain-60m.mp3
    BE/public/audio/ocean-60m.mp3
    ...
  Khi server chạy: http://localhost:5000/audio/rain-60m.mp3
*/

const seedData = [
  // Âm thanh (sound)
  { type: 'sound', title: 'Tiếng mưa', slug: 'tieng-mua-60p', durationSec: 3600, displayDuration: '60 phút', audioUrl: '/audio/rain-60m.mp3', category: 'rain', tags: ['mua','thu_gian'], isLoopRecommended: true, sortOrder: 1 },
  { type: 'sound', title: 'Sóng biển', slug: 'song-bien-60p', durationSec: 3600, displayDuration: '60 phút', audioUrl: '/audio/ocean-60m.mp3', category: 'ocean', tags: ['bien','thu_gian'], isLoopRecommended: true, sortOrder: 2 },
  { type: 'sound', title: 'Rừng đêm', slug: 'rung-dem-60p', durationSec: 3600, displayDuration: '60 phút', audioUrl: '/audio/forest-night-60m.mp3', category: 'forest', tags: ['forest','ambient'], isLoopRecommended: true, sortOrder: 3 },
  { type: 'sound', title: 'White noise', slug: 'white-noise-60p', durationSec: 3600, displayDuration: '60 phút', audioUrl: '/audio/white-noise-60m.mp3', category: 'white-noise', tags: ['white-noise'], isLoopRecommended: true, sortOrder: 4 },
  // Truyện (story)
  { type: 'story', title: 'Hành trình trong rừng xanh', slug: 'hanh-trinh-rung-xanh-15p', durationSec: 900, displayDuration: '15 phút', audioUrl: '/audio/story-forest-15m.mp3', category: 'adventure', tags: ['story','forest'], description: 'Câu chuyện nhẹ nhàng dẫn bạn vào khu rừng xanh tĩnh lặng.', sortOrder: 10 },
  { type: 'story', title: 'Chuyến phiêu lưu biển cả', slug: 'chuyen-phieu-luu-bien-ca-20p', durationSec: 1200, displayDuration: '20 phút', audioUrl: '/audio/story-ocean-20m.mp3', category: 'adventure', tags: ['story','ocean'], description: 'Cùng trôi theo làn sóng dịu êm và tiếng gió biển.', sortOrder: 11 },
  { type: 'story', title: 'Ngôi nhà trên mây', slug: 'ngoi-nha-tren-may-15p', durationSec: 900, displayDuration: '15 phút', audioUrl: '/audio/story-cloud-house-15m.mp3', category: 'fantasy', tags: ['story','fantasy'], description: 'Một ngôi nhà lơ lửng giữa tầng mây – nơi bình yên ru bạn ngủ.', sortOrder: 12 }
];

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected MongoDB');
    for (const item of seedData) {
      const updated = await SleepContent.findOneAndUpdate(
        { slug: item.slug },
        { $set: item },
        { upsert: true, new: true }
      );
      console.log('Upserted:', updated.slug);
    }
    console.log('Seeding done.');
    process.exit(0);
  } catch (e) {
    console.error('Seed error:', e.message);
    process.exit(1);
  }
}

run();
