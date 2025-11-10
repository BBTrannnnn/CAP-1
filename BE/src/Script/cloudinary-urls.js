// ============================================
// HƯỚNG DẪN: 
// 1. Upload 7 files MP3 lên Cloudinary
// 2. Copy URLs từ Cloudinary và paste vào đây
// 3. Run: npm run seed:audio
// ============================================

export const CLOUDINARY_URLS = {
  // Thay URLs này sau khi upload lên Cloudinary
  rain: 'https://res.cloudinary.com/https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748332/640649__barkenov__rain-leak-into-a-bucket_kd8qot.wav/video/upload/v1234567890/rain.mp3',
  ocean: 'https://res.cloudinary.https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748344/827529__yevgverh__ocean_coast_03_092025_0659am_tv6zvo.wav/YOUR_CLOUD_NAME/video/upload/v1234567890/ocean.mp3',
  forest: 'https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748376/513237__klankbeeld__calm-forest-april-nl-kampina-02-200401_0141_cogj01.flac',
  whitenoise: 'https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748418/791940__hear-no-elvis__white-noise-16-hours_n3zhoq.wav',
  
  storyNightTown: 'https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748360/40_ph%C3%BAt_nghe_truy%E1%BB%87n_cho_gi%E1%BA%A5c_ng%E1%BB%A7_ngon___Truy%E1%BB%87n_ng%E1%BB%A7__Th%E1%BB%8B_Tr%E1%BA%A5n_V%E1%BB%81_%C4%90%C3%AAm_2ktoy_9pVw0_xdoiwi.mp3',
  storyAiGiaoViec: 'https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748378/Ai_Giao_Vi%E1%BB%87c_Cho_Vua____Chuy%E1%BB%87n_X%C6%B0a_Cho_D%E1%BB%85_Ng%E1%BB%A7_NlMxAdlofeE_rmcfkc.mp3',
  storyHoChiMinh: 'https://res.cloudinary.com/do9hvdwpt/video/upload/v1762748303/Nghe_Truy%E1%BB%87n_B%C3%A1c_H%E1%BB%93_Ng%E1%BB%A7_Ngon_Nh%E1%BA%A5t_2024_-_Gs_Ho%C3%A0ng_Ch%C3%AD_B%E1%BA%A3o_K%E1%BB%83_Chuy%E1%BB%87n_B%C3%A1c_H%E1%BB%93_C%E1%BA%A3m_%C4%90%E1%BB%99ng_Nh%E1%BA%A5t_WErnjshmSco_otyjet.mp3',
};

// Để dùng localhost (development)
export const USE_LOCALHOST = false; // Đổi thành true nếu muốn test local
export const LOCALHOST_BASE = 'http://localhost:5000/audio';
