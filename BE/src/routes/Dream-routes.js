import express from 'express';
import {
  analyzeDream,
  getDreamHistory,
  getDreamStats,
  getDream,
  deleteDream,
  getRetrainingStats,
  manualExportDreams,
  manualMergeData,
} from '../controllers/Dream_controller.js';
import auth from '../../middlewares/auth.js';

const router = express.Router();


router.use(auth);
router.post('/analyze', analyzeDream);
router.get('/history', getDreamHistory);
router.get('/stats', getDreamStats);

// Retraining endpoints
router.get('/retraining/stats', getRetrainingStats);
router.post('/retraining/export', manualExportDreams);
router.post('/retraining/merge', manualMergeData);

router.get('/:id', getDream);
router.delete('/:id', deleteDream);

export default router;
