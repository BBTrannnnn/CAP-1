import express from 'express';


import { getSurveyQuestions,getRandomSurveyQuestions} from '../controllers/Survey_controller.js';
import authenticateToken from "../../middlewares/auth.js";


const router = express.Router();

// Get survey questions
router.get('/questions', getSurveyQuestions);    
// Get random survey questions
router.get('/random',authenticateToken, getRandomSurveyQuestions);
export default router;