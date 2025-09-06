import User from '../models/User.js';

import { validationResult } from 'express-validator';

// Đăng ký user mới (bỏ tạo token)
const register = async (req, res) => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    const { name, phone, email, password, confirmPassword } = req.body;
    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng, vui lòng chọn email khác'
      });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được sử dụng, vui lòng chọn số khác'
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
      message: 'Đăng ký thành công',
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
      message: 'Lỗi server, vui lòng thử lại'
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
    console.error('Lấy danh sách thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại'
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
        message: "Không tìm thấy user",
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
      message: "Lỗi server",
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
        message: "Dữ liệu không hợp lệ",
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
export { register, getAllUsers, getProfileById, updateProfileById };
