import express from 'express';
import { chat } from '../controllers/AI_controller.js';
// import authenticateToken from '../../middlewares/auth.js';

const router = express.Router();

router.post('/chat', /*authenticateToken,*/ chat);

export default router;
