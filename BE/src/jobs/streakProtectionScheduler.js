import cron from 'node-cron';
import streakProtectionService from '../services/streakProtectionService.js';

class StreakProtectionScheduler {
  constructor() {
    this.isRunning = false;
    this.streakCheckJob = null;
    this.unfreezeCheckJob = null;
  }
  
  start() {
    if (this.isRunning) {
      console.log('⚠️  Streak Protection Scheduler already running');
      return;
    }
    
    console.log('🛡️  Starting Streak Protection Scheduler...');
    this.isRunning = true;
    
    // Job 1: Check streak risks (21:00 daily)
    this.streakCheckJob = cron.schedule('19 16 * * *', async () => {
      await streakProtectionService.checkAllHabitsStreakRisk();
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });
    
    // Job 2: Check and unfreeze (00:01 daily)
    this.unfreezeCheckJob = cron.schedule('1 0 * * *', async () => {
      console.log('\n🔓 Checking frozen habits...');
      await streakProtectionService.checkAndUnfreeze();
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });
    
    console.log('✅ Streak Protection Scheduler started');
    console.log('   - Streak check: daily at 21:00');
    console.log('   - Unfreeze check: daily at 00:01');
    
    // Test when start
    setTimeout(() => streakProtectionService.checkAllHabitsStreakRisk(), 3000);
  }
  
  stop() {
    if (this.streakCheckJob) {
      this.streakCheckJob.stop();
    }
    if (this.unfreezeCheckJob) {
      this.unfreezeCheckJob.stop();
    }
    this.isRunning = false;
    console.log('🛑 Streak Protection Scheduler stopped');
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      timezone: 'Asia/Ho_Chi_Minh',
      jobs: [
        { name: 'Streak Check', schedule: '0 21 * * *' },
        { name: 'Unfreeze Check', schedule: '1 0 * * *' }
      ]
    };
  }
  
  async triggerNow() {
    console.log('🔧 Manual trigger...');
    await streakProtectionService.checkAllHabitsStreakRisk();
    await streakProtectionService.checkAndUnfreeze();
  }
}

export default new StreakProtectionScheduler();