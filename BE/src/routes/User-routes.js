import express from "express";
import { body, } from "express-validator";
import { register,getAllUsers,getProfileById, updateProfileById,deleteProfileById} from "../controllers/User_controller.js";
import { login, googleAuth, facebookAuth } from "../controllers/Auth_controller.js";
import { validateRequest } from "../../middlewares/validateReuqest.js";

const router = express.Router();
// Route đăng ký user mới
// Validation dữ liệu ở lúc request vào trước khi vào controller
 const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải có từ 2-50 ký tự'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại không hợp lệ')
 ];

  const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên phải có từ 2-50 ký tự"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("mail")
    .optional()
    .isEmail()
    .matches(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    .withMessage("Vui lòng nhập đúng định dạng email")
];
 // Routes
 router.post('/register', registerValidation,validateRequest, register);
 router.get('/getAllUsers',getAllUsers);
 router.put('/profile/:id',updateProfileValidation,updateProfileById);
 router.get('/profile/:id',getProfileById);
 router.delete('/:id',deleteProfileById);

// Validation cho login bằng email/sđt + password
const loginValidation = [
  body("identifier") // có thể là email hoặc số điện thoại
    .notEmpty()
    .withMessage("Vui lòng nhập email hoặc số điện thoại"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

// Route đăng nhập (email/sđt + password)
router.post("/login", loginValidation, validateRequest, login);

// Route đăng nhập bằng Google
router.get("/google", googleAuth);

// Route đăng nhập bằng Facebook
router.get("/facebook", facebookAuth);

export default router;