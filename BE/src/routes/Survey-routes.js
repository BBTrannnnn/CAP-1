import express from 'express';


import { 
    // Public
  getSurveyQuestions,
  
  // Legacy
  getRandomSurveyQuestions,
  
  // New User Survey System
  getUserSurveySession,
  submitSurveyAnswers,
  getUserSurveyResults,
  resetSurveySession,
  getUserSurveyHistory
} from '../controllers/Survey_controller.js';
import authenticateToken from "../../middlewares/auth.js";


const router = express.Router();

// Get survey questions
router.get('/questions', getSurveyQuestions);    
// Get random survey questions
router.get('/random',authenticateToken, getRandomSurveyQuestions);
// 1. Lấy/Tạo session (12 câu random cố định)
router.get('/session', authenticateToken, getUserSurveySession);

// 2. Submit câu trả lời
router.post('/submit', authenticateToken, submitSurveyAnswers);

// Ket qyuao khảo sát
router.get('/results', authenticateToken, getUserSurveyResults);

// 4. Reset session hiện tại (tạo lại câu hỏi mới)
router.delete('/reset', authenticateToken, resetSurveySession);

// 5. Xem lịch sử khảo sát
router.get('/history', authenticateToken, getUserSurveyHistory);
export default router;