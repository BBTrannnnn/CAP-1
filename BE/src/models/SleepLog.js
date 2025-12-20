import mongoose from "mongoose";

// Các enum cơ bản cho mood & yếu tố ảnh hưởng (có thể mở rộng sau)
const MOODS = ["buon","vui","thu_gian","met","cang_thang"];
const FACTORS = ["cafe","tap_luyen","stress","an_muon","doc_sach","xem_phim","tam_nuoc_am","on_ao"];

const SleepLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sleepAt: { type: Date, required: true },
  wakeAt:  { type: Date, required: true },
  durationMin: { type: Number, required: true }, // tính ở controller / hook
  // quality, wakeMood, factors đã bỏ, chỉ giữ notes
  // notes: { type: String, maxlength: 5000 }, // Đã tách sang Note
  // Dự phòng cho tương lai
  // isNap: { type: Boolean, default: false }
}, { timestamps: true });

// Index phục vụ thống kê & truy vấn nhanh
SleepLogSchema.index({ userId: 1, sleepAt: -1 });
SleepLogSchema.index({ userId: 1, wakeAt: -1 });
SleepLogSchema.index({ userId: 1, sleepAt: 1, wakeAt: 1 }, { unique: false });

// Đồng bộ durationMin khi có thay đổi thời gian (cho các future update)
SleepLogSchema.pre("save", function(next) {
  if (this.sleepAt && this.wakeAt) {
    const s = this.sleepAt.getTime();
    const w = this.wakeAt.getTime();
    if (!isNaN(s) && !isNaN(w) && w > s) {
      const diff = w - s;
      this.durationMin = Math.round(diff / 60000);
    }
  }
  next();
});

export default mongoose.model("SleepLog", SleepLogSchema);
