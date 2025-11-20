import express from 'express';
import authenticateToken from "../../middlewares/auth.js";
import {
  registerFCMToken,
  unregisterFCMToken,
  getUserDevices
} from '../controllers/fcmController.js';

const router = express.Router();
router.use(authenticateToken);

// Route để mobile app đăng ký FCM token
router.post('/register', registerFCMToken);

// Route để xóa FCM token
router.post('/unregister', unregisterFCMToken);

// Route để xem danh sách devices đã đăng ký
router.get('/devices', getUserDevices);

export default router;