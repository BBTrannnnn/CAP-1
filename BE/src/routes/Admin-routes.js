import express from 'express';
import {
  getSystemDashboard,
  getRecentDreams,
  getTrainingQueue
} from '../controllers/Admin_controller.js';
import {
  getAllUsers,
  getDashboard,
  updateUserRole,
} from '../controllers/User_controller.js';
import auth from '../../middlewares/auth.js';
import requireAdmin from '../../middlewares/requireAdmin.js';
import { validateRequest } from '../../middlewares/validateReuqest.js';
import { body } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireAdmin);

// System Dashboard
router.get('/system/dashboard', getSystemDashboard);
router.get('/dreams/recent', getRecentDreams);
router.get('/dreams/training-queue', getTrainingQueue);

// User Management Dashboard
router.get('/users/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.patch(
  '/users/:id/role',
  body('role').isIn(['user', 'moderator', 'admin']).withMessage('role phải là "user", "moderator" hoặc "admin"'),
  body('trustScore').optional().isInt({ min: 0, max: 100 }).withMessage('trustScore phải từ 0-100'),
  validateRequest,
  updateUserRole
);

export default router;
