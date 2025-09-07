import User from '../models/User.js';
import jwt from 'jsonwebtoken';
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
// dang nhap 
// dang nhap bang email/sdt + password
export const login = async (req, res) => {
  const { identifier, password } = req.body; // identifier có thể là email hoặc số điện thoại
  try {
    // Tìm user theo email hoặc số điện thoại
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }] 
    });
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
    //Tạo token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Tra ve du lieu user 
    res.json({
      message:"Dang nhap thanh cong",
      token,
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
}
import passport from 'passport';
// dang nhap bang google
export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });
// dang nhap bang facebook
export const facebookAuth = passport.authenticate('facebook', { scope: ['email'] });
export  { register, getAllUsers, getProfileById, updateProfileById, deleteProfileById };
