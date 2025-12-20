// Lấy note theo ngày
export const getNoteByDate = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "Thiếu ngày" });
    // Xử lý mốc ngày theo múi giờ Việt Nam (UTC+7)
    const d = new Date(date);
    if (isNaN(d)) return res.status(400).json({ success: false, message: "Ngày không hợp lệ" });
    // Lấy mốc 0h và 24h của ngày đó theo UTC+7
    const tzOffset = -7 * 60; // phút
    const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) - tzOffset * 60 * 1000);
    const end = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) - tzOffset * 60 * 1000);
    const note = await Note.findOne({ userId, date: { $gte: start, $lte: end } }).lean();
    if (!note) return res.status(404).json({ success: false, message: "Không tìm thấy note cho ngày này" });
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
};
import Note from "../models/Note.js";
import mongoose from "mongoose";

const toObjectId = (id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null);
const getUserId = (req) => req.user?._id?.toString?.() || req.user?.id;

// Thêm note mới
export const createNote = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { content, date } = req.body;
    if (!content || !date) return res.status(400).json({ success: false, message: "Thiếu nội dung hoặc ngày" });
    const note = await Note.create({ userId, content, date });
    res.status(201).json({ success: true, data: note });
  } catch (e) { next(e); }
};

// Lấy danh sách note (lịch sử)
export const listNotes = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10")));
    const skip = (page - 1) * limit;
    const query = { userId };
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = new Date(req.query.from);
      if (req.query.to) query.date.$lte = new Date(req.query.to);
    }
    const [items, total] = await Promise.all([
      Note.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      Note.countDocuments(query)
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
};

// Sửa note
export const updateNote = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    const { content, date } = req.body;
    const note = await Note.findOneAndUpdate({ _id: id, userId }, { content, date }, { new: true });
    if (!note) return res.status(404).json({ success: false, message: "Không tìm thấy note" });
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
};

// Xóa note
export const deleteNote = async (req, res, next) => {
  try {
    const userId = toObjectId(getUserId(req));
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { id } = req.params;
    const note = await Note.findOneAndDelete({ _id: id, userId });
    if (!note) return res.status(404).json({ success: false, message: "Không tìm thấy note" });
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
};