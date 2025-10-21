import express from 'express';


import { getSurveyQuestions, submitSurvey } from '../controllers/Survey_controller.js';


const router = express.Router();

// Survey routes
router.get('/questions', getSurveyQuestions);    // GET /api/survey/questions - Lấy câu hỏi khảo sát
router.post('/submit', submitSurvey);           // POST /api/survey/submit - Nộp bài khảo sát
// router.get('/suggestions', getUserSuggestions);  // GET /api/survey/suggestions - Lấy gợi ý thói quen

export default router;