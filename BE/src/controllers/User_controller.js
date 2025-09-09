import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import asyncHandler from "express-async-handler";
import passport from 'passport';
import { OAuth2Client } from "google-auth-library";
import axios from 'axios';


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

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Tìm user theo email hoặc số điện thoại
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Email does not exist, please try again!!!'
    });
  }
  //Kiểm tra user có password không (trường hợp login Google/Facebook)
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message:
        "User registered via Google/Facebook, please use that method to log in",
    });
  }
  // So sánh mật khẩu
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Password is incorrect, please try again!!!",
    });
  }
  // Tra ve du lieu user 
  res.json({
    message: "Login successfully",
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
    },
  });
});

// Phần Google Login đã được chỉnh sửa
const GOOGLE_CLIENT_ID = "803477306737-pvvd5qe1dkj602h4lkr3f5ed11tksgb4.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const loginWithGoogle = asyncHandler(async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ success: false, message: "Missing Google access token" });
  }

  // Gọi Google API để lấy user info
  const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
  if (!response.ok) {
    return res.status(400).json({ success: false, message: "Invalid Google access token" });
  }

  const googleUser = await response.json();
  if (!googleUser.email) {
    return res.status(400).json({ success: false, message: "Email not found in Google account" });
  }

  // Kiểm tra user có trong DB chưa
  let user = await User.findOne({ email: googleUser.email });
  const fakePhone = "0" + Math.floor(100000000 + Math.random() * 900000000);
  if (!user) {
    user = await User.create({
      name: googleUser.name || "Google User",
      email: googleUser.email,
      phone: fakePhone, // Số điện thoại giả
      isActive: true,
      avatar: googleUser.picture || null,
      loginProvider: "google"
    });
  }

  // Sinh JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET, // nhớ set biến này trong .env
    { expiresIn: "7d" }
  );

  // Trả về user + token cho FE
  res.json({
    success: true,
    message: "Google login thành công",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      avatar: user.avatar,
      loginProvider: user.loginProvider
    }
  });
});
// Lấy URL Google OAuth
const getGoogleAuthUrl = () => {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = 'http://localhost:5000/auth/google/callback';
  console.log("Redirect URI gửi lên Google:", redirectUri);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  return `${baseUrl}?${params.toString()}`;
};

// Callback Google chỉ lấy access_token
const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ success: false, message: "Authorization code not found" });
  }
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:5000/auth/google/callback'
    })
  });
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) {
    return res.status(400).json({ success: false, message: "Failed to get access token from Google" });
  }
  req.body = { access_token: tokens.access_token };
  await loginWithGoogle(req, res);
});

export { 
  register, 
  getAllUsers, 
  getProfileById, 
  updateProfileById, 
  deleteProfileById, 
  loginWithGoogle, 
  login,
  getGoogleAuthUrl,
  googleCallback
};
// api cua thoi tiet
export const getWeather = asyncHandler(async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ message: "City is required" });
  }

  const apiKey = "be208ad9226951969741a09021c500ae";

  try {
    // encode city để tránh lỗi URL
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching weather data", error: error.message });
  }
});

