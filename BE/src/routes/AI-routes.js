import express from 'express';
import { chat } from '../controllers/AI_controller.js';
import authenticateToken from '../../middlewares/auth.js'; // [1] Bỏ comment dòng này

const router = express.Router();

// [2] Thêm middleware authenticateToken vào giữa
router.post('/chat', authenticateToken, chat);

export default router;