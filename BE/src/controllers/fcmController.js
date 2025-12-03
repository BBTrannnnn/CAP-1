import User from '../models/User.js';
import asyncHandler from 'express-async-handler';

// API để mobile app đăng ký FCM token
const registerFCMToken = asyncHandler(async (req, res) => {
  const { token, device, deviceId } = req.body;
  const userId = req.user.id;

  // 1. Validate FCM token
  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: 'FCM token is required' 
    });
  }

  // 2. Kiểm tra user (không query password fields)
  const user = await User.findById(userId).select('-password -confirmPassword');
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  // 3. Kiểm tra token đã tồn tại chưa
  const existingTokenIndex = user.fcmTokens?.findIndex(t => t.token === token) ?? -1;

  if (existingTokenIndex >= 0) {
    // 4a. Update lastUsed nếu token đã tồn tại
    user.fcmTokens[existingTokenIndex].lastUsed = new Date();
    user.fcmTokens[existingTokenIndex].device = device || user.fcmTokens[existingTokenIndex].device;
    user.fcmTokens[existingTokenIndex].deviceId = deviceId || user.fcmTokens[existingTokenIndex].deviceId;
  } else {
    // 4b. Thêm token mới
    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }
    user.fcmTokens.push({
      token,
      device: device || 'unknown',
      deviceId: deviceId || null,
      lastUsed: new Date()
    });
  }

  // 5. Lưu với runValidators: false để tránh validate confirmPassword
  await user.save({ validateBeforeSave: false });

  // 6. Response theo format chuẩn
  res.json({
    success: true,
    message: '📱 FCM token registered successfully',
    data: {
      totalDevices: user.fcmTokens.length,
      currentDevice: {
        token: token.substring(0, 20) + '...', // Chỉ hiển thị một phần token
        device: device || 'unknown',
        deviceId: deviceId || null
      }
    }
  });
});

// API để xóa FCM token (khi user logout hoặc uninstall app)
const unregisterFCMToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: 'FCM token is required' 
    });
  }

  const result = await User.findByIdAndUpdate(
    userId,
    { $pull: { fcmTokens: { token } } },
    { new: true }
  );

  if (!result) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  res.json({
    success: true,
    message: 'FCM token unregistered successfully',
    totalDevices: result.fcmTokens.length
  });
});

// API để xem tất cả devices đã đăng ký
const getUserDevices = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select('fcmTokens');
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  const devices = user.fcmTokens.map(t => ({
    device: t.device,
    deviceId: t.deviceId,
    registeredAt: t.createdAt,
    lastUsed: t.lastUsed,
    tokenPreview: t.token.substring(0, 20) + '...'
  }));

  res.json({
    success: true,
    totalDevices: devices.length,
    devices
  });
});

export {
  registerFCMToken,
  unregisterFCMToken,
  getUserDevices
};