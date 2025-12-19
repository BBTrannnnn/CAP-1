import User from '../models/User.js';
import streakProtectionService from '../services/streakProtectionService.js';
import {Habit,HabitSubTracking,HabitTracking} from '../models/Habit.js';
import { updateHabitStats } from '../controllers/Habit_controller.js';
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
    const { habitId, date } = req.body; 

    if (!habitId) {
        return res.status(400).json({
            success: false,
            message: 'habitId is required'
        });
    }

    // 1. Kiểm tra user
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

    // 2. Kiểm tra habit
    const habit = await Habit.findOne({ 
        _id: habitId, 
        userId: req.user.id, 
        isActive: true 
    });

    if (!habit) {
        return res.status(404).json({
            success: false,
            message: 'Habit not found'
        });
    }

    // 3. ✅ Parse date (default = today)
    let targetDate;
    if (date) {
        const parts = date.split('-');
        targetDate = new Date(Date.UTC(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
            0, 0, 0, 0
        ));
    } else {
        const now = new Date();
        targetDate = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0, 0, 0, 0
        ));
    }

    // 4. ✅ Kiểm tra không được shield ngày tương lai
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (targetDate > today) {
        return res.status(400).json({
            success: false,
            message: 'Không thể shield ngày trong tương lai'
        });
    }

    // 5. ✅ Tìm tracking của ngày đó
    let tracking = await HabitTracking.findOne({
        userId: req.user.id,
        habitId: habitId,
        date: targetDate
    });

    // 6. ✅ Nếu chưa có tracking, tạo mới với status failed
    if (!tracking) {
        tracking = new HabitTracking({
            userId: req.user.id,
            habitId: habitId,
            date: targetDate,
            status: 'failed',
            isProtected: true, // ✅ Đánh dấu được shield
            notes: 'Protected by shield'
        });
    } else {
        // 7. Kiểm tra điều kiện
        if (tracking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Ngày này đã completed, không cần shield'
            });
        }

        if (tracking.isProtected) {
            return res.status(400).json({
                success: false,
                message: 'Ngày này đã được shield rồi'
            });
        }

        tracking.isProtected = true; // ✅ Đánh dấu được shield
    }

    await tracking.save();

    // 8. ✅ Trừ shield từ user
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 'inventory.streakShields': -1 },
            $push: {
                itemUsageHistory: {
                    itemType: 'streakShield',
                    habitId: habitId,
                    usedAt: new Date(),
                    autoUsed: false,
                    protectedDate: targetDate // ✅ Lưu ngày được bảo vệ
                }
            }
        },
        {
            new: true,
            runValidators: false
        }
    );

    // 9. ✅ Cập nhật habit protection status
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    habit.streakProtection = habit.streakProtection || {};
    habit.streakProtection.isProtected = true;
    habit.streakProtection.protectedUntil = tomorrow;
    habit.streakProtection.protectedBy = 'manual';
    habit.streakProtection.warningSent = false;
    await habit.save();

    // 10. ✅ Tính lại streak
    const newAchievements = await updateHabitStats(habitId, req.user.id);

    res.json({
        success: true,
        message: `🛡️ Shield đã bảo vệ ngày ${targetDate.toISOString().split('T')[0]}`,
        data: {
            tracking,
            habit: {
                id: habit._id,
                name: habit.name,
                currentStreak: habit.currentStreak,
                longestStreak: habit.longestStreak
            },
            inventory: updatedUser.inventory
        },
        ...(newAchievements && newAchievements.length > 0 && {
            newAchievements: newAchievements.map(ach => ({
                id: ach.achievementId,
                title: ach.title,
                description: ach.description,
                icon: ach.icon,
                rarity: ach.rarity,
                rewards: ach.rewards
            }))
        })
    });
});

const useFreezeToken = asyncHandler(async (req, res) => {
    const { habitId, days, startDate } = req.body;

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
    else cost = 4;

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const habit = await Habit.findById(habitId);

    if (!habit) {
        return res.status(404).json({
            success: false,
            message: 'Habit not found'
        });
    }
    
    if (user.inventory.freezeTokens < cost) {
        return res.status(400).json({
            success: false,
            message: `Không đủ Freeze Token (cần ${cost}, bạn có ${user.inventory.freezeTokens})`
        });
    }

    // Parse startDate hoặc dùng hôm nay
    let freezeStartDate;
    if (startDate) {
        const parts = startDate.split('-');
        freezeStartDate = new Date(Date.UTC(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
            0, 0, 0, 0
        ));
    } else {
        freezeStartDate = new Date();
        freezeStartDate.setUTCHours(0, 0, 0, 0);
    }

    // Validate: không freeze quá 30 ngày về trước
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - freezeStartDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
        return res.status(400).json({
            success: false,
            message: 'Không thể freeze quá 30 ngày về trước'
        });
    }

    if (freezeStartDate > today) {
        return res.status(400).json({
            success: false,
            message: 'Không thể freeze ngày trong tương lai'
        });
    }
    
    // ✅ SỬA: Tạo danh sách các ngày cần freeze
    const freezeDates = [];
    for (let i = 0; i < days; i++) {
        const freezeDate = new Date(freezeStartDate);
        freezeDate.setDate(freezeDate.getDate() + i);
        
        if (freezeDate <= today) {
            freezeDates.push(freezeDate);
        }
    }

    // ✅ SỬA: Kiểm tra các ngày đã có tracking
    const existingTrackings = await HabitTracking.find({
        userId: req.user.id,
        habitId,
        date: { $in: freezeDates }
    });

    // Tạo Set các ngày đã có tracking
    const existingDates = new Set(
        existingTrackings.map(t => t.date.toISOString().split('T')[0])
    );

    // ✅ SỬA: CHỈ tạo frozen cho ngày CHƯA CÓ tracking
    const freezePromises = [];
    let actualFrozenDays = 0;

    for (const freezeDate of freezeDates) {
        const dateStr = freezeDate.toISOString().split('T')[0];
        
        // Chỉ freeze nếu ngày này chưa có tracking
        if (!existingDates.has(dateStr)) {
            freezePromises.push(
                HabitTracking.create({
                    userId: req.user.id,
                    habitId,
                    date: freezeDate,
                    status: 'frozen',
                    notes: 'Đóng băng bằng Freeze Token',
                    completedCount: 0,
                    targetCount: 1
                })
            );
            actualFrozenDays++;
        }
    }
    
    // ✅ SỬA: Thông báo nếu không có ngày nào được freeze
    if (freezePromises.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Tất cả các ngày đã có tracking rồi. Không thể đóng băng.'
        });
    }

    await Promise.all(freezePromises);

    // Cập nhật streak sau khi freeze
    await updateHabitStats(habitId, req.user.id);

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 'inventory.freezeTokens': -cost },
            $push: {
                itemUsageHistory: {
                    itemType: 'freezeToken',
                    habitId: habit._id,
                    usedAt: new Date(),
                    autoUsed: false,
                    freezeDays: actualFrozenDays, // ✅ Số ngày thực sự bị freeze
                    cost,
                    startDate: freezeStartDate
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
        message: `Đã đóng băng ${actualFrozenDays} ngày (tốn ${cost} token)`,
        frozenDays: actualFrozenDays,
        requestedDays: days,
        inventory: updatedUser.inventory
    });
});

const useReviveToken = asyncHandler(async (req, res) => {
    const { habitId, date } = req.body;

    if (!habitId) {
        return res.status(400).json({
            success: false,
            message: 'habitId is required'
        });
    }

    if (!date) {
        return res.status(400).json({
            success: false,
            message: 'date is required (format: YYYY-MM-DD)'
        });
    }

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

    // Validate habit tồn tại
    const habit = await Habit.findById(habitId);
    if (!habit) {
        return res.status(404).json({
            success: false,
            message: 'Habit not found'
        });
    }

    // Parse date
    const parts = date.split('-');
    const targetDate = new Date(Date.UTC(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        0, 0, 0, 0
    ));

    // Validate: không hồi sinh ngày tương lai
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (targetDate >= today) {
        return res.status(400).json({
            success: false,
            message: 'Không thể hồi sinh ngày hôm nay hoặc tương lai'
        });
    }

    // Validate: không hồi sinh quá 30 ngày về trước
    const daysDiff = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
        return res.status(400).json({
            success: false,
            message: 'Chỉ có thể hồi sinh trong vòng 30 ngày gần đây'
        });
    }

    // TÌM HOẶC TẠO TRACKING RECORD
    let tracking = await HabitTracking.findOne({
        userId: req.user.id,
        habitId,
        date: targetDate
    });

    // Nếu chưa có record → TẠO MỚI với status = failed
    if (!tracking) {
        tracking = new HabitTracking({
            userId: req.user.id,
            habitId,
            date: targetDate,
            status: 'failed',
            completedCount: 0,
            targetCount: 1
        });
    }

    // Validate: chỉ hồi sinh failed hoặc skipped
    if (tracking.status !== 'failed' && tracking.status !== 'skipped') {
        return res.status(400).json({
            success: false,
            message: `Không thể hồi sinh ngày này (status: ${tracking.status})`
        });
    }

    // Validate: ngày đó chưa được bảo vệ
    if (tracking.isProtected) {
        return res.status(400).json({
            success: false,
            message: 'Ngày này đã được bảo vệ rồi'
        });
    }

    // ĐÁNH DẤU NGÀY ĐÓ ĐƯỢC BẢO VỆ
    tracking.isProtected = true;
tracking.notes = tracking.notes 
        ? `${tracking.notes} (Hồi sinh bằng Revive Token)`
        : 'Hồi sinh bằng Revive Token';
    await tracking.save();

    // CẬP NHẬT STREAK
    await updateHabitStats(habitId, req.user.id);

    // TRỪ TOKEN VÀ LƯU LỊCH SỬ - SỬA TẠI ĐÂY
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 'inventory.reviveTokens': -1 },
            $push: {
                itemUsageHistory: {
                    itemType: 'reviveToken',
                    habitId: habit._id, // SỬA: Dùng habit._id thay vì habitId
                    usedAt: new Date(),
                    autoUsed: false,
                    protectedDate: targetDate
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
        message: `Đã hồi sinh streak! Ngày ${date} được bảo vệ`,
        protectedDate: date,
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
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            $inc: { 
                'inventory.streakShields': 5,
                'inventory.freezeTokens': 3,
                'inventory.reviveTokens': 2
            }
        },
        {
            new: true,
            runValidators: false  // ✅ Bỏ qua validation
        }
    );

    res.json({
        success: true,
        message: 'Added test items: 5 shields, 3 freeze tokens, 2 revive tokens',
        inventory: updatedUser.inventory
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