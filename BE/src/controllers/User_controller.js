import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import asyncHandler from "express-async-handler";
import passport from 'passport';
import { OAuth2Client } from "google-auth-library";


// Đăng ký user mới 
const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, confirmPassword } = req.body;
  // Kiểm tra email đã tồn tại
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already in use, please choose another email!!!'
    });
  }
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number already in use , please choose another phone number!!!'
    });
  }
  // Tạo user mới
  const user = await User.create({
    name,
    email,
    phone,
    password,
    confirmPassword,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: 'Register successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// lấy danh sách user
const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password'); // Ẩn trường password
  res.status(200).json({
    success: true,
    message: 'Get all users successfully',
    data: users
  });
});

const getProfileById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User is not exist",
    });
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

const updateProfileById = asyncHandler(async (req, res) => {
  const { name, phone, email } = req.body;
  const userId = req.params.id;

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User is not exist",
    });
  }

  if (name) user.name = name;
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }
    user.email = email;
  }

  // Kiểm tra phone có bị trùng với user khác không
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }
    user.phone = phone;
  }

  user.markModified('name');
  user.markModified('email');
  user.markModified('phone');

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Update profile successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});
const deleteProfileById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Not found user",
    });
  }
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});
// dang nhap 
// dang nhap bang email/sdt + password
const login = async (req, res) => {
  const { email, password } = req.body; // identifier có thể là email hoặc số điện thoại
  try {
    // Tìm user theo email hoặc số điện thoại
    const user = await User.findOne({email});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email hoac sdt khong ton tai, vui long dang nhap lai!!!'
      });
    }
     //Kiểm tra user có password không (trường hợp login Google/Facebook)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "User không có mật khẩu, vui lòng đăng nhập bằng Google hoặc Facebook",
      });
    }
    // So sánh mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu không đúng, vui lòng thử lại",
      });
    }
    // Tra ve du lieu user 
    res.json({
      message:"Dang nhap thanh cong",
      user:{
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
    });
  }
};

const GOOGLE_CLIENT_ID = "407408718192.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// dang nhap bang google
const loginWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Missing Google ID token" });
    }
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      // Truyền giá trị mặc định cho các trường required
      user = await User.create({
        name: name || "Google User",
        email,
        phone: "0000000000", // Số điện thoại mặc định
        password: "google_default_password", // Mật khẩu mặc định
        confirmPassword: "google_default_password", // Xác nhận mật khẩu mặc định
        isActive: true
      });
    }

    res.json({
      success: true,
      message: "Google login thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// dang nhap bang facebook
//export const facebookAuth = passport.authenticate('facebook', { scope: ['email'] });
export { register, getAllUsers, getProfileById, updateProfileById, deleteProfileById, loginWithGoogle, login };