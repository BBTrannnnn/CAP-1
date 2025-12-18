import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import asyncHandler from "express-async-handler";

import { OAuth2Client } from "google-auth-library";


import sendMail from '../utils/sendMail.js';
import crypto from 'crypto';

// Admin: cập nhật vai trò user (user/moderator/admin) + trust score
const updateUserRole = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const { role, trustScore } = req.body;

  // Validate ObjectId
  if (!targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, message: 'Định dạng user ID không hợp lệ' });
  }

  // Validate role (thêm moderator)
  const allowedRoles = ['user', 'moderator', 'admin'];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Giá trị role không hợp lệ (chỉ chấp nhận: user, moderator, admin)' });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
  }

  // Không cho tự hạ cấp chính mình (tránh mất quyền quản trị)
  if (targetUser._id.toString() === req.user._id.toString() && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Bạn không thể tự hạ cấp vai trò của chính mình.' });
  }

  // Nếu đang hạ cấp một admin về user, đảm bảo vẫn còn ít nhất một admin khác
  if (targetUser.role === 'admin' && role === 'user') {
    const otherAdminsCount = await User.countDocuments({ role: 'admin', _id: { $ne: targetUser._id } });
    if (otherAdminsCount === 0) {
      return res.status(400).json({ success: false, message: 'Không thể hạ cấp admin cuối cùng trong hệ thống.' });
    }
  }

  targetUser.role = role;
  
  // Update trust score nếu có
  if (trustScore !== undefined) {
    if (trustScore < 0 || trustScore > 100) {
      return res.status(400).json({ success: false, message: 'Trust score phải từ 0-100' });
    }
    targetUser.trustScore = trustScore;
  }
  
  await targetUser.save({ validateModifiedOnly: true });

  return res.status(200).json({
    success: true,
    message: `Cập nhật vai trò thành ${role} thành công`,
    data: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      role: targetUser.role,
      trustScore: targetUser.trustScore,
      isActive: targetUser.isActive,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    },
  });
});

// Helper function để tạo JWT token (không dùng role)
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      loginProvider: user.loginProvider
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Đăng ký user mới 
const register = asyncHandler(async (req, res) => {
  // Kiểm tra validation errors từ middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, phone, email, password, confirmPassword, dateOfBirth, gender, address } = req.body;
  
  // Kiểm tra email đã tồn tại
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already in use, please choose another email!'
    });
  }

  // Kiểm tra phone đã tồn tại
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number already in use, please choose another phone number!'
    });
  }

  // Validate dateOfBirth nếu có
  let dob;
  if (dateOfBirth) {
    dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dateOfBirth format' });
    }
    const today = new Date();
    if (dob >= today) {
      return res.status(400).json({ success: false, message: 'dateOfBirth must be in the past' });
    }
  }

  // Validate gender nếu có
  let genderValue;
  if (gender) {
    const g = gender.toString().trim().toLowerCase();
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(g)) {
      return res.status(400).json({ success: false, message: 'Gender must be one of: male, female' });
    }
    genderValue = g;
  }

  const userPayload = {
    name,
    email,
    phone,
    password,
    confirmPassword,
    newUser: true,
    isActive: true
  };
  if (dob) userPayload.dateOfBirth = dob;
  if (genderValue) userPayload.gender = genderValue;
  if (address) userPayload.address = address.trim();

  const user = await User.create(userPayload);

  // Tạo JWT token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Register successfully',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        newUser: user.newUser
      }
    }
  });
});

// Lấy danh sách user (cần authentication)
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password -confirmPassword')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  res.status(200).json({
    success: true,
    message: 'Get all users successfully',
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
});

const getProfileById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Validate ObjectId
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }

  const user = await User.findById(userId).select("-password -confirmPassword");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: 'Get user profile successfully',
    data: user,
  });
});

const updateProfileById = asyncHandler(async (req, res) => {
  const { name, phone, email, gender, dateOfBirth, address } = req.body;
  const userId = req.params.id;

  // Validate ObjectId
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Chỉ cho phép chủ sở hữu hoặc admin cập nhật
  const isOwner = req.user?._id?.toString() === userId;
  const isAdmin = req.user?.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền cập nhật hồ sơ của người khác',
    });
  }

  // Cập nhật name nếu có
  if (name && name.trim()) {
    user.name = name.trim();
  }

  // Kiểm tra và cập nhật email
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ 
      email, 
      _id: { $ne: userId } 
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already in use by another user",
      });
    }
    user.email = email;
  }

  // Kiểm tra và cập nhật phone
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({ 
      phone, 
      _id: { $ne: userId } 
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use by another user",
      });
    }
    user.phone = phone;
  }

  // Cập nhật dateOfBirth nếu có
  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format for date of birth",
      });
    }
    const today = new Date();
    if (birthDate >= today) {
      return res.status(400).json({
        success: false,
        message: "Date of birth must be in the past",
      });
    }
    user.dateOfBirth = birthDate;
  }

  // Cập nhật gender nếu có
  if (gender) {
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Gender must be one of: male, female",
      });
    }
    user.gender = gender.toLowerCase();
  }

  // Cập nhật address nếu có
  if (address !== undefined) {
    user.address = address.trim();
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});


const deleteProfileById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Validate ObjectId
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }

  // Tìm user trước khi xóa để kiểm tra quyền
  const target = await User.findById(userId);
  if (!target) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Chỉ cho phép chủ sở hữu hoặc admin xóa
  const isOwner = req.user?._id?.toString() === userId;
  const isAdmin = req.user?.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền xóa tài khoản của người khác',
    });
  }

  const user = await User.findByIdAndDelete(userId);

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


// Admin dashboard: thống kê nhanh
const getDashboard = asyncHandler(async (req, res) => {
  // Tổng users
  const totalUsers = await User.countDocuments();
  // Tổng admins
  const totalAdmins = await User.countDocuments({ role: 'admin' });
  // Tổng users active
  const totalActive = await User.countDocuments({ isActive: true });
  // Lấy 10 users mới nhất
  const recentUsers = await User.find()
    .select('-password -confirmPassword')
    .sort({ createdAt: -1 })
    .limit(10);

  // Phân bố theo role (dạng { role: count })
  const roleAgg = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);
  const roleDistribution = {};
  roleAgg.forEach(r => { roleDistribution[r._id || 'unknown'] = r.count; });

  // Phân bố active vs inactive
  const activeAgg = await User.aggregate([
    { $group: { _id: '$isActive', count: { $sum: 1 } } }
  ]);
  const activeDistribution = { active: 0, inactive: 0 };
  activeAgg.forEach(a => {
    if (a._id === true) activeDistribution.active = a.count;
    else activeDistribution.inactive = a.count;
  });

  // Thống kê đăng ký 30 ngày gần nhất (theo ngày YYYY-MM-DD)
  const now = new Date();
  const past30 = new Date(now);
  past30.setDate(past30.getDate() - 29); // include today => 30 days

  const signups = await User.aggregate([
    { $match: { createdAt: { $gte: new Date(past30.setHours(0,0,0,0)) } } },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
    } },
    { $sort: { _id: 1 } }
  ]);

  // Build array for last 30 days with zero-fill
  const signupsLast30Days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0,10);
    const found = signups.find(s => s._id === key);
    signupsLast30Days.push({ date: key, count: found ? found.count : 0 });
  }

  res.status(200).json({
    success: true,
    message: 'Dashboard stats',
    data: {
      totalUsers,
      totalAdmins,
      totalActive,
      roleDistribution,
      activeDistribution,
      signupsLast30Days,
      recentUsers,
    }
  });
});

// Đăng nhập user
const login = asyncHandler(async (req, res) => {
  // Kiểm tra validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  if (!password || password.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Password is not Null!'
    });
  }

  // Tìm user theo email
  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Nếu user chưa có password (ví dụ đăng ký bằng OAuth), yêu cầu reset/set password
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: 'This account does not have a password. Please set or reset your password.'
    });
  }

  // So sánh mật khẩu
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  // Tạo JWT token
  const token = generateToken(user);

  // Kiểm tra và cập nhật newUser flag nếu đây là lần đăng nhập đầu tiên
  let isNewUser = user.newUser || false;
  if (user.newUser) {
    user.newUser = false; // Đánh dấu user đã không còn mới sau lần đăng nhập đầu tiên
    await user.save({ validateModifiedOnly: true });
  }

  // Trả về dữ liệu user
  res.json({
    success: true,
    message: "Login successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      isActive: user.isActive,
      loginProvider: user.loginProvider,
      newUser: isNewUser
    },
  });
});

// Google Login Configuration
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "803477306737-pvvd5qe1dkj602h4lkr3f5ed11tksgb4.apps.googleusercontent.com";
// const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// const loginWithGoogle = asyncHandler(async (req, res) => {
//   const { access_token } = req.body;
  
//   if (!access_token) {
//     return res.status(400).json({ 
//       success: false, 
//       message: "Missing Google access token" 
//     });
//   }

//   try {
//     // Gọi Google API để lấy user info
//     const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
    
//     if (!response.ok) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid Google access token" 
//       });
//     }

//     const googleUser = await response.json();
    
//     if (!googleUser.email) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Email not found in Google account" 
//       });
//     }

//     // Kiểm tra user có trong DB chưa
//     let user = await User.findOne({ email: googleUser.email });

//     if (!user) {
//       // Tạo số điện thoại giả duy nhất
//       let fakePhone;
//       let isPhoneUnique = false;
      
//       while (!isPhoneUnique) {
//         fakePhone = "0" + Math.floor(100000000 + Math.random() * 900000000);
//         const existingPhone = await User.findOne({ phone: fakePhone });
//         if (!existingPhone) {
//           isPhoneUnique = true;
//         }
//       }

//       user = await User.create({
//         name: googleUser.name || "Google User",
//         email: googleUser.email,
//         phone: fakePhone,
//         isActive: true,
//         avatar: googleUser.picture || null,
//         loginProvider: "google"
//       });
//     } else {
//       // Cập nhật thông tin nếu user đã tồn tại
//       if (user.loginProvider !== 'google') {
//         return res.status(400).json({
//           success: false,
//           message: "This email is already registered with a local account. Please use email/password login."
//         });
//       }
      
//       // Cập nhật avatar nếu có
//       if (googleUser.picture && !user.avatar) {
//         user.avatar = googleUser.picture;
//         await user.save();
//       }
//     }

//     // Sinh JWT token
//     const token = generateToken(user);

//     // Trả về user + token cho FE
//     res.json({
//       success: true,
//       message: "Google login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         isActive: user.isActive,
//         avatar: user.avatar,
//         loginProvider: user.loginProvider,
//         phone: user.phone
//       }
//     });
//   } catch (error) {
//     console.error('Google login error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error during Google login"
//     });
//   }
// });

// Lấy URL Google OAuth
// const getGoogleAuthUrl = (req, res) => {
//   const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
//   const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/users/google/callback';
  
//   const params = new URLSearchParams({
//     client_id: GOOGLE_CLIENT_ID,
//     redirect_uri: redirectUri,
//     scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
//     response_type: 'code',
//     access_type: 'offline',
//     prompt: 'consent'
//   });

//   res.json({
//     success: true,
//     authUrl: `${baseUrl}?${params.toString()}`
//   });
// };


// Callback Google
// const googleCallback = asyncHandler(async (req, res) => {
//   const { code } = req.query;

//   if (!code) {
//     return res.status(400).json({ 
//       success: false, 
//       message: "Authorization code not found" 
//     });
//   }

//   try {
//     // Đổi code lấy access_token
//     const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//       body: new URLSearchParams({
//         client_id: process.env.GOOGLE_CLIENT_ID,
//         client_secret: process.env.GOOGLE_CLIENT_SECRET,
//         code,
//         grant_type: 'authorization_code',
//         redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/users/google/callback'
//       })
//     });

//     const tokens = await tokenResponse.json();
//     if (!tokens.access_token) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Failed to get access token from Google" 
//       });
//     }

//     // Gọi API userinfo
//     const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
//     const googleUser = await userInfoRes.json();

//     if (!googleUser.email) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Email not found in Google account" 
//       });
//     }

//     // Kiểm tra user trong DB
//     let user = await User.findOne({ email: googleUser.email });

//     if (!user) {
//       // Tạo số điện thoại giả duy nhất
//       let fakePhone;
//       let isPhoneUnique = false;
//       while (!isPhoneUnique) {
//         fakePhone = "0" + Math.floor(100000000 + Math.random() * 900000000);
//         const existingPhone = await User.findOne({ phone: fakePhone });
//         if (!existingPhone) {
//           isPhoneUnique = true;
//         }
//       }

//       user = await User.create({
//         name: googleUser.name || "Google User",
//         email: googleUser.email,
//         phone: fakePhone,
//         isActive: true,
//         avatar: googleUser.picture || null,
//         loginProvider: "google"
//       });
//     } else {
//       if (user.loginProvider !== 'google') {
//         return res.status(400).json({
//           success: false,
//           message: "This email is already registered with a local account. Please login with email/password."
//         });
//       }
//       if (googleUser.picture && !user.avatar) {
//         user.avatar = googleUser.picture;
//         await user.save();
//       }
//     }

//     // Sinh JWT
//     const token = generateToken(user);

//     // Trả luôn token + user về FE
//     res.json({
//       success: true,
//       message: "Google login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         isActive: user.isActive,
//         avatar: user.avatar,
//         loginProvider: user.loginProvider,
//         phone: user.phone
//       }
//     });

//   } catch (error) {
//     console.error('Google callback error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error during Google authentication"
//     });
//   }
// });


// Logout (để clear token ở client side)
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Missing Email' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Tạo OTP 6 số
  const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = resetOTP;
  user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  user.isOTPVerified = false;
  await user.save();

  // Gửi email OTP
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Đặt lại mật khẩu</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã OTP sau để xác thực:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">
          ${resetOTP}
        </h1>
      </div>
      <p style="color: #666;">Mã OTP này có hiệu lực trong <strong>10 phút</strong>.</p>
      <p style="color: #666;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">Email này được gửi từ FLOW STATE</p>
    </div>
  `;

  const data = {
    email,
    html,
    subject: "Mã OTP đặt lại mật khẩu"
  };
  await sendMail(data);
  return res.status(200).json({
    success: true,
    message: 'Mã OTP đã được gửi về email của bạn',
  });
});

//xac thực OTP - nhập email + otp
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Missing email or OTP'
    });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại' });

  if (
    !user.resetOTP ||
    !user.resetOTPExpires ||
    user.resetOTP !== otp ||
    user.resetOTPExpires < Date.now()
  ) {
    return res.status(400).json({
      success: false,
      message: 'OTP của bạn không hợp lệ hoặc đã hết hạn'
    });
  }

  user.isOTPVerified = true;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'OTP xác thực thành công'
  });
});

//reset password - nhập email + mat khau moi + xac nhan mat khau
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Missing inputs: email, password, and confirmPassword are required'
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
    });
  }
  
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại' });

  if (!user.isOTPVerified) {
    return res.status(400).json({
      success: false,
      message: 'Bạn chưa xác thực OTP'
    });
  }


  user.password = password;
  user.resetOTP = undefined;
  user.resetOTPExpires = undefined;
  user.isOTPVerified = false;

  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Cập nhật mật khẩu thành công'
  });
});

// Xem public profile của người dùng khác (không cần auth, trả về thông tin công khai)
const getPublicProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'ID người dùng không hợp lệ'
    });
  }

  const user = await User.findById(userId).select('name email avatar bio createdAt');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng không tồn tại'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

export { 
  register, 
  getAllUsers, 
  getProfileById, 
  updateProfileById, 
  getDashboard,
  deleteProfileById, 
  //loginWithGoogle, 
  login,
  logout,
  //getGoogleAuthUrl,
  //googleCallback,
  forgotPassword,
  resetPassword,
  verifyOTP,
  updateUserRole,
  getPublicProfile,
};

