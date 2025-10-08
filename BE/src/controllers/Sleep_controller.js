import SleepLog from "../models/SleepLog.js";
import mongoose from "mongoose";

// ================= Helpers =================
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
  const [agg, countOk, lastSession] = await Promise.all([
    SleepLog.aggregate([
      { $match: match },
      { $group: { _id: null, totalNights: { $sum: 1 }, avgDuration: { $avg: "$durationMin" }, avgQuality: { $avg: "$quality" }, lastWakeAt: { $max: "$wakeAt" } } }
    ]),
    SleepLog.countDocuments({ ...match, durationMin: { $gte: 420 } }),
    SleepLog.findOne(match).sort({ wakeAt: -1 }).lean()
  ]);
  const s = agg[0] || { totalNights: 0, avgDuration: 0, avgQuality: 0, lastWakeAt: null };
  const avgDurationMin = Math.round(s.avgDuration || 0);
  const avgQuality = +(s.avgQuality?.toFixed(2) || 0);
  const sleepScore = Math.round(
    0.6 * Math.min(100, ((avgDurationMin || 0) / 480) * 100) +
    0.4 * Math.min(100, ((avgQuality || 0) / 5) * 100)
  );
  const targetPerNight = 480;
  const sleepDebtMin = Math.max(0, s.totalNights * targetPerNight - avgDurationMin * s.totalNights);
  return {
    rangeDays: days,
    totalNights: s.totalNights,
    avgDurationMin,
    avgDurationFormatted: fmtHM(avgDurationMin),
    avgQuality,
    lastWakeAt: s.lastWakeAt,
    lastSession: lastSession ? { sleepAt: lastSession.sleepAt, wakeAt: lastSession.wakeAt, durationMin: lastSession.durationMin, durationFormatted: fmtHM(lastSession.durationMin) } : null,
    sleepScore,
    pctOk7h: s.totalNights ? Math.round((countOk / s.totalNights) * 100) : 0,
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
    { $project: { date: { $dateToString: { date: "$wakeAt", format: "%Y-%m-%d" } }, durationMin: 1, quality: 1 } },
    { $group: { _id: "$date", durationMin: { $avg: "$durationMin" }, quality: { $avg: "$quality" }, nights: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const map = new Map();
  raw.forEach(r => map.set(r._id, { date: r._id, durationMin: Math.round(r.durationMin), durationFormatted: fmtHM(Math.round(r.durationMin)), quality: +r.quality.toFixed(2), nights: r.nights }));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 864e5).toISOString().slice(0,10);
    out.push(map.get(d) || { date: d, durationMin: 0, durationFormatted: fmtHM(0), quality: 0, nights: 0 });
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
  if (stats7d.avgQuality <= 2.2 && stats7d.avgDurationMin < 420) return { level: "warning", title: "Thiếu ngủ và chất lượng kém", message: `Trong ${nights} đêm gần đây, thời lượng trung bình ${stats7d.avgDurationMin} phút và chất lượng ${stats7d.avgQuality}/5. Bạn có dấu hiệu thiếu ngủ và ngủ chưa sâu.`, suggestions: ["Cố gắng đi ngủ sớm hơn 30–60 phút","Hạn chế caffeine sau 14:00","Giữ phòng ngủ yên tĩnh và tối"], sleepDebtMin };
  if (stats7d.avgDurationMin < 420) return { level: "warning", title: "Thiếu ngủ", message: `Bạn đang ngủ trung bình ${Math.round(stats7d.avgDurationMin / 60)} giờ ${stats7d.avgDurationMin % 60} phút/ngày (< 7h). Nợ ngủ ước tính ${sleepDebtMin} phút trong ${nights} đêm.`, suggestions: ["Thiết lập giờ ngủ cố định","Tránh màn hình 60 phút trước khi ngủ"], sleepDebtMin };
  if (stats7d.avgQuality < 3) return { level: "info", title: "Chất lượng giấc ngủ chưa tối ưu, cần cải thiện", message: `Thời lượng ổn nhưng chất lượng trung bình ${stats7d.avgQuality}/5. Hãy thử tối ưu môi trường ngủ và thói quen trước khi ngủ.`, suggestions: ["Phòng mát 18–22°C","Giảm ánh sáng xanh","Thư giãn nhẹ trước khi ngủ"], sleepDebtMin };
  return { level: "success", title: "Giấc ngủ khá tốt", message: `Bạn đang ngủ trung bình ~${Math.round(stats7d.avgDurationMin / 60)} giờ với chất lượng ${stats7d.avgQuality}/5 trong 7 ngày qua.`, suggestions: ["Duy trì thói quen hiện tại"], sleepDebtMin };
};

// ===== API =====
export const createSleepLog = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    let parsedTimes; try { parsedTimes = parseUiTimes(req.body); } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
    const { sleepAt, wakeAt } = parsedTimes; const { quality, wakeMood, factors, notes } = req.body;
    if (quality == null) return res.status(400).json({ success: false, message: "Thiếu quality" });
    const qNum = Number(quality); if (isNaN(qNum) || qNum < 1 || qNum > 5) return res.status(400).json({ success: false, message: "quality phải là số 1-5" });
    let durationMin; try { durationMin = calcDurationMin(sleepAt, wakeAt); } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
    const nowTs = Date.now(); const sTs = new Date(sleepAt).getTime(); const wTs = new Date(wakeAt).getTime();
    if (sTs > nowTs || wTs > nowTs) return res.status(400).json({ success: false, message: "Không được nhập thời gian trong tương lai" });
    if (durationMin < 15) return res.status(400).json({ success: false, message: "Thời lượng quá ngắn (<15 phút)" });
    if (durationMin > 12 * 60) return res.status(400).json({ success: false, message: "Thời lượng quá dài (>12 giờ)" });
    const overlap = await SleepLog.findOne({ userId, sleepAt: { $lt: new Date(wakeAt) }, wakeAt: { $gt: new Date(sleepAt) } });
    if (overlap) return res.status(409).json({ success: false, message: "Khoảng thời gian bị trùng với bản ghi khác" });
    const doc = await SleepLog.create({ userId, sleepAt, wakeAt, durationMin, quality: qNum, wakeMood, factors, notes });
    const [summary, trend] = await Promise.all([ buildStats(userId, 7), buildTrend(userId, 7) ]);
    const evaluation = evaluateSleep(summary);
    res.status(201).json({ success: true, data: doc, weekly: { summary, trend }, evaluation });
  } catch (e) { next(e); }
};

export const listSleepLogs = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req)); if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10")));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SleepLog.find({ userId }).sort({ sleepAt: -1 }).skip(skip).limit(limit),
      SleepLog.countDocuments({ userId })
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
