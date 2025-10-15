import SleepContent from '../models/SleepContent.js';
import mongoose from 'mongoose';

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
    if (search) filter.title = { $regex: search.trim(), $options: 'i' };

    const skip = (p - 1) * l;
    const [items, total] = await Promise.all([
      SleepContent.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(l).lean(),
      SleepContent.countDocuments(filter)
    ]);

    const userId = getUserId(req);
    let favoriteSet = new Set();
    if (userId && req.user?.favorites?.length) {
      favoriteSet = new Set(req.user.favorites.map(id => id.toString()));
    }

    const data = items.map(it => ({
      id: it._id,
      type: it.type,
      title: it.title,
      slug: it.slug,
      description: it.type === 'story' ? it.description : undefined,
      durationSec: it.durationSec,
      displayDuration: it.displayDuration,
      audioUrl: it.audioUrl,
      coverImage: it.coverImage,
      category: it.category,
      tags: it.tags,
      isLoopRecommended: it.isLoopRecommended,
      premium: it.premium,
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
    const favorite = !!(userId && req.user?.favorites?.some(f => f.toString() === doc._id.toString()));
    res.json({ success: true, data: { ...doc, favorite } });
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

    const idx = user.favorites.findIndex(id => id.toString() === content._id.toString());
    let favState;
    if (idx >= 0) {
      user.favorites.splice(idx, 1);
      favState = false;
    } else {
      user.favorites.push(content._id);
      favState = true;
    }
    await user.save();
    res.json({ success: true, favorite: favState });
  } catch (e) { next(e); }
};

// Danh sách favorites của user
export const listFavorites = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    await req.user.populate({ path: 'favorites', match: { active: true }, options: { sort: { sortOrder: 1 } } });
    const data = req.user.favorites.map(it => ({
      id: it._id,
      type: it.type,
      title: it.title,
      slug: it.slug,
      durationSec: it.durationSec,
      displayDuration: it.displayDuration,
      audioUrl: it.audioUrl,
      favorite: true
    }));
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
