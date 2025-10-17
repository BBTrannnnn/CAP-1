import mongoose from 'mongoose';

const userFavoriteSoundSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  soundId: { type: mongoose.Schema.Types.ObjectId, ref: 'SleepContent', required: true, index: true },
  addedAt: { type: Date, default: Date.now }
});

userFavoriteSoundSchema.index({ userId: 1, soundId: 1 }, { unique: true });

export default mongoose.model('UserFavoriteSound', userFavoriteSoundSchema);
