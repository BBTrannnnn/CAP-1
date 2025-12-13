// middlewares/auth.js
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

const authenticateToken = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy userId từ token 
    const userId = decoded?.id || decoded?._id || decoded?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Token payload invalid.' });
    }

  // Tìm user trong database (bao gồm favorites để các controller có thể sử dụng req.user.save)
  const user = await User.findById(userId).select('-password -confirmPassword');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is invalid or user is inactive.' 
      });
    }

  // Gắn trực tiếp user doc vào req để các controller (sleep, profile) có thể thao tác (populate/save)
    req.user = user;
    req.user.id = user._id.toString();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error.' 
    });
  }
};

export default authenticateToken;