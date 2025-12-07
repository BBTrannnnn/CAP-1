import express from "express";
import { 
  register,
  getProfileById, 
  updateProfileById, 
  deleteProfileById, 
  login, 
  logout,
  //loginWithGoogle,
  //getGoogleAuthUrl, 
  //googleCallback, 
  forgotPassword, 
  resetPassword, 
  verifyOTP,
  getPublicProfile,
} from "../controllers/User_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";
import authenticateToken from "../../middlewares/auth.js";


const router = express.Router();

 // Routes
 router.post('/register',validateRequest, register);
 
 // Debug: xem user hiện tại lấy từ token/DB
 router.get('/me', authenticateToken, (req, res) => {
   res.json({ success: true, user: req.user });
 });

 // User profile routes
 router.put('/:id',validateRequest,authenticateToken,updateProfileById);
 router.get('/:id',authenticateToken,getProfileById);
 router.delete('/:id',authenticateToken,deleteProfileById);

 // Public profile (không cần auth)
 router.get('/public/:userId', getPublicProfile);

// Route đăng nhập (email/sđt + password)
router.post("/login", validateRequest, login);

// Đăng xuất
router.post("/logout", logout);


//Quên mật khẩu - forgot lấy mã từu mail , rồi nhập otp rồi đổi mật khẩu qua resetpassword
router.post("/forgotpassword", forgotPassword); // gửi OTP
router.post('/verifyOTP', verifyOTP);// Xác thực OTP
router.post("/resetpassword", resetPassword);   // reset password với mã verify OTP

export default router;