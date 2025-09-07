import User from '../models/User.js';
import asyncHandler from "express-async-handler";

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
    message: "Delete user successfully",
  });
});

export { register, getAllUsers, getProfileById, updateProfileById, deleteProfileById };
