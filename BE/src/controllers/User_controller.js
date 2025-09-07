import User from '../models/User.js';

import { validationResult } from 'express-validator';

// Đăng ký user mới 
const register = async (req, res) => {
  try {

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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error server, please try again'
    });
  }
};

// lấy danh sách user
const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select('-password'); // Ẩn trường password
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Failed to get user list:', error);
    res.status(500).json({
      success: false,
      message: 'Error server, please try again'
    });
  }
};

const getProfileById = async (req, res) => {
  const userId = req.params.id;
  try {
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
  } catch (error) {
    console.error("Get profile by ID error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error server",
    });
  }
};

const updateProfileById = async (req, res) => {
  try {
    // Kiểm tra validation errors 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data is not valid",
        errors: errors.array(),
      });
    }

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

    // Đánh dấu các trường đã được sửa đổi
    user.markModified('name');
    user.markModified('email');
    user.markModified('phone');

    // Lưu user với trường được thay đổi
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
  } catch (error) {
    console.error("Update profile by ID error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error server",
    });
  }
};

const deleteProfileById = async (req, res) => {
  const userId = req.params.id; 
  try {
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
  } catch (error) {
    console.error("Delete user by ID error:", error.message);
    res.status(500).json({  
      success: false,
      message: "Lỗi server",
    });
  }
};
export  { register, getAllUsers, getProfileById, updateProfileById, deleteProfileById };
