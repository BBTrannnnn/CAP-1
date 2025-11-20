import User from '../models/User.js';
import asyncHandler from 'express-async-handler';

// API để mobile app đăng ký FCM token
const registerFCMToken = asyncHandler(async (req, res) => {
  const { token, device, deviceId } = req.body;
  const userId = req.user.id;

  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: 'FCM token is required' 
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  // Kiểm tra token đã tồn tại chưa
  const existingTokenIndex = user.fcmTokens.findIndex(t => t.token === token);

  if (existingTokenIndex >= 0) {
    // Update lastUsed nếu token đã tồn tại
    user.fcmTokens[existingTokenIndex].lastUsed = new Date();
  } else {
    // Thêm token mới
    user.fcmTokens.push({
      token,
      device: device || 'unknown',
      deviceId: deviceId || null,
      lastUsed: new Date()
    });
  }

  await user.save();

  res.json({
    success: true,
    message: 'FCM token registered successfully',
    totalDevices: user.fcmTokens.length
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