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

    const result = await streakProtectionService.useShieldManually(req.user.id, habitId);

    if (!result.success) {
        return res.status(400).json(result);
    }

    res.json(result);
});

const useFreezeToken = asyncHandler(async (req, res) => {
    const { habitId, days } = req.body;

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

    const result = await streakProtectionService.useFreezeToken(req.user.id, habitId, days);

    if (!result.success) {
        return res.status(400).json(result);
    }

    res.json(result);
});

const useReviveToken = asyncHandler(async (req, res) => {
    const { habitId } = req.body;

    if (!habitId) {
        return res.status(400).json({
            success: false,
            message: 'habitId is required'
        });
    }

    const result = await streakProtectionService.useReviveToken(req.user.id, habitId);

    if (!result.success) {
        return res.status(400).json(result);
    }

    res.json(result);
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