import express from "express";
import { register,getAllUsers,getProfileById, updateProfileById,deleteProfileById,login, loginWithGoogle,googleCallback } from "../controllers/User_controller.js";
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
// Route lấy dữ liệu thời tiết
router.get("/weather", getWeather);
export default router;