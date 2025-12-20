import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, maxlength: 5000, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

NoteSchema.index({ userId: 1, date: -1 });

export default mongoose.model("Note", NoteSchema);