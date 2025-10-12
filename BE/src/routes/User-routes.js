import express from "express";
import { 
  register,
  getAllUsers,
  getProfileById, 
  updateProfileById, 
  deleteProfileById, 
  login, 
  loginWithGoogle,
  getGoogleAuthUrl, 
  googleCallback, 
  forgotPassword, 
  resetPassword, 
  verifyOTP
} from "../controllers/User_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";
import authenticateToken from "../../middlewares/auth.js";


const router = express.Router();

 // Routes
 router.post('/register',validateRequest, register);
 // Danh sách users (nếu không cần admin, có thể ẩn hoặc giữ cho dev). Để đơn giản: yêu cầu đăng nhập.
 router.get('/', authenticateToken, getAllUsers);
 // Debug: xem user hiện tại lấy từ token/DB
 router.get('/me', authenticateToken, (req, res) => {
   res.json({ success: true, user: req.user });
 });
 // Bỏ các route admin/debug/bootstrap
 router.put('/:id',validateRequest,authenticateToken,updateProfileById);
 router.get('/:id',authenticateToken,getProfileById);
router.delete('/:id',authenticateToken,deleteProfileById)

// Bỏ các route admin: cập nhật role, toggle active

// Route đăng nhập (email/sđt + password)
router.post("/login", validateRequest, login);

// Route đăng nhập bằng Google
router.post("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);
router.get("/google/auth-url", getGoogleAuthUrl); 

//Quên mật khẩu - forgot lấy mã từu mail , rồi nhập otp rồi đổi mật khẩu qua resetpassword
router.post("/forgotpassword", forgotPassword); // gửi OTP
router.post('/verifyOTP', verifyOTP);// Xác thực OTP
router.post("/resetpassword", resetPassword);   // reset password với mã verify OTP

export default router;