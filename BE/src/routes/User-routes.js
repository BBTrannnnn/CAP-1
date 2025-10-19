import express from "express";
import { 
  register,
  getAllUsers,
  getProfileById, 
  updateProfileById, 
  deleteProfileById, 
  login, 
  logout,
  loginWithGoogle,
  getGoogleAuthUrl, 
  googleCallback, 
  forgotPassword, 
  resetPassword, 
  verifyOTP,
  updateUserRole,
  updateAdditionalInfo
} from "../controllers/User_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";
import authenticateToken from "../../middlewares/auth.js";
import requireAdmin from "../../middlewares/requireAdmin.js";
import { body } from "express-validator";


const router = express.Router();

 // Routes
 router.post('/register',validateRequest, register);
 // Danh sách users: CHỈ admin được xem
 router.get('/', authenticateToken, requireAdmin, getAllUsers);
 // Debug: xem user hiện tại lấy từ token/DB
 router.get('/me', authenticateToken, (req, res) => {
   res.json({ success: true, user: req.user });
 });
 // Bỏ các route admin/debug/bootstrap
 router.put('/:id',validateRequest,authenticateToken,updateProfileById);
 router.get('/:id',authenticateToken,getProfileById);
 router.delete('/:id',authenticateToken,deleteProfileById)
 router.put('/:id/addinfor', authenticateToken, validateRequest, updateAdditionalInfo);

// Bỏ các route admin: cập nhật role, toggle active

// Admin: cập nhật vai trò user
router.patch(
  '/:id/role',
  authenticateToken,
  requireAdmin,
  body('role').isIn(['user', 'admin']).withMessage('role phải là "user" hoặc "admin"'),
  validateRequest,
  updateUserRole
);

// Route đăng nhập (email/sđt + password)
router.post("/login", validateRequest, login);

// Đăng xuất
router.post("/logout", logout);

// Route đăng nhập bằng Google
router.post("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);
router.get("/google/auth-url", getGoogleAuthUrl); 

//Quên mật khẩu - forgot lấy mã từu mail , rồi nhập otp rồi đổi mật khẩu qua resetpassword
router.post("/forgotpassword", forgotPassword); // gửi OTP
router.post('/verifyOTP', verifyOTP);// Xác thực OTP
router.post("/resetpassword", resetPassword);   // reset password với mã verify OTP

export default router;