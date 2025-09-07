import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    phone:{
        type:String,
        required:[true,'Vui lòng nhập số điện thoại của bạn'],
        trim:true,
        unique:true,
        match:[/^[0-9]{10,11}$/,'Vui lòng nhập đúng định dạng số điện thoại']
    },
    password:{
        type:String,
        required:[true,'Vui lòng nhập mật khẩu của bạn'],
        minLength:[6,'Mật khẩu của bạn phải có ít nhất 6 ký tự'],        
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

    isActive: {
        type: Boolean,
        default: true
    }
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

export default mongoose.model('User', userSchema);