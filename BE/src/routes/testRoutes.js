import express from 'express';
import authenticateToken from "../../middlewares/auth.js";
import pushService from '../services/pushNotificationService.js';
import reminderScheduler from '../services/reminderScheduler.js';

const router = express.Router();
router.use(authenticateToken);

// API để test gửi notification ngay lập tức
router.post('/test-push',async (req, res) => {
  try {
    console.log(`📤 Sending test notification to user ${req.user.id}`);
    
    const result = await pushService.sendTestNotification(req.user.id);
    
    res.json({
      success: true,
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API để check trạng thái của scheduler
router.get('/scheduler-status', (_req, res) => {
  const status = reminderScheduler.getStatus();
  res.json({
    success: true,
    ...status
  });
});

export default router;