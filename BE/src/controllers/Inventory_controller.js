import User from '../models/User.js';
import streakProtectionService from '../services/streakProtectionService.js';
import asyncHandler from 'express-async-handler';

const getInventory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.json({
        success: true,
        inventory: user.inventory,
        usageHistory: user.itemUsageHistory.slice(-10).reverse()
    });
});

const useShield = asyncHandler(async (req, res) => {
    const { habitId } = req.body;

    if (!habitId) {
        return res.status(400).json({
            success: false,
            message: 'habitId is required'
        });
    }

    // Kiểm tra user có đủ shield không
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.inventory.streakShields <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Không đủ Shield để sử dụng'
        });
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 'inventory.streakShields': -1 },
            $push: {
                itemUsageHistory: {
                    itemType: 'shield',
                    habitId: habitId,
                    usedAt: new Date(),
                    autoUsed: false
                }
            }
        },
        {
            new: true,
            runValidators: false
        }
    );

    res.json({
        success: true,
        message: 'Đã sử dụng Shield thành công',
        inventory: updatedUser.inventory
    });
});

const useFreezeToken = asyncHandler(async (req, res) => {
    const { habitId, days } = req.body;

    // Validate input
    if (!habitId) {
        return res.status(400).json({
            success: false,
            message: 'habitId is required'
        });
    }

    if (days === undefined || days === null) {
        return res.status(400).json({
            success: false,
            message: 'days is required (1-30)'
        });
    }

    if (days < 1 || days > 30) {
        return res.status(400).json({
            success: false,
            message: 'days phải từ 1 đến 30'
        });
    }

    // Token cost logic
    let cost = 1;
    if (days <= 5) cost = 1;
    else if (days <= 10) cost = 2;
    else if (days <= 15) cost = 3;
    else cost = 4; // 16–30

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Check habit existence + ownership
    const habit = await Habit.findById(habitId);

    if (!habit) {
        return res.status(404).json({
            success: false,
            message: 'Habit not found'
        });
    }

    if (habit.user.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thao tác habit này'
        });
    }

    // Check token balance
    if (user.inventory.freezeTokens < cost) {
        return res.status(400).json({
            success: false,
            message: `Không đủ Freeze Token (cần ${cost}, bạn có ${user.inventory.freezeTokens})`
        });
    }

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 'inventory.freezeTokens': -cost },
            $push: {
                itemUsageHistory: {
                    itemType: 'freezeToken',
                    habitId,
                    usedAt: new Date(),
                    autoUsed: false,
                    freezeDays: days,
                    cost
                }
            }
        },
        {
            new: true,
            runValidators: false
        }
    );

    res.json({
        success: true,
        message: `Đã đóng băng habit ${days} ngày (tốn ${cost} token)`,
        inventory: updatedUser.inventory
    });
});


const useReviveToken = asyncHandler(async (req, res) => {
    const { habitId } = req.body;

    if (!habitId) {
        return res.status(400).json({
            success: false,
            message: 'habitId is required'
        });
    }

    // Kiểm tra user có đủ revive token không
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.inventory.reviveTokens <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Không đủ Revive Token để sử dụng'
        });
    }

    // ✅ Update trực tiếp không qua validation
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 'inventory.reviveTokens': -1 },
            $push: {
                itemUsageHistory: {
                    itemType: 'reviveToken',
                    habitId: habitId,
                    usedAt: new Date(),
                    autoUsed: false
                }
            }
        },
        {
            new: true,
            runValidators: false
        }
    );

    res.json({
        success: true,
        message: 'Đã hồi sinh streak thành công',
        inventory: updatedUser.inventory
    });
});

const getProtectionSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.json({
        success: true,
        settings: user.streakProtectionSettings
    });
});

const updateProtectionSettings = asyncHandler(async (req, res) => {
    const { enabled, autoUseShield, minStreakToAutoProtect, notificationTime } = req.body;

    const user = await User.findById(req.user.id);

    if (enabled !== undefined) {
        user.streakProtectionSettings.enabled = enabled;
    }
    if (autoUseShield !== undefined) {
        user.streakProtectionSettings.autoUseShield = autoUseShield;
    }
    if (minStreakToAutoProtect !== undefined) {
        user.streakProtectionSettings.minStreakToAutoProtect = Math.max(1, minStreakToAutoProtect);
    }
    if (notificationTime !== undefined) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(notificationTime)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:MM (e.g., 21:00)'
            });
        }
        user.streakProtectionSettings.notificationTime = notificationTime;
    }

    await user.save();

    res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: user.streakProtectionSettings
    });
});

const testAllItems = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    user.inventory.streakShields += 5;
    user.inventory.freezeTokens += 3;
    user.inventory.reviveTokens += 2;
    await user.save();

    res.json({
        success: true,
        message: 'Added test items: 5 shields, 3 freeze tokens, 2 revive tokens',
        inventory: user.inventory
    });
});

export {
    getInventory,
    useShield,
    useFreezeToken,
    useReviveToken,
    getProtectionSettings,
    updateProtectionSettings,
    testAllItems
};