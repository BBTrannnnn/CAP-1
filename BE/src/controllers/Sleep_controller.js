import SleepLog from "../models/SleepLog.js";
import mongoose from "mongoose";
import User from "../models/User.js";

// Tính durationMin từ sleepAt & wakeAt
const calcDurationMin = (sleepAt, wakeAt) => {
  const s = new Date(sleepAt).getTime();
  const w = new Date(wakeAt).getTime();
  if (isNaN(s) || isNaN(w)) throw new Error("Thời gian không hợp lệ (không thể parse)");
  if (w <= s) throw new Error("Thời gian không hợp lệ (wakeAt phải lớn hơn sleepAt)");
  const diff = w - s;
  if (diff > 24 * 60 * 60 * 1000) throw new Error("Khoảng thời gian quá dài (>24h)");
  return Math.round(diff / 60000);
};

const getUserId = (req) => req.user?._id?.toString?.() || req.user?.id;

// Ép ObjectId
const toObjectId = (id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null);

// Format phút -> "XhYY"
const fmtHM = (mins) => {
  if (!mins && mins !== 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m.toString().padStart(2,'0')}`;
};

// Thống kê tuần dựa wakeAt
const buildStats = async (userIdObj, days) => {
  const now = Date.now();
  const since = new Date(now - days * 864e5);
  const match = { userId: userIdObj, wakeAt: { $gte: since } };
  const [agg, lastSession] = await Promise.all([
    SleepLog.aggregate([
      { $match: match },
      { $group: { _id: null, totalNights: { $sum: 1 }, avgDuration: { $avg: "$durationMin" }, lastWakeAt: { $max: "$wakeAt" } } }
    ]),
    SleepLog.findOne(match).sort({ wakeAt: -1 }).lean()
  ]);
  const s = agg[0] || { totalNights: 0, avgDuration: 0, lastWakeAt: null };
  const avgDurationMin = Math.round(s.avgDuration || 0);
  const targetPerNight = 480;
  const sleepDebtMin = Math.max(0, s.totalNights * targetPerNight - avgDurationMin * s.totalNights);
  return {
    rangeDays: days,
    totalNights: s.totalNights,
    avgDurationMin,
    avgDurationFormatted: fmtHM(avgDurationMin),
    lastWakeAt: s.lastWakeAt,
    lastSession: lastSession ? { sleepAt: lastSession.sleepAt, wakeAt: lastSession.wakeAt, durationMin: lastSession.durationMin, durationFormatted: fmtHM(lastSession.durationMin), notes: lastSession.notes } : null,
    sleepDebtMin,
    sleepDebtFormatted: fmtHM(sleepDebtMin)
  };
};

// Trend 7 ngày (fill đủ, nhóm wakeAt)
const buildTrend = async (userIdObj, days) => {
  const now = Date.now();
  const since = new Date(now - days * 864e5);
  const raw = await SleepLog.aggregate([
    { $match: { userId: userIdObj, wakeAt: { $gte: since } } },
    { $project: { date: { $dateToString: { date: "$wakeAt", format: "%Y-%m-%d" } }, durationMin: 1 } },
    { $group: { _id: "$date", durationMin: { $avg: "$durationMin" }, nights: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const map = new Map();
  raw.forEach(r => map.set(r._id, { date: r._id, durationMin: Math.round(r.durationMin), durationFormatted: fmtHM(Math.round(r.durationMin)), nights: r.nights }));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 864e5).toISOString().slice(0,10);
    out.push(map.get(d) || { date: d, durationMin: 0, durationFormatted: fmtHM(0), nights: 0 });
  }
  return out;
};

// Parse time helpers
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const parseTimeTo24 = (t) => {
  if (!t || typeof t !== "string") return null;
  const s = t.trim();
  let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) { let hh = parseInt(m[1],10); const mm = parseInt(m[2],10); const ap = m[3].toUpperCase(); if (hh===12) hh=0; if (ap==="PM") hh+=12; if (hh>23||mm>59) return null; return { hh, mm }; }
  m = s.match(/^(\d{1,2})\s*(AM|PM)$/i); if (m){ let hh=parseInt(m[1],10); const ap=m[2].toUpperCase(); if(hh===12) hh=0; if(ap==="PM") hh+=12; if(hh>23) return null; return { hh, mm:0 }; }
  m = s.match(/^(\d{1,2}):(\d{2})$/); if (m){ const hh=parseInt(m[1],10); const mm=parseInt(m[2],10); if(hh>23||mm>59) return null; return { hh, mm }; }
  m = s.match(/^(\d{1,2})$/); if (m){ const hh=parseInt(m[1],10); if(hh>23) return null; return { hh, mm:0 }; }
  return null;
};

const parseUiTimes = (body) => {
  const { sleepAt, wakeAt, date, sleepTime, wakeTime } = body || {};
  if (sleepAt && wakeAt) return { sleepAt, wakeAt };
  if (date && sleepTime && wakeTime) {
    const sParts = parseTimeTo24(sleepTime);
    const wParts = parseTimeTo24(wakeTime);
    if (!sParts || !wParts) throw new Error("Thời gian không hợp lệ (định dạng giờ phút)");
    const sIso = `${date}T${pad2(sParts.hh)}:${pad2(sParts.mm)}:00`;
    const wSame = `${date}T${pad2(wParts.hh)}:${pad2(wParts.mm)}:00`;
    let sDate = new Date(sIso); let wDate = new Date(wSame);
    if (isNaN(sDate.getTime()) || isNaN(wDate.getTime())) throw new Error("Thời gian không hợp lệ (không thể parse)");
    if (wDate.getTime() <= sDate.getTime()) wDate = new Date(wDate.getTime() + 864e5);
    return { sleepAt: sDate.toISOString(), wakeAt: wDate.toISOString() };
  }
  throw new Error("Thiếu dữ liệu thời gian: cần sleepAt & wakeAt hoặc date + sleepTime + wakeTime");
};

// Evaluation
const evaluateSleep = (stats7d) => {
  if (!stats7d || !stats7d.totalNights) return { level: "info", title: "Chưa đủ dữ liệu", message: "Bạn chưa có đủ bản ghi để đánh giá giấc ngủ (cần vài ngày gần đây).", suggestions: ["Tiếp tục ghi nhận mỗi ngày để có đánh giá chính xác"] };
  const nights = stats7d.totalNights; const sleepDebtMin = stats7d.sleepDebtMin ?? 0;
  if (stats7d.avgDurationMin < 420) return { level: "warning", title: "Thiếu ngủ", message: `Bạn đang ngủ trung bình ${Math.round(stats7d.avgDurationMin / 60)} giờ ${stats7d.avgDurationMin % 60} phút/ngày (< 7h). Nợ ngủ ước tính ${sleepDebtMin} phút trong ${nights} đêm.`, suggestions: ["Thiết lập giờ ngủ cố định","Tránh màn hình 60 phút trước khi ngủ"], sleepDebtMin };
  return { level: "success", title: "Giấc ngủ khá tốt", message: `Bạn đang ngủ trung bình ~${Math.round(stats7d.avgDurationMin / 60)} giờ trong 7 ngày qua.`, suggestions: ["Duy trì thói quen hiện tại"], sleepDebtMin };
};

// ===== API =====
export const createSleepLog = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    let parsedTimes;
    try {
      parsedTimes = parseUiTimes(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const { sleepAt, wakeAt } = parsedTimes;
    let durationMin;
    try {
      durationMin = calcDurationMin(sleepAt, wakeAt);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    const nowTs = Date.now();
    const sTs = new Date(sleepAt).getTime();
    const wTs = new Date(wakeAt).getTime();
    if (sTs > nowTs || wTs > nowTs)
      return res.status(400).json({ success: false, message: "Không được nhập thời gian trong tương lai" });
    // Giới hạn chỉ cho phép lưu nhật ký trong 7 ngày gần đây (dựa theo wakeAt)
    const cutoffTs = nowTs - 7 * 864e5; // 7 ngày tính theo mili-giây
    if (wTs < cutoffTs) {
      return res.status(400).json({ success: false, message: "Chỉ được lưu nhật ký trong 7 ngày gần đây (wakeAt phải trong 7 ngày gần nhất)" });
    }
    if (durationMin < 15)
      return res.status(400).json({ success: false, message: "Thời lượng quá ngắn (<15 phút)" });
    if (durationMin > 12 * 60)
      return res.status(400).json({ success: false, message: "Thời lượng quá dài (>12 giờ)" });
    const overlap = await SleepLog.findOne({ userId, sleepAt: { $lt: new Date(wakeAt) }, wakeAt: { $gt: new Date(sleepAt) } });
    if (overlap)
      return res.status(409).json({ success: false, message: "Khoảng thời gian bị trùng với bản ghi khác" });

    // Lấy thông tin user để xác định giới tính và tuổi
    const user = await User.findById(userId).lean();
    let gender = user?.gender || null;
    let dateOfBirth = user?.dateOfBirth || null;
    let age = null;
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // Hàm xác định khoảng thời lượng ngủ khuyến nghị (phút) theo tuổi
    function getRecommendedSleepRange(age, gender) {
      if (age == null) return { min: 420, max: 540 }; // default 7-9h
      if (age < 6) return { min: 660, max: 780 }; // 11-13h
      if (age < 13) return { min: 540, max: 660 }; // 9-11h
      if (age < 14) return { min: 480, max: 600 }; // 8-10h (giáp ranh)
      if (age < 18) return { min: 480, max: 600 }; // 8-10h
      if (age < 65) return { min: 420, max: 540 }; // 7-9h
      return { min: 420, max: 480 }; // >=65: 7-8h
    }
    const { min: recommendedSleepMin, max: recommendedSleepMax } = getRecommendedSleepRange(age, gender);
    let sleepStatus = "enough";
    if (durationMin < recommendedSleepMin) sleepStatus = "lack";
    else if (durationMin > recommendedSleepMax) sleepStatus = "over";

    // Lưu nhật ký ngủ
    const doc = await SleepLog.create({ userId, sleepAt, wakeAt, durationMin });
    const [summary, trend] = await Promise.all([
      buildStats(userId, 7),
      buildTrend(userId, 7)
    ]);
    const evaluation = evaluateSleep(summary);

    res.status(201).json({
      success: true,
      data: doc,
      recommendedSleepMin,
      recommendedSleepMax,
      sleepStatus, // "lack", "enough", "over"
      weekly: { summary, trend },
      evaluation,
      userProfile: { gender, age }
    });
  } catch (e) {
    next(e);
  }
};

export const listSleepLogs = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req)); if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10")));
    const skip = (page - 1) * limit;
    //chỉ trả về lịch sử trong 7 ngày gần đây (lọc theo wakeAt)
    const now = Date.now();
    const cutoff = new Date(now - 7 * 864e5);
    const query = { userId, wakeAt: { $gte: cutoff } };
    const [items, total] = await Promise.all([
      SleepLog.find(query).sort({ sleepAt: -1 }).skip(skip).limit(limit),
      SleepLog.countDocuments(query)
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
};

export const sleepStats = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req)); if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const [summary, trend] = await Promise.all([ buildStats(userId, 7), buildTrend(userId, 7) ]);
    const evaluation = evaluateSleep(summary);
    res.json({ success: true, weekly: { summary, trend }, evaluation });
  } catch (e) { next(e); }
};

// Update a sleep log
export const updateSleepLog = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Id không hợp lệ" });
    const existing = await SleepLog.findOne({ _id: id, userId });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi" });

    // Parse/keep times
    const hasTimePayload = ['sleepAt','wakeAt','date','sleepTime','wakeTime'].some(k => Object.prototype.hasOwnProperty.call(req.body || {}, k));
    let times;
    if (hasTimePayload) {
      try { times = parseUiTimes(req.body); } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
    } else {
      times = { sleepAt: existing.sleepAt.toISOString(), wakeAt: existing.wakeAt.toISOString() };
    }
    const { sleepAt, wakeAt } = times;

    // Other fields
    const notes = req.body.notes ?? existing.notes;

    // Time validations
    let durationMin; try { durationMin = calcDurationMin(sleepAt, wakeAt); } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
    const nowTs = Date.now(); const sTs = new Date(sleepAt).getTime(); const wTs = new Date(wakeAt).getTime();
    if (sTs > nowTs || wTs > nowTs) return res.status(400).json({ success: false, message: "Không được nhập thời gian trong tương lai" });
    const cutoffTs = nowTs - 7 * 864e5;
    if (wTs < cutoffTs) return res.status(400).json({ success: false, message: "Chỉ được sửa nhật ký trong 7 ngày gần đây (wakeAt phải trong 7 ngày gần nhất)" });
    if (durationMin < 15) return res.status(400).json({ success: false, message: "Thời lượng quá ngắn (<15 phút)" });
    if (durationMin > 12 * 60) return res.status(400).json({ success: false, message: "Thời lượng quá dài (>12 giờ)" });

    // Overlap excluding current
    const overlap = await SleepLog.findOne({
      userId,
      _id: { $ne: existing._id },
      sleepAt: { $lt: new Date(wakeAt) },
      wakeAt: { $gt: new Date(sleepAt) }
    });
    if (overlap) return res.status(409).json({ success: false, message: "Khoảng thời gian bị trùng với bản ghi khác" });

    existing.sleepAt = new Date(sleepAt);
    existing.wakeAt = new Date(wakeAt);
    existing.durationMin = durationMin;
    existing.notes = notes;
    await existing.save();

    const [summary, trend] = await Promise.all([ buildStats(userId, 7), buildTrend(userId, 7) ]);
    const evaluation = evaluateSleep(summary);
    res.json({ success: true, data: existing, weekly: { summary, trend }, evaluation });
  } catch (e) { next(e); }
};

// Delete a sleep log
export const deleteSleepLog = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Id không hợp lệ" });
    const existing = await SleepLog.findOne({ _id: id, userId });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi" });

    await SleepLog.deleteOne({ _id: existing._id, userId });
    const [summary, trend] = await Promise.all([ buildStats(userId, 7), buildTrend(userId, 7) ]);
    const evaluation = evaluateSleep(summary);
    res.json({ success: true, weekly: { summary, trend }, evaluation });
  } catch (e) { next(e); }
};
