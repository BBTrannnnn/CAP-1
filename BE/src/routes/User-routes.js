import express from "express";
import { register,getAllUsers,getProfileById, updateProfileById,deleteProfileById,login, loginWithGoogle,getGoogleAuthUrl,googleCallback,forgotPassword, resetPassword} from "../controllers/User_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";
import authenticateToken from "../../middlewares/auth.js";


const router = express.Router();

 // Routes
 router.post('/register',validateRequest, register);
 router.get('/',getAllUsers);
 router.put('/:id',validateRequest,authenticateToken,updateProfileById);
 router.get('/:id',authenticateToken,getProfileById);
 router.delete('/:id',authenticateToken,deleteProfileById)

// Route đăng nhập (email/sđt + password)
router.post("/login", validateRequest, login);

// Route đăng nhập bằng Google
router.post("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);
router.get("/google/auth-url", getGoogleAuthUrl); 

//Quên mật khẩu - forgot lấy mã từu mail rồi xác nhận qua resetpassword
router.post("/forgotpassword", forgotPassword); // gửi OTP
router.post("/resetpassword", resetPassword);   // reset password với mã verify OTP

export default router;