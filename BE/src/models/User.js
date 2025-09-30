import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as CryptoJS from 'crypto-js';



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
        sparse: true, // cho phép nhiều document có null
        required: function () {
            // Chỉ yêu cầu phone khi login local
            return this.loginProvider !== 'google' && this.isNew;
        },
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Vui lòng nhập đúng định dạng số điện thoại']
        },
    password: {
        type: String,
        required: function() {
            // Chỉ yêu cầu password nếu không phải Google login
            return this.loginProvider !== 'google' && this.isNew;
        },
        minLength: [6, 'Mật khẩu của bạn phải có ít nhất 6 ký tự']
    },
    confirmPassword:{
        type:String,
        required: function() {
    // Chỉ require khi không phải Google login
    return this.loginProvider !== 'google' && this.isNew;
  },
        minLength:[6,'Mật khẩu của bạn phải có ít nhất 6 ký tự'],
        validate:{
            validator:function(value){
                return value === this.password;
            },
            message:'Mật khẩu xác nhận không khớp'  
        }
    },
    loginProvider: {
        type: String,
        default: 'local'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetOTP: { type: String },
    resetOTPExpires: { type: Number },
    isOTPVerified: { type: Boolean, default: false }
},  { timestamps: true
    
});
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

userSchema.methods.createResetOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetOTP = otp;
    this.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 phút
    this.isOTPVerified = false;
    return otp;
};

//Xác thực OTP
userSchema.methods.verifyOTP = function(inputOTP) {
    return this.resetOTP === inputOTP && this.resetOTPExpires > Date.now();
};

export default mongoose.model('User', userSchema);