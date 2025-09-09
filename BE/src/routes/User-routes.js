import express from "express";
import { register,getAllUsers,getProfileById, updateProfileById,deleteProfileById,login, loginWithGoogle,googleCallback, forgotPassword, resetPassword } from "../controllers/User_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";
import passport from 'passport';
import { getWeather} from "../controllers/User_controller.js";
const router = express.Router();

 // Routes
 router.post('/register',validateRequest, register);
 router.get('/getAllUsers',getAllUsers);
 router.put('/profile/:id',validateRequest,updateProfileById);
 router.get('/profile/:id',getProfileById);
 router.delete('/:id',deleteProfileById)

// Route đăng nhập (email/sđt + password)
router.post("/login", validateRequest, login);

// Route đăng nhập bằng Google
router.post("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);


// Quên mật khẩu - forgot lấy mã từu mail rồi xác nhận qua resetpassword
router.post("/forgotpassword", forgotPassword); // gửi OTP
router.post("/resetpassword", resetPassword);   // reset password với mã verify OTP



// Route lấy dữ liệu thời tiết
router.get("/weather", getWeather);
export default router;