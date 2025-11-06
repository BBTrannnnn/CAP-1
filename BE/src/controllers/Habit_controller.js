import asyncHandler from 'express-async-handler';
import { Habit, HabitTracking, HabitTemplate, HabitSubTracking, HabitGoal, HabitReminder } from '../models/Habit.js';
import { UserAnalysis } from '../models/Survey.js';

// ==================== CRUD Operations ====================

const getUserHabits = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const habits = await Habit.find({ userId, isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .populate('suggestionId');

  // Calculate today's progress for each habit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const habitsWithProgress = await Promise.all(habits.map(async (habit) => {
    const todayTracking = await HabitTracking.findOne({
      userId,
      habitId: habit._id,
      date: today
    });

    return {
      ...habit.toObject(),
      todayStatus: todayTracking ? todayTracking.status : 'pending',
      todayCompleted: todayTracking ? todayTracking.status === 'completed' : false
    };
  }));

  res.json({
    success: true,
    habits: habitsWithProgress
  });
});

//     Create new habit
const createHabit = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    description,
    icon,
    color,
    frequency,
    customFrequency,

    category,
    habitType,
    startDate,
    endDate,
    trackingMode,
    targetCount,
    unit,

    isFromSuggestion,
    suggestionId
  } = req.body;

  // 🧩 Validate bắt buộc
  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name and category are required.'
    });
  }

  // 🧩 Validate cho trackingMode
  if (!['check', 'count'].includes(trackingMode || 'check')) {
    return res.status(400).json({
      success: false,
      message: 'trackingMode must be "check" or "count".'
    });
  }

  // Nếu là count mà không có targetCount -> lỗi
  if (trackingMode === 'count' && !targetCount) {
    return res.status(400).json({
      success: false,
      message: 'Please provide targetCount for "count" tracking habits.'
    });
  }

  // Lấy số thứ tự của habit để sắp xếp UI
  const habitCount = await Habit.countDocuments({ userId, isActive: true });

  // 🧩 Tạo habit mới
  const newHabit = new Habit({
    userId,
    name,
    description,
    icon: icon,
    color: color,
    frequency: frequency || 'daily',
    customFrequency,

    category,
    habitType: habitType || 'build',

    // Tracking logic
    trackingMode: trackingMode || 'check',
    targetCount: trackingMode === 'count' ? targetCount : 1,
    unit: trackingMode === 'count' ? unit || '' : '',

    startDate: startDate || Date.now(),
    endDate,

    isFromSuggestion: isFromSuggestion || false,
    suggestionId,
    order: habitCount
  });

  await newHabit.save();

  // Cập nhật template (nếu có)
  if (suggestionId) {
    await HabitTemplate.findByIdAndUpdate(suggestionId, {
      $inc: { usageCount: 1 }
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Habit created successfully',
    habit: newHabit
  });
});


//    Update habit
const updateHabit = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  const allowedUpdates = [
    'name', 'description', 'icon', 'color',
    'frequency', 'customFrequency',
    'category', 'habitType',
    'trackingMode', 'targetCount', 'unit',
    'startDate', 'endDate',
    'isActive',
  ];

  const body = req.body || {};
  const updates = {};
  allowedUpdates.forEach(field => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  });

  // Determine resulting trackingMode after update
  const resultingTrackingMode = updates.trackingMode || habit.trackingMode || 'check';
  if (!['check', 'count'].includes(resultingTrackingMode)) {
    return res.status(400).json({
      success: false,
      message: 'trackingMode must be "check" or "count"'
    });
  }

  // Frequency/customFrequency consistency
  if (updates.frequency) {
    const freq = updates.frequency;
    if (!['daily', 'weekly', 'monthly', 'custom'].includes(freq)) {
      return res.status(400).json({ success: false, message: 'frequency must be one of daily, weekly, monthly, custom' });
    }
    if (freq !== 'custom') {
      // Clear customFrequency if switching away from custom
      updates.customFrequency = undefined;
    } else {
      // Require customFrequency when using custom
      if (body.customFrequency === undefined && habit.customFrequency === undefined) {
        return res.status(400).json({ success: false, message: 'customFrequency is required when frequency is custom' });
      }
    }
  } else if (updates.customFrequency !== undefined) {
    // If client sends customFrequency without setting frequency to custom, ensure current or updated is custom
    const effFreq = updates.frequency || habit.frequency;
    if (effFreq !== 'custom') {
      return res.status(400).json({ success: false, message: 'customFrequency can only be set when frequency is custom' });
    }
  }

  // Date validations
  if (updates.startDate && updates.endDate) {
    const s = new Date(updates.startDate);
    const e = new Date(updates.endDate);
    if (!isNaN(s) && !isNaN(e) && s > e) {
      return res.status(400).json({ success: false, message: 'startDate must be before or equal to endDate' });
    }
  }

  // Enforce rules based on trackingMode
  if (resultingTrackingMode === 'check') {
    // Disallow targetCount/unit when in check mode
    if (body.targetCount !== undefined || body.unit !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'targetCount and unit are not allowed for check trackingMode'
      });
    }
    // Normalize: ensure DB fields are reset for check mode
    updates.targetCount = 1;
    updates.unit = '';
  } else if (resultingTrackingMode === 'count') {
    // Require positive targetCount if changing to or already in count mode and client tries to set it
    const tc = body.targetCount !== undefined ? body.targetCount : habit.targetCount;
    if (tc === undefined || tc === null || Number(tc) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'targetCount must be a positive number for count trackingMode'
      });
    }
    updates.targetCount = Number(tc);

    // Validate unit (allow some common values but keep flexible)
    const allowedUnits = ['times', 'reps', 'pages', 'ml', 'km', 'minute', 'phút', 'lần', 'custom', ''];
    const effUnit = body.unit !== undefined ? String(body.unit) : (habit.unit || '');
    if (effUnit === '') {
      // unit is optional; keep empty allowed but client can provide
      updates.unit = '';
    } else {
      updates.unit = effUnit;
      // If you want strict list, uncomment below:
      // if (!allowedUnits.includes(effUnit)) {
      //   return res.status(400).json({ success: false, message: `unit must be one of: ${allowedUnits.join(', ')}` });
      // }
    }
  }

  // Apply update
  const updatedHabit = await Habit.findByIdAndUpdate(
    habitId,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Habit updated successfully',
    habit: updatedHabit
  });
});

//     Delete habit 
const deleteHabit = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }
  await Habit.findByIdAndDelete(habitId, { isActive: false });

  res.json({
    success: true,
    message: 'Habit deleted successfully'
  });
});

// ==================== Tracking Operations ====================

// @desc    Track habit completion
// @route   POST /api/habits/:habitId/track
// @access  Private
const trackHabit = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { status, notes, date ,mood} = req.body;

  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // ⚠️ VALIDATION MỚI - CHỈ CHO CHECK MODE
  if (habit.trackingMode === 'count') {
    return res.status(400).json({
      success: false,
      message: 'This habit uses count tracking mode.'
    });
  }

  const allowedStatuses = ['completed', 'skipped', 'failed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
    });
  }


  const trackingDate = date ? new Date(date) : new Date();
  trackingDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (trackingDate > today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot track future dates'
    });
  }

  try {
    const tracking = await HabitTracking.findOneAndUpdate(
      { userId, habitId, date: trackingDate },
      {
        status,
        completedAt: status === 'completed' ? new Date() : null,
        completedCount: status === 'completed' ? 1 : 0, 
        notes: notes || '',
        mood: mood || null
      },
      { upsert: true, new: true }
    );

    await updateHabitStats(habitId, userId);

    res.json({
      success: true,
      message: `Habit ${status} successfully`,
      tracking
    });

  } catch (error) {
    if (error.code === 11000) {
      const existingTracking = await HabitTracking.findOneAndUpdate(
        { userId, habitId, date: trackingDate },
        {
          status,
          notes,
          mood,
          completedAt: status === 'completed' ? new Date() : null,
          completedCount: status === 'completed' ? 1 : 0
        },
        { new: true }
      );

      await updateHabitStats(habitId, userId);

      return res.json({
        success: true,
        message: `Habit marked as ${status}`,
        tracking: existingTracking
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error tracking habit',
      error: error.message
    });
  }
});

const getHabitTrackings = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { date, from, to, status, limit = 30, page = 1 } = req.query;

  // Verify habit exists
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Build query
  let query = { userId, habitId };

  // Filter by specific date
  if (date) {
    const filterDate = new Date(date);
    filterDate.setHours(0, 0, 0, 0);
    query.date = filterDate;
  }
  // Filter by date range
  else if (from || to) {
    query.date = {};
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      query.date.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.date.$lte = toDate;
    }
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get tracking records
  const trackings = await HabitTracking.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await HabitTracking.countDocuments(query);

  // Format response based on tracking mode
  const formatted = trackings.map(t => {
    const base = {
      id: t._id,
      date: new Date(t.date).toISOString().split('T')[0],
      status: t.status,
      notes: t.notes || '',
      mood: t.mood || null,
      completedAt: t.completedAt,
      createdAt: t.createdAt
    };

    // Thêm thông tin count cho COUNT mode
    if (habit.trackingMode === 'count') {
      base.completedCount = t.completedCount;
      base.targetCount = t.targetCount;
      base.progress = `${t.completedCount}/${t.targetCount}`;
      base.progressPercentage = Math.round((t.completedCount / t.targetCount) * 100);
    }

    return base;
  });

  // Calculate statistics
  const stats = {
    total: total,
    completed: trackings.filter(t => t.status === 'completed').length,
    inProgress: trackings.filter(t => t.status === 'in-progress').length,
    skipped: trackings.filter(t => t.status === 'skipped').length,
    failed: trackings.filter(t => t.status === 'failed').length,
    pending: trackings.filter(t => t.status === 'pending').length
  };

  // Add completion rate
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100);
  }

  res.json({
    success: true,
    habit: {
      id: habit._id,
      name: habit.name,
      trackingMode: habit.trackingMode,
      unit: habit.unit || 'lần',
      targetCount: habit.targetCount
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1
    },
    stats,
    filters: {
      date: date || null,
      from: from || null,
      to: to || null,
      status: status || null
    },
    trackings: formatted
  });
});

const updateHabitTracking = asyncHandler(async (req, res) => {
  const { habitId, trackingId } = req.params;
  const userId = req.user.id;
  const { status, notes, mood, completedAt } = req.body;

  // 1. Verify habit exists and is CHECK mode
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // ⚠️ CHỈ CHO CHECK MODE
  if (habit.trackingMode === 'count') {
    return res.status(400).json({
      success: false,
      message: 'This endpoint is for check mode only. Use sub-tracking endpoints for count mode.'
    });
  }

  // 2. Find tracking record
  const tracking = await HabitTracking.findOne({
    _id: trackingId,
    habitId,
    userId
  });

  if (!tracking) {
    return res.status(404).json({
      success: false,
      message: 'Tracking record not found'
    });
  }

  // 3. Validate status
  const allowedStatuses = ['completed', 'skipped', 'failed'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
    });
  }

  // 4. Update fields
  if (status !== undefined) {
    tracking.status = status;
    
    // Nếu chuyển sang completed → set completedAt và completedCount
    if (status === 'completed') {
      tracking.completedCount = 1;
      tracking.completedAt = completedAt ? new Date(completedAt) : new Date();
    } 
    // Nếu chuyển sang skipped/failed → xóa completedAt và reset count
    else {
      tracking.completedCount = 0;
      tracking.completedAt = null;
    }
  }

  // 5. Update completedAt nếu có (và status là completed)
  if (completedAt && tracking.status === 'completed') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(completedAt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:mm (e.g., 14:30)'
      });
    }
    
    const [hours, minutes] = completedAt.split(':').map(Number);
    const completedDate = new Date(tracking.date);
    completedDate.setHours(hours, minutes, 0, 0);
    
    // Validate không set thời gian tương lai
    if (completedDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set future time'
      });
    }
    
    tracking.completedAt = completedDate;
  }

  // 6. Update notes
  if (notes !== undefined) {
    tracking.notes = notes;
  }

  // 7. Update mood
  if (mood !== undefined) {
    tracking.mood = mood;
  }

  // 8. Save
  await tracking.save();
  await updateHabitStats(habitId, userId);

  // 9. Format response
  res.json({
    success: true,
    message: 'Tracking updated successfully',
    tracking: {
      id: tracking._id,
      date: tracking.date.toISOString().split('T')[0],
      status: tracking.status,
      completedAt: tracking.completedAt 
        ? tracking.completedAt.toTimeString().slice(0, 5) 
        : null,
      notes: tracking.notes,
      mood: tracking.mood,
      updatedAt: tracking.updatedAt
    }
  });
});


// ============================================
// XÓA TRACKING - CHECK MODE
// ============================================
const deleteHabitTracking = asyncHandler(async (req, res) => {
  const { habitId, trackingId } = req.params;
  const userId = req.user.id;

  // 1. Verify habit exists and is CHECK mode
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // ⚠️ CHỈ CHO CHECK MODE
  if (habit.trackingMode === 'count') {
    return res.status(400).json({
      success: false,
      message: 'This endpoint is for check mode only. Use sub-tracking endpoints for count mode.'
    });
  }

  // 2. Find and delete tracking
  const tracking = await HabitTracking.findOne({
    _id: trackingId,
    habitId,
    userId
  });

  if (!tracking) {
    return res.status(404).json({
      success: false,
      message: 'Tracking record not found'
    });
  }

  // Lưu thông tin trước khi xóa (để log)
  const deletedInfo = {
    date: tracking.date.toISOString().split('T')[0],
    status: tracking.status,
    notes: tracking.notes,
    mood: tracking.mood
  };

  // 3. Delete the tracking
  await HabitTracking.findByIdAndDelete(trackingId);

  // 4. Update habit stats
  await updateHabitStats(habitId, userId);

  // 5. Response
  res.json({
    success: true,
    message: 'Tracking deleted successfully',
    deleted: deletedInfo
  });
});


// ============================================
// XÓA CẢ NGÀY - COUNT MODE (Bonus)
// ============================================
const deleteHabitTrackingDay = asyncHandler(async (req, res) => {
  const { habitId, date } = req.params; // date format: YYYY-MM-DD
  const userId = req.user.id;

  // 1. Verify habit exists and is COUNT mode
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // ⚠️ CHỈ CHO COUNT MODE
  if (habit.trackingMode === 'check') {
    return res.status(400).json({
      success: false,
      message: 'This endpoint is for count mode only.'
    });
  }

  // 2. Parse date
  const trackingDate = new Date(date);
  trackingDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(trackingDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // 3. Find parent tracking
  const habitTracking = await HabitTracking.findOne({
    habitId,
    userId,
    date: trackingDate
  });

  if (!habitTracking) {
    return res.status(404).json({
      success: false,
      message: 'No tracking found for this date'
    });
  }

  // 4. Count sub-trackings trước khi xóa
  const subCount = await HabitSubTracking.countDocuments({
    habitId,
    userId,
    startTime: {
      $gte: trackingDate,
      $lt: nextDay
    }
  });

  // 5. Delete all sub-trackings of this day
  await HabitSubTracking.deleteMany({
    habitId,
    userId,
    startTime: {
      $gte: trackingDate,
      $lt: nextDay
    }
  });

  // 6. Delete parent tracking
  await HabitTracking.findByIdAndDelete(habitTracking._id);

  // 7. Update stats
  await updateHabitStats(habitId, userId);

  // 8. Response
  res.json({
    success: true,
    message: 'Tracking day deleted successfully',
    deleted: {
      date: date,
      subTrackingsDeleted: subCount,
      totalQuantity: habitTracking.completedCount
    }
  });
});




const getHabitSubTrackings = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { date, from, to, limit = 50, page = 1 } = req.query;

  // Verify habit exists
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Build query
  let query = { habitId, userId };

  // Filter by specific date
  if (date) {
    const filterDate = new Date(date);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    query.startTime = {
      $gte: filterDate,
      $lt: nextDay
    };
  }
  // Filter by date range
  else if (from || to) {
    query.startTime = {};
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      query.startTime.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.startTime.$lte = toDate;
    }
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get sub-trackings
  const subTrackings = await HabitSubTracking.find(query)
    .sort({ startTime: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const total = await HabitSubTracking.countDocuments(query);

  // Format response
  const formatted = subTrackings.map(sub => {
    const duration = sub.endTime
      ? Math.round((new Date(sub.endTime) - new Date(sub.startTime)) / 60000)
      : null;

    return {
      id: sub._id,
      date: new Date(sub.startTime).toISOString().split('T')[0],
      time: new Date(sub.startTime).toTimeString().slice(0, 5),
      endTime: sub.endTime ? new Date(sub.endTime).toTimeString().slice(0, 5) : null,
      duration: duration ? `${duration} phút` : null,
      quantity: sub.quantity,
      note: sub.note || '',
      createdAt: sub.createdAt
    };
  });

  // Calculate summary
  const totalQuantity = subTrackings.reduce((sum, sub) => sum + sub.quantity, 0);
  const totalDuration = subTrackings
    .filter(sub => sub.endTime)
    .reduce((sum, sub) => {
      return sum + (new Date(sub.endTime) - new Date(sub.startTime)) / 60000;
    }, 0);

  res.json({
    success: true,
    habitName: habit.name,
    unit: habit.unit || 'lần',
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    summary: {
      totalEntries: total,
      totalQuantity,
      totalDuration: totalDuration > 0 ? `${Math.round(totalDuration)} phút` : null,
      averagePerEntry: total > 0 ? Math.round(totalQuantity / total * 10) / 10 : 0
    },
    subTrackings: formatted
  });
});
const addHabitSubTracking = async (req, res) => {
  try {
    const { habitId } = req.params;
    const userId = req.user.id;
    const {
      quantity = 1,
      date,
      startTime,  // ✅ Bỏ default value, bắt buộc phải truyền vào
      endTime,
      note,
      mood
    } = req.body;

    const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    // ⚠️ CHỈ CHO COUNT MODE
    if (habit.trackingMode === 'check') {
      return res.status(400).json({
        success: false,
        message: 'This habit uses check tracking mode. Please use /track endpoint instead.',
        hint: `POST /api/habits/${habitId}/track`
      });
    }

    // ✅ Validate startTime - BẮT BUỘC
    if (!startTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime is required (format: HH:mm, e.g., 08:30)'
      });
    }

    // 🕐 Validate startTime format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime format. Use HH:mm (e.g., 08:30)'
      });
    }

    // ✅ Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // 📅 Xác định ngày tracking
    let trackingDate = date ? new Date(date) : new Date();
    trackingDate.setHours(0, 0, 0, 0);

    // Validate date (nếu có)
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - trackingDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > 30) {
        return res.status(400).json({
          success: false,
          message: 'Cannot track habits older than 30 days'
        });
      }

      if (trackingDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot track future dates'
        });
      }
    }

    // 🕐 Parse startTime
    const [startH, startM] = startTime.split(':').map(Number);
    const actualStartTime = new Date(trackingDate);
    actualStartTime.setHours(startH, startM, 0, 0);

    // ⚠️ Validate: không track tương lai
    if (actualStartTime > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot track future time'
      });
    }

    // 🕐 Parse endTime (nếu có)
    let actualEndTime = null;
    if (endTime) {
      if (!timeRegex.test(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endTime format. Use HH:mm (e.g., 09:30)'
        });
      }

      const [endH, endM] = endTime.split(':').map(Number);
      actualEndTime = new Date(trackingDate);
      actualEndTime.setHours(endH, endM, 0, 0);

      // ⚠️ Validate: endTime phải sau startTime
      if (actualEndTime <= actualStartTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // 🎯 Validation: kiểm tra thời gian có hợp lý với quantity không
      const durationMinutes = (actualEndTime - actualStartTime) / (1000 * 60);
      const validationRules = getValidationRules(habit, quantity, durationMinutes);

      if (!validationRules.isValid) {
        return res.status(400).json({
          success: false,
          message: validationRules.message,
          details: {
            quantity,
            duration: `${Math.floor(durationMinutes)} phút`,
            unit: habit.unit || 'lần',
            suggestion: validationRules.suggestion
          }
        });
      }
    }

    // 🔍 Tìm hoặc tạo tracking record cho ngày đó
    let habitTracking = await HabitTracking.findOne({
      habitId,
      userId,
      date: trackingDate
    });

    if (!habitTracking) {
      habitTracking = await HabitTracking.create({
        habitId,
        userId,
        date: trackingDate,
        targetCount: habit.targetCount || 1,
        completedCount: 0,
        status: 'pending'
      });
    }

    // ⚠️ Không cho track nếu đã completed (trừ khi admin override)
    if (habitTracking.status === 'completed' && !req.body.override) {
      return res.status(400).json({
        success: false,
        message: 'This habit is already completed for this date',
        currentProgress: `${habitTracking.completedCount}/${habitTracking.targetCount}`,
        hint: 'Add "override": true to force add more'
      });
    }

    // 🕒 Tạo sub tracking
    const sub = await HabitSubTracking.create({
      habitTrackingId: habitTracking._id,
      habitId,
      userId,
      startTime: actualStartTime,
      endTime: actualEndTime,
      quantity,
      note,
      mood
    });

    // 📊 Cập nhật tiến độ
    const newCompletedCount = Math.min(
      habitTracking.completedCount + quantity,
      habitTracking.targetCount
    );

    const wasCompleted = habitTracking.status === 'completed';
    habitTracking.completedCount = newCompletedCount;

    if (habitTracking.completedCount >= habitTracking.targetCount) {
      habitTracking.status = 'completed';
      if (!wasCompleted) {
        habitTracking.completedAt = new Date();
      }
    } else {
      habitTracking.status = 'in-progress';
    }

    await habitTracking.save();

    // 🔄 Cập nhật stats của habit
    await updateHabitStats(habitId, userId);

    const unitLabel = habit.unit ? habit.unit : 'lần';
    const progress = `${habitTracking.completedCount}/${habitTracking.targetCount}`;
    const isToday = trackingDate.getTime() === new Date().setHours(0, 0, 0, 0);

    res.status(201).json({
      success: true,
      message: `Đã ghi nhận ${quantity} ${unitLabel}${!isToday ? ' cho ngày ' + trackingDate.toISOString().split('T')[0] : ''}`,
      tracking: {
        date: trackingDate.toISOString().split('T')[0],
        startTime: actualStartTime.toTimeString().slice(0, 5),
        endTime: actualEndTime ? actualEndTime.toTimeString().slice(0, 5) : null,
        duration: actualEndTime ? `${Math.round((actualEndTime - actualStartTime) / 60000)} phút` : null,
        isToday,
        progress,
        status: habitTracking.status,
        isCompleted: habitTracking.status === 'completed'
      },
      subTracking: sub
    });

  } catch (err) {
    console.error('Sub tracking error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

const updateHabitSubTracking = asyncHandler(async (req, res) => {
  const { habitId, subId } = req.params;
  const userId = req.user.id;
  const { quantity, startTime, time, endTime, note, mood } = req.body;
  
  const actualStartTime = startTime || time;

  // Verify habit
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Find sub-tracking
  const subTracking = await HabitSubTracking.findOne({
    _id: subId,
    habitId,
    userId
  });

  if (!subTracking) {
    return res.status(404).json({
      success: false,
      message: 'Sub-tracking entry not found'
    });
  }

  // Get the tracking date
  const trackingDate = new Date(subTracking.startTime);
  trackingDate.setHours(0, 0, 0, 0);

  // Get parent tracking record
  const habitTracking = await HabitTracking.findOne({
    habitId,
    userId,
    date: trackingDate
  });

  if (!habitTracking) {
    return res.status(404).json({
      success: false,
      message: 'Parent tracking record not found'
    });
  }

  // Store old quantity for recalculation
  const oldQuantity = subTracking.quantity;
  let quantityChanged = false;

  // Validate time format regex
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  // Update quantity
  if (quantity !== undefined && quantity > 0) {
    if (quantity !== oldQuantity) {
      subTracking.quantity = quantity;
      quantityChanged = true;
    }
  }

  // Update startTime (support both 'time' and 'startTime')
  if (actualStartTime !== undefined) {
    if (!timeRegex.test(actualStartTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime format. Use HH:mm (e.g., 08:30)'
      });
    }
    const [hours, minutes] = actualStartTime.split(':').map(Number);
    const newStartTime = new Date(trackingDate);
    newStartTime.setHours(hours, minutes, 0, 0);
    
    // Validate không track tương lai
    if (newStartTime > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set future time'
      });
    }
    
    subTracking.startTime = newStartTime;
  }

  // Update endTime
  if (endTime !== undefined) {
    if (endTime === null || endTime === '') {
      subTracking.endTime = null;
    } else {
      if (!timeRegex.test(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endTime format. Use HH:mm (e.g., 09:30)'
        });
      }
      
      const [hours, minutes] = endTime.split(':').map(Number);
      const newEndTime = new Date(trackingDate);
      newEndTime.setHours(hours, minutes, 0, 0);

      // Validate endTime phải sau startTime
      if (newEndTime <= subTracking.startTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
      
      subTracking.endTime = newEndTime;
    }
  }

  // Update note
  if (note !== undefined) {
    subTracking.note = note;
  }

  // Update mood
  if (mood !== undefined) {
    subTracking.mood = mood;
  }

  await subTracking.save();

  // Recalculate parent tracking if quantity changed
  if (quantityChanged) {
    const quantityDiff = subTracking.quantity - oldQuantity;
    const newCompletedCount = Math.max(0, habitTracking.completedCount + quantityDiff);
    habitTracking.completedCount = Math.min(newCompletedCount, habitTracking.targetCount);

    if (habitTracking.completedCount >= habitTracking.targetCount) {
      habitTracking.status = 'completed';
      if (!habitTracking.completedAt) {
        habitTracking.completedAt = new Date();
      }
    } else {
      habitTracking.status = 'in-progress';
    }

    await habitTracking.save();
    await updateHabitStats(habitId, userId);
  }

  // Calculate duration
  const duration = subTracking.endTime
    ? Math.round((subTracking.endTime - subTracking.startTime) / 60000)
    : null;

  res.json({
    success: true,
    message: 'Sub-tracking updated successfully',
    subTracking: {
      id: subTracking._id,
      date: trackingDate.toISOString().split('T')[0],
      startTime: subTracking.startTime.toTimeString().slice(0, 5),
      endTime: subTracking.endTime ? subTracking.endTime.toTimeString().slice(0, 5) : null,
      duration: duration ? `${duration} phút` : null,
      quantity: subTracking.quantity,
      note: subTracking.note,
      mood: subTracking.mood
    },
    tracking: {
      progress: `${habitTracking.completedCount}/${habitTracking.targetCount}`,
      status: habitTracking.status
    }
  });
});

const deleteHabitSubTracking = asyncHandler(async (req, res) => {
  const { habitId, subId } = req.params;
  const userId = req.user.id;

  // Verify habit
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Find and delete sub-tracking
  const subTracking = await HabitSubTracking.findOne({
    _id: subId,
    habitId,
    userId
  });

  if (!subTracking) {
    return res.status(404).json({
      success: false,
      message: 'Sub-tracking entry not found'
    });
  }

  const quantity = subTracking.quantity;
  const trackingDate = new Date(subTracking.startTime);
  trackingDate.setHours(0, 0, 0, 0);

  // Delete the sub-tracking
  await HabitSubTracking.findByIdAndDelete(subId);

  // Update parent tracking
  const habitTracking = await HabitTracking.findOne({
    habitId,
    userId,
    date: trackingDate
  });

  if (habitTracking) {
    habitTracking.completedCount = Math.max(0, habitTracking.completedCount - quantity);

    // Update status
    if (habitTracking.completedCount === 0) {
      habitTracking.status = 'pending';
      habitTracking.completedAt = null;
    } else if (habitTracking.completedCount < habitTracking.targetCount) {
      habitTracking.status = 'in-progress';
      habitTracking.completedAt = null;
    }

    await habitTracking.save();
    await updateHabitStats(habitId, userId);
  }

  res.json({
    success: true,
    message: 'Sub-tracking entry deleted successfully',
    tracking: habitTracking ? {
      progress: `${habitTracking.completedCount}/${habitTracking.targetCount}`,
      status: habitTracking.status
    } : null
  });
});

// 🎯 HELPER FUNCTION: Validation Rules dựa trên loại habit
function getValidationRules(habit, quantity, durationMinutes) {
  const unit = habit.unit?.toLowerCase()?.trim() || '';

  // ✅ Rule chuẩn, thực tế & mở rộng nhiều loại habit
  const rules = {
    /* === CHẠY BỘ === */
    km: { min: 5, max: 15, type: 'per_unit', name: 'km', message: 'Chạy bộ' },

    /* === UỐNG NƯỚC === */
    ly: { min: 0.5, max: 3, type: 'per_unit', name: 'ly', message: 'Uống nước' },
    cốc: { min: 0.5, max: 3, type: 'per_unit', name: 'cốc', message: 'Uống nước' },
    lít: { min: 1.5, max: 6, type: 'per_unit', name: 'lít', message: 'Uống nước' },

    /* === ĐỌC SÁCH === */
    trang: { min: 2, max: 5, type: 'per_unit', name: 'trang', message: 'Đọc sách' },
    page: { min: 2, max: 5, type: 'per_unit', name: 'trang', message: 'Đọc sách' },

    /* === TẬP GYM === */
    lần: { min: 10, max: 100, type: 'per_unit', name: 'lần', message: 'Tập luyện' },
    rep: { min: 10, max: 100, type: 'per_unit', name: 'rep', message: 'Tập luyện' },
    cái: { min: 10, max: 100, type: 'per_unit', name: 'cái', message: 'Tập luyện' },
    set: { min: 2, max: 10, type: 'per_unit', name: 'hiệp', message: 'Tập luyện' },

    /* === THIỀN / YOGA === */
    phút: { min: 5, tolerance: 0.15, type: 'exact', name: 'phút', message: 'Thiền / Yoga' },
    minute: { min: 5, tolerance: 0.15, type: 'exact', name: 'minute', message: 'Meditation / Yoga' },
    giờ: { min: 0.1, tolerance: 0.15, type: 'exact', name: 'giờ', message: 'Thiền / Yoga', multiplier: 60 },

    /* === TÀI CHÍNH === */
    k: { min: 1, max: 500, type: 'per_unit', name: 'nghìn đồng', message: 'Tiết kiệm tiền' },
    đ: { min: 1000, max: 1000000, type: 'per_unit', name: 'đồng', message: 'Tiết kiệm tiền' },

    /* === NGỦ === */
    'giờ-ngủ': { min: 4, tolerance: 0.1, type: 'exact', name: 'giờ', message: 'Ngủ' },
  };

  // 🔍 Tìm rule phù hợp
  let matchedRule = null;
  for (const [key, rule] of Object.entries(rules)) {
    if (unit.includes(key)) {
      matchedRule = rule;
      break;
    }
  }

  // ❌ Không khớp rule nào → chỉ kiểm tra duration không vượt quá 24h
  if (!matchedRule) {
    if (durationMinutes > 24 * 60) {
      return {
        isValid: false,
        message: `Thời gian ${Math.floor(durationMinutes / 60)} giờ là quá dài`,
        suggestion: 'Kiểm tra lại endTime'
      };
    }
    return { isValid: true };
  }

  // ✅ Validate theo loại rule
  if (matchedRule.type === 'per_unit') {
    const minDuration = quantity * matchedRule.min;
    if (durationMinutes < minDuration) {
      return {
        isValid: false,
        message: `${matchedRule.message} ${quantity} ${matchedRule.name} trong ${Math.round(durationMinutes)} phút là quá nhanh`,
        suggestion: `Tối thiểu ${Math.ceil(minDuration)} phút để hợp lý`
      };
    }
  }

  if (matchedRule.type === 'exact') {
    const expectedDuration = matchedRule.multiplier
      ? quantity * matchedRule.multiplier
      : quantity;
    const minDuration = expectedDuration * (1 - (matchedRule.tolerance || 0.15));

    if (durationMinutes < minDuration) {
      const correctQuantity = Math.round(durationMinutes / (matchedRule.multiplier || 1));
      return {
        isValid: false,
        message: `Bạn ghi ${quantity} ${matchedRule.name} nhưng thực tế chỉ khoảng ${Math.floor(durationMinutes)} phút`,
        suggestion: `Nên ghi khoảng ${correctQuantity} ${matchedRule.name}`
      };
    }
  }

  return { isValid: true };
}

function calculateHistoryStats(trackings, habit) {
  const total = trackings.length;
  const completed = trackings.filter(t => t.status === 'completed').length;
  const skipped = trackings.filter(t => t.status === 'skipped').length;
  const failed = trackings.filter(t => t.status === 'failed').length;
  const pending = trackings.filter(t => t.status === 'pending').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  let averageProgress = 0;
  if (habit && habit.trackingMode === 'count') {
    const percents = trackings.map(t => t.targetCount > 0 ? (t.completedCount / t.targetCount) * 100 : 0);
    averageProgress = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0;
  } else {
    averageProgress = completionRate;
  }

  // Compute longest consecutive completed streak (by date)
  if (total === 0) {
    return {
      total,
      completed,
      skipped,
      failed,
      pending,
      completionRate,
      averageProgress,
      longestStreak: 0
    };
  }

  const completedDates = trackings
    .filter(t => t.status === 'completed')
    .map(t => {
      const d = new Date(t.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .sort((a, b) => b - a);

  let longestStreak = 0;
  let tempStreak = 0;
  let last = null;

  for (const time of completedDates) {
    if (last === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.floor((last - time) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    last = time;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    total,
    completed,
    skipped,
    failed,
    pending,
    completionRate,
    averageProgress,
    longestStreak
  };
}

function groupTrackingData(trackings, groupBy, habit) {
  const groups = {};

  trackings.forEach(tracking => {
    let key;
    const date = new Date(tracking.date);

    if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) {
      groups[key] = {
        period: key,
        entries: [],
        completed: 0,
        total: 0,
        totalQuantity: 0
      };
    }

    groups[key].entries.push(tracking);
    groups[key].total++;
    if (tracking.status === 'completed') {
      groups[key].completed++;
    }
    groups[key].totalQuantity += tracking.completedCount || 0;
  });

  return Object.values(groups).map(group => ({
    ...group,
    completionRate: Math.round((group.completed / group.total) * 100),
    averagePerDay: Math.round(group.totalQuantity / group.total * 10) / 10
  }));
}


// @desc    Get habit statistics

const getHabitStats = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Get tracking history
  const trackingHistory = await HabitTracking.find({ userId, habitId })
    .sort({ date: -1 })
    .limit(30);

  // Calculate weekly completion rate
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyTracking = await HabitTracking.find({
    userId,
    habitId,
    date: { $gte: weekAgo }
  });

  const weeklyCompletions = weeklyTracking.filter(t => t.status === 'completed').length;
  const weeklyCompletionRate = weeklyTracking.length > 0 ? (weeklyCompletions / weeklyTracking.length) * 100 : 0;

  res.json({
    success: true,
    habit: {
      ...habit.toObject(),
      weeklyCompletionRate: Math.round(weeklyCompletionRate)
    },
    trackingHistory
  });
});

// @desc    Get habit calendar (30 days tracking)

const getHabitCalendar = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { days = 30 } = req.query;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Get tracking data for specified days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);

  const trackingData = await HabitTracking.find({
    userId,
    habitId,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  // Generate calendar array
  const calendar = [];
  for (let i = parseInt(days) - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayTracking = trackingData.find(t =>
      t.date.getTime() === date.getTime()
    );

    calendar.push({
      date: date.toISOString().split('T')[0],
      status: dayTracking ? dayTracking.status : 'pending',
      notes: dayTracking?.notes || '',
      mood: dayTracking?.mood || null,
      completedAt: dayTracking?.completedAt || null
    });
  }

  res.json({
    success: true,
    habit: {
      id: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color
    },
    calendar
  });
});

// History
const getHabitHistory = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const {
    from,
    to,
    status,      // 'completed', 'skipped', 'failed', 'pending'
    groupBy,     // 'day', 'week', 'month'
    limit = 30,
    page = 1
  } = req.query;

  // Verify habit
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  // Build query
  let query = { habitId, userId };

  // Date range filter
  if (from || to) {
    query.date = {};
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      query.date.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.date.$lte = toDate;
    }
  } else {
    // Default: last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    defaultFrom.setHours(0, 0, 0, 0);
    query.date = { $gte: defaultFrom };
  }

  // Status filter
  if (status && ['completed', 'skipped', 'failed', 'pending'].includes(status)) {
    query.status = status;
  }

  // Get tracking data
  const trackings = await HabitTracking.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  const total = await HabitTracking.countDocuments(query);

  // Group data if requested
  let result;
  if (groupBy) {
    result = groupTrackingData(trackings, groupBy, habit);
  } else {
    // Format individual entries
    result = await Promise.all(trackings.map(async (tracking) => {
      let subTrackings = [];
      
      // Get sub-trackings for count mode
      if (habit.trackingMode === 'count') {
        subTrackings = await HabitSubTracking.find({
          habitTrackingId: tracking._id
        }).lean();
      }

      return {
        date: tracking.date.toISOString().split('T')[0],
        status: tracking.status,
        completedAt: tracking.completedAt,
        completedCount: tracking.completedCount,
        targetCount: tracking.targetCount,
        progress: tracking.targetCount > 0 
          ? Math.round((tracking.completedCount / tracking.targetCount) * 100)
          : 0,
        notes: tracking.notes || '',
        mood: tracking.mood || null,
        subTrackings: subTrackings.length > 0 ? subTrackings.map(sub => ({
          time: new Date(sub.startTime).toTimeString().slice(0, 5),
          endTime: sub.endTime ? new Date(sub.endTime).toTimeString().slice(0, 5) : null,
          quantity: sub.quantity,
          note: sub.note
        })) : []
      };
    }));
  }

  // Calculate statistics
  const stats = calculateHistoryStats(trackings, habit);

  res.json({
    success: true,
    habit: {
      id: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      trackingMode: habit.trackingMode,
      unit: habit.unit
    },
    filters: {
      from: from || null,
      to: to || null,
      status: status || 'all',
      groupBy: groupBy || 'none'
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    stats,
    history: result
  });
});
// dashboard - all habits history
const getAllHabitsHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    from,
    to,
    category,
    status,
    limit = 50
  } = req.query;

  // Build habit query
  let habitQuery = { userId, isActive: true };
  if (category) {
    habitQuery.category = category;
  }

  const habits = await Habit.find(habitQuery).lean();

  if (habits.length === 0) {
    return res.json({
      success: true,
      message: 'No active habits found',
      history: []
    });
  }

  // Build tracking query
  let trackingQuery = {
    userId,
    habitId: { $in: habits.map(h => h._id) }
  };

  // Date range
  if (from || to) {
    trackingQuery.date = {};
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      trackingQuery.date.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      trackingQuery.date.$lte = toDate;
    }
  } else {
    // Default: last 7 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 7);
    defaultFrom.setHours(0, 0, 0, 0);
    trackingQuery.date = { $gte: defaultFrom };
  }

  // Status filter
  if (status && ['completed', 'skipped', 'failed', 'pending'].includes(status)) {
    trackingQuery.status = status;
  }

  // Get all trackings
  const trackings = await HabitTracking.find(trackingQuery)
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .lean();

  // Map habits for quick lookup
  const habitMap = {};
  habits.forEach(h => {
    habitMap[h._id.toString()] = h;
  });

  // Format results
  const formatted = trackings.map(t => {
    const habit = habitMap[t.habitId.toString()];
    return {
      date: t.date.toISOString().split('T')[0],
      habitId: t.habitId,
      habitName: habit?.name || 'Unknown',
      habitIcon: habit?.icon,
      habitColor: habit?.color,
      category: habit?.category,
      status: t.status,
      completedCount: t.completedCount,
      targetCount: t.targetCount,
      progress: t.targetCount > 0 
        ? Math.round((t.completedCount / t.targetCount) * 100)
        : 0,
      completedAt: t.completedAt
    };
  });

  // Calculate overall stats
  const totalTracked = trackings.length;
  const completed = trackings.filter(t => t.status === 'completed').length;
  const completionRate = totalTracked > 0 ? Math.round((completed / totalTracked) * 100) : 0;

  res.json({
    success: true,
    filters: {
      from: from || null,
      to: to || null,
      category: category || 'all',
      status: status || 'all'
    },
    stats: {
      totalEntries: totalTracked,
      completed,
      completionRate,
      habitsTracked: habits.length
    },
    history: formatted
  });
});

// ==================== Templates & Suggestions ====================

// @desc    Get habit templates
const getHabitTemplates = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { category, difficulty } = req.query;

  // Get user analysis to suggest relevant templates
  const userAnalysis = await UserAnalysis.findOne({ userId });

  let query = {};

  if (category) {
    query.category = category;
  } else if (userAnalysis) {
    // Suggest templates based on user's top categories
    const topCategories = Object.entries(userAnalysis.categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    query.category = { $in: topCategories };
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  const templates = await HabitTemplate.find(query)
    .sort({ isPopular: -1, usageCount: -1 })
    .limit(20);

  res.json({
    success: true,
    templates,
    userAnalysis: userAnalysis ? {
      topCategories: Object.entries(userAnalysis.categoryScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => ({ category, score }))
    } : null
  });
});

const createHabitFromTemplate = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { templateId } = req.params;
  const customizations = req.body?.customizations || {};

  // Lấy template
  const template = await HabitTemplate.findById(templateId);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Tạo habit mới từ template
  const newHabit = await Habit.create({
    userId,
    name: customizations?.name || template.name,
    description: customizations?.description || template.description,
    category: template.category,
    icon: customizations?.icon || template.defaultIcon,
    color: customizations?.color || template.defaultColor,
    frequency: customizations?.frequency || template.suggestedFrequency,
    habitType: customizations?.habitType || 'build',
    isActive: true,
    startDate: customizations?.startDate || Date.now(),
    customFrequency: customizations?.customFrequency,
    isFromSuggestion: false,
    suggestionId: null
  });

  // Cập nhật usageCount của template
  await HabitTemplate.findByIdAndUpdate(templateId, {
    $inc: { usageCount: 1 }
  });

  res.status(201).json({
    success: true,
    habit: newHabit,
    message: 'Habit created successfully from template'
  });
});

// ==================== Dashboard & Reports ====================

// @desc    Get today's habits overview

const getTodayOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get active habits
  const habits = await Habit.find({ userId, isActive: true });

  // Get today's tracking
  const todayTracking = await HabitTracking.find({
    userId,
    date: today
  });

  const completedHabits = todayTracking.filter(t => t.status === 'completed').length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Get current streaks
  const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
    const todayStatus = todayTracking.find(t => t.habitId.equals(habit._id));
    return {
      id: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      currentStreak: habit.currentStreak,
      todayCompleted: todayStatus ? todayStatus.status === 'completed' : false
    };
  }));

  res.json({
    success: true,
    overview: {
      totalHabits,
      completedToday: completedHabits,
      completionRate,
      habitsWithStreaks
    }
  });
});

// @desc    Get weekly report

const getWeeklyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { weekOffset = 0 } = req.query; // 0 = current week, 1 = last week, etc.

  // Calculate week range
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Get active habits
  const habits = await Habit.find({ userId, isActive: true });

  // Get tracking data for the week
  const weeklyTracking = await HabitTracking.find({
    userId,
    date: { $gte: startOfWeek, $lte: endOfWeek }
  });

  // Calculate stats for each habit
  const habitStats = habits.map(habit => {
    const habitTrackings = weeklyTracking.filter(t =>
      t.habitId.equals(habit._id)
    );

    const completed = habitTrackings.filter(t => t.status === 'completed').length;
    const total = 7; // days in week
    const completionRate = Math.round((completed / total) * 100);

    return {
      habitId: habit._id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      completed,
      total,
      completionRate,
      trackings: habitTrackings.map(t => ({
        date: t.date.toISOString().split('T')[0],
        status: t.status,
        mood: t.mood
      }))
    };
  });

  // Overall week stats
  const totalCompletions = weeklyTracking.filter(t => t.status === 'completed').length;
  const totalPossible = habits.length * 7;
  const overallCompletionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

  res.json({
    success: true,
    report: {
      week: {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
      },
      overallStats: {
        totalCompletions,
        totalPossible,
        completionRate: overallCompletionRate,
        activeHabits: habits.length
      },
      habitStats
    }
  });
});

// @desc    Get habit insights and recommendations

const getHabitInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const habits = await Habit.find({ userId, isActive: true });

    // Get recent tracking data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTracking = await HabitTracking.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });

    const insights = [];

    for (const habit of habits) {
      const habitTrackings = recentTracking.filter(t =>
        t.habitId.equals(habit._id)
      );

      // Calculate streaks
      const completedDays = habitTrackings
        .filter(t => t.status === 'completed')
        .sort((a, b) => b.date - a.date);

      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (const tracking of completedDays) {
        const trackingDate = new Date(tracking.date);
        trackingDate.setHours(0, 0, 0, 0);

        if (trackingDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Generate insights
      let insight = '';
      let type = 'info';

      if (currentStreak >= 7) {
        insight = `Tuyệt vời! Bạn đã duy trì thói quen "${habit.name}" được ${currentStreak} ngày liên tiếp.`;
        type = 'celebration';
      } else if (habit.completionRate < 50) {
        insight = `Thói quen "${habit.name}" cần được chú ý hơn. Hãy thử giảm mục tiêu hoặc thay đổi thời gian thực hiện.`;
        type = 'improvement';
      } else if (habit.completionRate >= 80) {
        insight = `Bạn đang làm rất tốt với thói quen "${habit.name}". Có thể thử thách thức bản thân hơn!`;
        type = 'encouragement';
      }

      if (insight) {
        insights.push({
          habitId: habit._id,
          habitName: habit.name,
          type,
          message: insight,
          data: {
            currentStreak,
            completionRate: habit.completionRate,
            totalCompletions: habit.totalCompletions
          }
        });
      }
    }

    res.json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get habit insights'
    });
  }
});

// @desc    Bulk update habits order

const updateHabitsOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { habitOrders } = req.body; // [{ habitId, order }, ...]

  if (!Array.isArray(habitOrders)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid habit orders format'
    });
  }

  try {
    // Update each habit's order
    const updatePromises = habitOrders.map(({ habitId, order }) =>
      Habit.findOneAndUpdate(
        { _id: habitId, userId },
        { order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Habits order updated successfully'
    });
  } catch (error) {
    console.error('Update habits order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update habits order'
    });
  }
});



// Helper function to update habit statistics
async function updateHabitStats(habitId, userId) {
  const habit = await Habit.findById(habitId);
  if (!habit) return;

  const completedTracking = await HabitTracking.find({
    habitId,
    userId,
    status: 'completed'
  }).sort({ date: -1 });
  if (completedTracking.length === 0) {
    await Habit.findByIdAndUpdate(habitId, {
      totalCompletions: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      lastCompletedDate: null
    });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalCompletions = completedTracking.length;

  let currentStreak = 0;
  let longestStreak = 0;
  let completionRate = 0;

  // ===================== DAILY =====================
  if (habit.frequency === 'daily') {
    let checkDate = new Date(today);
    const lastCompletedDate = new Date(completedTracking[0].date);
    lastCompletedDate.setHours(0, 0, 0, 0);

    if (lastCompletedDate.getTime() < today.getTime()) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Đếm streak ngày liên tiếp
    for (const tracking of completedTracking) {
      const trackingDate = new Date(tracking.date);
      trackingDate.setHours(0, 0, 0, 0);

      if (trackingDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (trackingDate.getTime() < checkDate.getTime()) {
        break;
      }
    }

    // Longest streak (giữ nguyên code của bạn)
    let tempStreak = 1;
    for (let i = 0; i < completedTracking.length - 1; i++) {
      const current = new Date(completedTracking[i].date);
      const next = new Date(completedTracking[i + 1].date);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    const startDate = new Date(habit.startDate);
    startDate.setHours(0, 0, 0, 0);
    const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    completionRate = Math.round((totalCompletions / daysPassed) * 100);
  }

  // ===================== WEEKLY =====================
  else if (habit.frequency === 'weekly') {
    // Tính số tuần liên tiếp đạt mục tiêu
    const timesPerWeek = habit.customFrequency?.times || 1;
    const groupedByWeek = {};

    for (const t of completedTracking) {
      const d = new Date(t.date);
      const weekKey = `${d.getFullYear()}-W${Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + d.getDay() + 1) / 7)}`;
      groupedByWeek[weekKey] = (groupedByWeek[weekKey] || 0) + 1;
    }

    const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => b.localeCompare(a));
    currentStreak = 0;

    for (let i = 0; i < sortedWeeks.length; i++) {
      const count = groupedByWeek[sortedWeeks[i]];
      if (count >= timesPerWeek) {
        currentStreak++;
      } else {
        break;
      }
    }

    longestStreak = currentStreak; // có thể lưu thêm max streak theo tuần sau

    // Tính % hoàn thành tuần hiện tại
    const latestWeekKey = sortedWeeks[0];
    const completionsThisWeek = groupedByWeek[latestWeekKey] || 0;
    completionRate = Math.min((completionsThisWeek / timesPerWeek) * 100, 100);
  }

  // ===================== MONTHLY =====================
  else if (habit.frequency === 'monthly') {
    const timesPerMonth = habit.customFrequency?.times || 1;
    const groupedByMonth = {};

    for (const t of completedTracking) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      groupedByMonth[key] = (groupedByMonth[key] || 0) + 1;
    }

    const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));
    currentStreak = 0;

    for (let i = 0; i < sortedMonths.length; i++) {
      const count = groupedByMonth[sortedMonths[i]];
      if (count >= timesPerMonth) {
        currentStreak++;
      } else {
        break;
      }
    }

    longestStreak = currentStreak;
    const latestMonth = sortedMonths[0];
    const completionsThisMonth = groupedByMonth[latestMonth] || 0;
    completionRate = Math.min((completionsThisMonth / timesPerMonth) * 100, 100);
  }

  // ========== CẬP NHẬT HABIT ==========
  await Habit.findByIdAndUpdate(habitId, {
    totalCompletions,
    currentStreak,
    longestStreak,
    completionRate: Math.min(completionRate, 100),
    lastCompletedDate: completedTracking[0].date
  });
}

// ==================== REMINDERS OPERATIONS ====================


const getHabitReminders = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    return res.status(404).json({ success: false, message: 'Habit not found' });
  }

  const reminders = await HabitReminder.find({ habitId, userId }).sort({ time: 1 });

  res.json({
    success: true,
    habitName: habit.name,
    reminders
  });
});

//  Get today's reminders across all habits

const getTodayReminders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date().getDay(); // 0 = Sunday

  // Lấy reminder của hôm nay
  const reminders = await HabitReminder.find({
    userId,
    isActive: true,
    $or: [{ days: [] }, { days: today }]
  }).populate('habitId', 'name icon color');

  const formatted = reminders.map(r => ({
    reminderId: r._id,
    habitId: r.habitId?._id,
    habitName: r.habitId?.name,
    habitIcon: r.habitId?.icon,
    habitColor: r.habitId?.color,
    time: r.time,
    message: r.message,
    soundEnabled: r.soundEnabled,
    vibrationEnabled: r.vibrationEnabled
  }));

  // Sort by time ascending
  formatted.sort((a, b) => a.time.localeCompare(b.time));

  res.json({
    success: true,
    date: new Date().toISOString().split('T')[0],
    day: today,
    totalReminders: formatted.length,
    reminders: formatted
  });
});

// Add reminder to habit
const addHabitReminder = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { time, days, message, soundEnabled, vibrationEnabled } = req.body;

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!time || !timeRegex.test(time)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid time format. Use HH:MM (e.g., 08:30)'
    });
  }

  // Validate days array
  if (days && (!Array.isArray(days) || days.some(d => d < 0 || d > 6))) {
    return res.status(400).json({
      success: false,
      message: 'Days must be an array of numbers between 0 (Sunday) and 6 (Saturday)'
    });
  }

  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({ success: false, message: 'Habit not found' });
  }

  // Limit 5 reminders per habit
  const count = await HabitReminder.countDocuments({ habitId, userId, isActive: true });
  if (count >= 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 active reminders per habit allowed'
    });
  }

  const reminder = await HabitReminder.create({
    habitId,
    userId,
    time,
    days: days?.length ? days : [0, 1, 2, 3, 4, 5, 6],
    message: message || `Đã đến giờ thực hiện "${habit.name}"`,
    soundEnabled: soundEnabled ?? true,
    vibrationEnabled: vibrationEnabled ?? true,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: 'Reminder added successfully',
    reminder
  });
});

// Update reminder
const updateHabitReminder = asyncHandler(async (req, res) => {
  const { habitId, reminderId } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  const reminder = await HabitReminder.findOne({ _id: reminderId, habitId, userId });
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found' });
  }

  // Validate time if provided
  if (updates.time) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(updates.time)) {
      return res.status(400).json({ success: false, message: 'Invalid time format. Use HH:MM' });
    }
  }

  // Apply updates
  const allowed = ['time', 'days', 'message', 'isActive', 'soundEnabled', 'vibrationEnabled'];
  allowed.forEach(f => {
    if (updates[f] !== undefined) reminder[f] = updates[f];
  });

  await reminder.save();

  res.json({
    success: true,
    message: 'Reminder updated successfully',
    reminder
  });
});

// Delete reminder

const deleteHabitReminder = asyncHandler(async (req, res) => {
  const { habitId, reminderId } = req.params;
  const userId = req.user.id;

  const reminder = await HabitReminder.findOneAndDelete({ _id: reminderId, habitId, userId });
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found' });
  }

  res.json({
    success: true,
    message: 'Reminder deleted successfully'
  });
});



// ==================== GOALS OPERATIONS ====================

// @desc    Add goal to habit
const addHabitGoal = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { type, target, unit, description, deadline, reward } = req.body;

  // Validate input
  if (!type || !target) {
    return res.status(400).json({
      success: false,
      message: 'Goal type and target are required'
    });
  }


  const validTypes = ['total_completions', 'streak', 'weekly_target', 'monthly_target', 'custom'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Goal type must be one of: ${validTypes.join(', ')}`
    });
  }


  if (target < 1) {
    return res.status(400).json({
      success: false,
      message: 'Target must be at least 1'
    });
  }

  // Check habit existence
  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({ success: false, message: 'Habit not found' });
  }

  // Check goal limit
  const activeCount = await HabitGoal.countDocuments({ habitId, userId, isCompleted: false });
  if (activeCount >= 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 active goals per habit allowed'
    });
  }

  // Compute initial "current" value
  let current = 0;
  switch (type) {
    case 'total_completions':
      current = habit.totalCompletions || 0;
      break;
    case 'streak':
      current = habit.currentStreak || 0;
      break;

    default:
      current = 0;
  }

  // Create new goal
  const goal = await HabitGoal.create({
    habitId,
    userId,
    type,
    target,
    current,
    unit: unit || 'lần',
    description: description || '',
    deadline: deadline ? new Date(deadline) : null,
    reward: reward || ''
  });

  return res.status(201).json({
    success: true,
    message: 'Goal added successfully',
    goal
  });
});

// @desc    Update habit goal
const updateHabitGoal = asyncHandler(async (req, res) => {
  const { habitId, goalId } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  const goal = await HabitGoal.findOne({ _id: goalId, habitId, userId });
  if (!goal) {
    return res.status(404).json({ success: false, message: 'Goal not found' });
  }


  if (goal.isCompleted && !updates.isCompleted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot modify completed goal'
    });
  }

  const allowed = ['target', 'unit', 'description', 'deadline', 'reward', 'current'];
  allowed.forEach(f => {
    if (updates[f] !== undefined) goal[f] = updates[f];
  });


  if (updates.current !== undefined && updates.current >= goal.target && !goal.isCompleted) {
    goal.isCompleted = true;
    goal.completedAt = new Date();
  }

  await goal.save();

  res.json({
    success: true,
    message: goal.isCompleted ? 'Goal completed! 🎉' : 'Goal updated successfully',
    goal
  });
});


// @desc    Delete habit goal
const deleteHabitGoal = asyncHandler(async (req, res) => {
  const { habitId, goalId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  const goal = habit.goals.id(goalId);
  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }

  goal.remove();
  await habit.save();

  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

const completeHabitGoal = asyncHandler(async (req, res) => {
  const { habitId, goalId } = req.params;
  const userId = req.user.id;

  const goal = await HabitGoal.findOne({ _id: goalId, habitId, userId });
  if (!goal) {
    return res.status(404).json({ success: false, message: 'Goal not found' });
  }

  if (goal.isCompleted) {
    return res.status(400).json({
      success: false,
      message: 'Goal already completed'
    });
  }

  goal.isCompleted = true;
  goal.completedAt = new Date();
  goal.current = goal.target;
  await goal.save();

  res.json({
    success: true,
    message: '🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu!',
    goal,
    reward: goal.reward || null
  });
});

// @desc    Get all goals for a habit
const getHabitGoals = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  const { status } = req.query; // 'active', 'completed', 'all'

  const habit = await Habit.findOne({ _id: habitId, userId }, 'name goals currentStreak totalCompletions');
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  let goals = habit.goals || [];

  // Filter by status
  if (status === 'active') {
    goals = goals.filter(g => !g.isCompleted);
  } else if (status === 'completed') {
    goals = goals.filter(g => g.isCompleted);
  }

  // Calculate progress for each goal
  const goalsWithProgress = goals.map(goal => {
    let currentValue = goal.current;

    // Update current value based on goal type
    switch (goal.type) {
      case 'total_completions':
        currentValue = habit.totalCompletions || 0;
        break;
      case 'streak':
        currentValue = habit.currentStreak || 0;
        break;
    }

    const progress = Math.min((currentValue / goal.target) * 100, 100);

    return {
      ...goal.toObject(),
      current: currentValue,
      progress: Math.round(progress),
      remaining: Math.max(goal.target - currentValue, 0)
    };
  });

  res.json({
    success: true,
    habitName: habit.name,
    totalGoals: goals.length,
    activeGoals: goals.filter(g => !g.isCompleted).length,
    completedGoals: goals.filter(g => g.isCompleted).length,
    goals: goalsWithProgress
  });
});

// @desc    Get all goals overview for user
const getUserGoalsOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const habits = await Habit.find({
    userId,
    isActive: true
  }).select('name icon color goals currentStreak totalCompletions');

  const allGoals = [];
  let totalActive = 0;
  let totalCompleted = 0;

  habits.forEach(habit => {
    if (habit.goals && habit.goals.length > 0) {
      habit.goals.forEach(goal => {
        let currentValue = goal.current;

        // Update based on goal type
        switch (goal.type) {
          case 'total_completions':
            currentValue = habit.totalCompletions || 0;
            break;
          case 'streak':
            currentValue = habit.currentStreak || 0;
            break;
        }

        const progress = Math.min((currentValue / goal.target) * 100, 100);

        allGoals.push({
          goalId: goal._id,
          habitId: habit._id,
          habitName: habit.name,
          habitIcon: habit.icon,
          habitColor: habit.color,
          type: goal.type,
          target: goal.target,
          current: currentValue,
          progress: Math.round(progress),
          unit: goal.unit,
          description: goal.description,
          deadline: goal.deadline,
          isCompleted: goal.isCompleted,
          completedAt: goal.completedAt,
          reward: goal.reward
        });

        if (goal.isCompleted) {
          totalCompleted++;
        } else {
          totalActive++;
        }
      });
    }
  });

  // Sort: incomplete goals first, then by progress
  allGoals.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return b.progress - a.progress;
  });

  res.json({
    success: true,
    overview: {
      totalGoals: allGoals.length,
      activeGoals: totalActive,
      completedGoals: totalCompleted,
      completionRate: allGoals.length > 0 ? Math.round((totalCompleted / allGoals.length) * 100) : 0
    },
    goals: allGoals
  });
});

// @desc    Update goals progress (called by system or manually)
const syncHabitGoals = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;

  const habit = await Habit.findOne({ _id: habitId, userId, isActive: true });
  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  let updated = 0;
  let completed = 0;

  habit.goals.forEach(goal => {
    if (!goal.isCompleted) {
      let newCurrent = goal.current;

      switch (goal.type) {
        case 'total_completions':
          newCurrent = habit.totalCompletions || 0;
          break;
        case 'streak':
          newCurrent = habit.currentStreak || 0;
          break;
      }

      if (newCurrent !== goal.current) {
        goal.current = newCurrent;
        updated++;

        // Auto-complete if target reached
        if (newCurrent >= goal.target && !goal.isCompleted) {
          goal.isCompleted = true;
          goal.completedAt = new Date();
          completed++;
        }
      }
    }
  });

  if (updated > 0) {
    await habit.save();
  }

  res.json({
    success: true,
    message: `Synced ${updated} goals`,
    updated,
    completed,
    goals: habit.goals
  });
});

// Export all functions

export {
  getUserHabits,
  createHabit,
  updateHabit,
  deleteHabit,

  // Tracking
  trackHabit,
  getHabitTrackings,
  updateHabitTracking,
  deleteHabitTracking,
  deleteHabitTrackingDay,



  // History & Stats
  getHabitStats,
  getHabitHistory,
  getHabitCalendar,
  getHabitTemplates,
  getTodayOverview,
  getWeeklyReport,
  getHabitInsights,
  updateHabitsOrder,

  // dashboard
  getAllHabitsHistory,

  // Templates & Suggestions
  createHabitFromTemplate,

  // Sub-tracking
  addHabitSubTracking,
  updateHabitSubTracking,
  deleteHabitSubTracking,
  getHabitSubTrackings,

  // Reminders
  addHabitReminder,
  updateHabitReminder,
  deleteHabitReminder,
  getHabitReminders,
  getTodayReminders,

  // Goals
  addHabitGoal,
  updateHabitGoal,
  completeHabitGoal,
  deleteHabitGoal,
  getHabitGoals,
  getUserGoalsOverview,
  syncHabitGoals
};
