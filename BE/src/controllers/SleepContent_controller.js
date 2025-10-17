import SleepContent from '../models/SleepContent.js';
import mongoose from 'mongoose';
import UserStoryHistory from '../models/UserStoryHistory.js';
import UserFavoriteSound from '../models/UserFavoriteSound.js';

// Lấy userId từ request (middleware auth đã gắn)
const getUserId = (req) => req.user?._id?.toString?.() || req.user?.id;

// List nội dung
export const listSleepContent = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20, tag, category, search } = req.query;
    const p = Math.max(1, parseInt(page));
    const l = Math.min(50, Math.max(1, parseInt(limit)));
    const filter = { active: true };
    if (type) filter.type = type;
  if (tag) filter.tags = tag;
    if (category) filter.category = category;
  if (search) filter.name = { $regex: search.trim(), $options: 'i' };

    const skip = (p - 1) * l;
    const [items, total] = await Promise.all([
      SleepContent.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(l).lean(),
      SleepContent.countDocuments(filter)
    ]);

    const userId = getUserId(req);
    let favoriteSet = new Set();
    if (userId) {
      const favs = await UserFavoriteSound.find({ userId }).select('soundId').lean();
      favoriteSet = new Set(favs.map(f => f.soundId.toString()));
    }

    const data = items.map(it => ({
      id: it._id,
      type: it.type,
      name: it.name,
      slug: it.slug,
      description: it.type === 'story' ? it.description : undefined,
      duration: it.duration,
      displayDuration: it.displayDuration,
      audioUrl: it.audioUrl,
      thumbnail: it.thumbnail,
      category: it.category,
      tags: it.tags,
      isLoopRecommended: it.isLoopRecommended,
      premium: it.premium,
      playCount: it.playCount || 0,
      favorite: favoriteSet.has(it._id.toString())
    }));

    res.json({ success: true, data, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (e) { next(e); }
};

// Chi tiết theo id hoặc slug
export const getSleepContent = async (req, res, next) => {
  try {
  const { idOrSlug } = req.params;
    let doc = null;
    if (mongoose.isValidObjectId(idOrSlug)) {
      doc = await SleepContent.findOne({ _id: idOrSlug, active: true }).lean();
    }
    if (!doc) {
      doc = await SleepContent.findOne({ slug: idOrSlug.toLowerCase(), active: true }).lean();
    }
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy nội dung' });
    const userId = getUserId(req);
    let favorite = false;
    if (userId) {
      const f = await UserFavoriteSound.findOne({ userId, soundId: doc._id });
      favorite = !!f;
    }
    // normalize response fields to match schema image
    const out = {
      id: doc._id,
      type: doc.type,
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      duration: doc.duration,
      displayDuration: doc.displayDuration,
      audioUrl: doc.audioUrl,
      thumbnail: doc.thumbnail,
      category: doc.category,
      icon: doc.icon,
      tags: doc.tags,
      playCount: doc.playCount || 0,
      rating: doc.rating,
      favorite
    };
    res.json({ success: true, data: out });
  } catch (e) { next(e); }
};

// Toggle favorite
export const toggleFavorite = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { idOrSlug } = req.params;
    let content = null;
    if (mongoose.isValidObjectId(idOrSlug)) {
      content = await SleepContent.findOne({ _id: idOrSlug, active: true });
    }
    if (!content) content = await SleepContent.findOne({ slug: idOrSlug.toLowerCase(), active: true });
    if (!content) return res.status(404).json({ success: false, message: 'Không tìm thấy nội dung' });
    // use UserFavoriteSound collection
    const existing = await UserFavoriteSound.findOne({ userId: user._id, soundId: content._id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, favorite: false });
    }
    await UserFavoriteSound.create({ userId: user._id, soundId: content._id });
    return res.json({ success: true, favorite: true });
  } catch (e) { next(e); }
};

// Danh sách favorites của user
export const listFavorites = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const favs = await UserFavoriteSound.find({ userId: req.user._id }).sort({ addedAt: -1 }).lean();
    const ids = favs.map(f => f.soundId);
    const items = await SleepContent.find({ _id: { $in: ids }, active: true }).lean();
    const data = items.map(it => ({
      id: it._id,
      type: it.type,
      name: it.name,
      slug: it.slug,
      duration: it.duration,
      displayDuration: it.displayDuration,
      audioUrl: it.audioUrl,
      thumbnail: it.thumbnail,
      favorite: true
    }));
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// Admin: create content
export const createSleepContent = async (req, res, next) => {
  try {
    const payload = req.body;
    const doc = new SleepContent(payload);
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

// Admin: update
export const updateSleepContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const updated = await SleepContent.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

// Admin: delete (soft)
export const deleteSleepContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const updated = await SleepContent.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

// Track play: increment playCount and record user story history
export const recordPlay = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let content = null;
    if (mongoose.isValidObjectId(idOrSlug)) content = await SleepContent.findById(idOrSlug);
    if (!content) content = await SleepContent.findOne({ slug: idOrSlug.toLowerCase() });
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

    // increment playCount
    content.playCount = (content.playCount || 0) + 1;
    await content.save();

    // If user logged in, update history
    if (req.user) {
      const userId = req.user._id;
      const history = await UserStoryHistory.findOneAndUpdate(
        { userId, storyId: content._id },
        { $set: { lastViewedAt: new Date() } , $setOnInsert: { lastPosition: 0 } },
        { upsert: true, new: true }
      );
      // return both
      return res.json({ success: true, data: { content, history } });
    }

    res.json({ success: true, data: content });
  } catch (e) { next(e); }
};
