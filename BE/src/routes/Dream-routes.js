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

// All routes require authentication
router.use(auth);

// @route   POST /api/dreams/analyze
// @desc    Analyze a dream
// @access  Private
router.post('/analyze', analyzeDream);

// @route   GET /api/dreams/history
// @desc    Get user's dream history
// @access  Private
router.get('/history', getDreamHistory);

// @route   GET /api/dreams/stats
// @desc    Get user's dream statistics
// @access  Private
router.get('/stats', getDreamStats);

// @route   GET /api/dreams/:id
// @desc    Get a specific dream
// @access  Private
router.get('/:id', getDream);

// @route   DELETE /api/dreams/:id
// @desc    Delete a dream
// @access  Private
router.delete('/:id', deleteDream);

export default router;
