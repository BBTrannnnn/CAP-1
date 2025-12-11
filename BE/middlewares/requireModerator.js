// Require Moderator Middleware
// Check if user has admin or moderator role

export const requireModerator = (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        // Check if user is moderator or admin
        if (user.role !== 'moderator' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập chức năng này',
                details: {
                    requiredRole: 'moderator hoặc admin',
                    yourRole: user.role
                }
            });
        }

        next();
    } catch (error) {
        console.error('requireModerator middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực quyền'
        });
    }
};

// Check if user can bypass moderation (admin/moderator only)
export const canBypassModeration = (user) => {
    return user && (user.role === 'admin' || user.role === 'moderator');
};

export default {
    requireModerator,
    canBypassModeration
};
