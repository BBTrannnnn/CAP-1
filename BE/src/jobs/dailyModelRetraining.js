import cron from 'node-cron';
import Dream from '../models/Dream.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export dữ liệu mới để train
async function exportNewDreamsForTraining() {
  try {
    // Lấy tất cả dreams chưa được dùng để train
    const dreams = await Dream.find({ needsRetraining: true })
      .select('dreamText category')
      .lean();
    
    if (dreams.length === 0) {
      console.log('📊 No new dreams to export for training');
      return { exported: 0 };
    }
    
    // Chuyển đổi format
    const trainingData = dreams.map(d => ({
      text: d.dreamText,
      category: d.category
    }));
    
    // Đường dẫn file output
    const outputPath = path.join(__dirname, '../../new_dreams_training.json');
    
    // Ghi ra file
    fs.writeFileSync(outputPath, JSON.stringify(trainingData, null, 2), 'utf8');
    
    // Đánh dấu đã export
    await Dream.updateMany(
      { needsRetraining: true },
      { needsRetraining: false, lastTrainedAt: new Date() }
    );
    
    console.log(`✅ Exported ${dreams.length} dreams for retraining at ${new Date().toISOString()}`);
    return { exported: dreams.length, filePath: outputPath };
  } catch (error) {
    console.error('❌ Error exporting dreams for training:', error);
    throw error;
  }
}

// Gộp dữ liệu mới vào file training chính
 async function mergeTrainingData() {
  try {
    const newDataPath = path.join(__dirname, '../../new_dreams_training.json');
    const mainDataPath = path.join(__dirname, '../../dream_training_data.json');
    
    // Kiểm tra file mới có tồn tại không
    if (!fs.existsSync(newDataPath)) {
      console.log('📊 No new training data to merge');
      return { merged: 0 };
    }
    
    // Đọc dữ liệu
    const newData = JSON.parse(fs.readFileSync(newDataPath, 'utf8'));
    const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));
    
    // Gộp
    const mergedData = [...mainData, ...newData];
    
    // Lưu lại file chính
    fs.writeFileSync(mainDataPath, JSON.stringify(mergedData, null, 2), 'utf8');
    
    // Backup file mới và đổi tên
    const backupPath = path.join(__dirname, `../../backups/new_dreams_training_${Date.now()}.json`);
    
    // Tạo thư mục backups nếu chưa có
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.renameSync(newDataPath, backupPath);
    
    console.log(`✅ Merged ${newData.length} new dreams into main training data`);
    console.log(`📈 Total training data: ${mergedData.length} dreams`);
    return { merged: newData.length, totalData: mergedData.length };
  } catch (error) {
    console.error('❌ Error merging training data:', error);
    throw error;
  }
}

// Log thông báo cần train model
async function notifyModelTrainingNeeded() {
  console.log('\n' + '='.repeat(60));
  console.log('🔔 MODEL RETRAINING NOTIFICATION');
  console.log('='.repeat(60));
  console.log('📝 New training data has been prepared');
  console.log('📍 Location: dream_training_data.json');
  console.log('🚀 Next steps:');
  console.log('   1. Open Google Colab');
  console.log('   2. Upload dream_training_data.json');
  console.log('   3. Run train_colab.py');
  console.log('   4. Download trained_model/');
  console.log('   5. Replace old model and restart server');
  console.log('='.repeat(60) + '\n');
}

// Cron job: Chạy mỗi ngày lúc 00:00
export function scheduleDailyModelRetraining() {
  // Cron expression: '0 0 * * *' = 00:00 mỗi ngày
  // Để test: '*/5 * * * *' = mỗi 5 phút
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🚀 Starting daily model retraining process at 00:00');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Bước 1: Export dreams mới
      const exportResult = await exportNewDreamsForTraining();
      
      if (exportResult.exported > 0) {
        // Bước 2: Gộp vào file training chính
        const mergeResult = await mergeTrainingData();
        
        // Bước 3: Notify cần train
        await notifyModelTrainingNeeded();
        
        console.log(`✅ Daily retraining process completed successfully`);
        console.log(`📊 Summary: ${mergeResult.merged} dreams added, total: ${mergeResult.totalData}`);
      } else {
        console.log('ℹ️  No new dreams to train today - skipping merge');
      }
    } catch (error) {
      console.error('❌ Daily retraining process failed:', error);
    }
    
    console.log('─'.repeat(60) + '\n');
  }, {
    timezone: "Asia/Ho_Chi_Minh" // Múi giờ Việt Nam
  });
  
  console.log('✅ Daily model retraining scheduler started');
  console.log('⏰ Scheduled to run at 00:00 VN time every day');
  console.log('📊 Will export new dreams and merge into training data automatically');
}
