import express from 'express';
import {
  analyzeDream,
  getDreamHistory,
  getDreamStats,
  getDream,
  deleteDream,
} from '../controllers/Dream_controller.js';
import auth from '../../middlewares/auth.js';

const router = express.Router();


router.use(auth);
router.post('/analyze', analyzeDream);
router.get('/history', getDreamHistory);
router.get('/stats', getDreamStats);
router.get('/:id', getDream);
router.delete('/:id', deleteDream);

export default router;
