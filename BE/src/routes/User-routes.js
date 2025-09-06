import express from "express";
import { body } from "express-validator";
import { register,getAllUsers,getProfileById, updateProfileById,deleteUserById} from "../controllers/User_controller.js";

const router = express.Router();
// Route đăng ký user mới
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
  body("province")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Tên tỉnh/thành phố phải có từ 2-50 ký tự"),
];
 // Routes
 router.post('/register', registerValidation, register);
 router.get('/getAllUsers',getAllUsers);
 router.put('/profile/:id',updateProfileValidation,updateProfileById);
 router.get('/profile/:id',getProfileById);
 router.delete('/:id',deleteUserById);

export default router;