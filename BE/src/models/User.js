import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Vui lòng nhập tên của bạn'],
        trim:true,
        maxLength:[50,'Tên của bạn không được vượt quá 50 ký tự']
    },
    email:{
        type:String,
        required:[true,'Vui lòng nhập email của bạn'],
        trim:true,
        unique:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,'Vui lòng nhập đúng định dạng email']
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        required: true,
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Vui lòng nhập đúng định dạng số điện thoại']
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        minLength: [6, 'Mật khẩu của bạn phải có ít nhất 6 ký tự']
    },
    confirmPassword:{
        type:String,
        required: [function() { return this.isNew; }, 'Vui lòng xác nhận mật khẩu'],
        minLength:[6,'Mật khẩu của bạn phải có ít nhất 6 ký tự'],
        validate:{
            validator:function(value){
                return value === this.password;
            },
            message:'Mật khẩu xác nhận không khớp'  
        }
    },
    address:{
        type:String,
        maxLength:[100,'Địa chỉ của bạn không được vượt quá 100 ký tự'],        
    },
    dateOfBirth: {
        type: Date,
    },
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=random'
    },
    bio: {
        type: String,
        maxLength: [200, 'Bio không được vượt quá 200 ký tự'],
        default: ''
    },
    badge: {
        type: String,
        maxLength: [50, 'Badge không được vượt quá 50 ký tự'],
        default: ''
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    fcmTokens: [{
        token: { 
            type: String, 
            required: true 
        },
        device: { 
            type: String, 
            enum: ['ios', 'android', 'web', 'unknown'],
            default: 'unknown' 
        },
        deviceId: String,
        createdAt: { 
            type: Date, 
            default: Date.now 
        },
        lastUsed: { 
            type: Date, 
            default: Date.now 
        },
    }],

    // ✅ THÊM MỚI: Inventory
  inventory: {
    streakShields: { type: Number, default: 0, min: 0 },
    freezeTokens: { type: Number, default: 0, min: 0 },
    reviveTokens: { type: Number, default: 0, min: 0 }
  },
  
  // ✅ THÊM MỚI: Lịch sử dùng items
  itemUsageHistory: [{
    itemType: { type: String, required: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
    usedAt: { type: Date, default: Date.now },
    streakSaved: Number,
    autoUsed: { type: Boolean, default: false },
    protectedDate: Date
  }],
  
  // ✅ THÊM MỚI: Settings streak protection
  streakProtectionSettings: {
    enabled: { type: Boolean, default: true },
    notificationTime: { type: String, default: '21:00' }
  },

    role: { 
        type: String, 
        enum: ['user', 'moderator', 'admin'], 
        default: 'user' 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    newUser: {
        type: Boolean,
        default: true
    },
    
    // ========== MODERATION & TRUST SYSTEM ==========
    trustScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
    },
    violations: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    bannedUntil: {
        type: Date
    },
    bannedReason: {
        type: String
    },
    moderationHistory: [{
        type: {
            type: String,
            enum: ['violation_severe', 'violation_moderate', 'profanity', 'nsfw', 'spam', 'url', 'reported', 'approved', 'rejected']
        },
        content: String,
        score: Number,
        action: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    resetOTP: { type: String },
    resetOTPExpires: { type: Number },
    isOTPVerified: { type: Boolean, default: false },
},  { timestamps: true });

// Hashpassword before saving the user
userSchema.pre('save',async function(next){
    // Nếu password không được thay đổi thì không cần hash lại
    if(!this.isModified('password')){
        return next();
    }
    // hash mật khẩu bằng cách tạo 
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.confirmPassword = undefined;// Ẩn xác nhận mật khẩu
    next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

//Xác thực OTP
userSchema.methods.createResetOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetOTP = otp;
    this.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 phút
    this.isOTPVerified = false;
    return otp;
};

userSchema.methods.verifyOTP = function(inputOTP) {
    return this.resetOTP === inputOTP && this.resetOTPExpires > Date.now();
};

export default mongoose.model('User', userSchema);