import { hash } from "bcryptjs";
import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Vui lòng nhập tên cây trồng'],
        trim:true,
        maxLength:[100,'Tên cây trồng không được vượt quá 100 ký tự']
    },
    species:{
        type:String,
        required:[true,'Vui lòng nhập loài cây trồng'],
        trim:true,
        maxLength:[100,'Loài cây trồng không được vượt quá 100 ký tự']
    },
    category:{
        type:String,
        required:[true,'Vui lòng nhập loại cây trồng'],
        trim:true,
        maxLength:[100,'Loại cây trồng không được vượt quá 100 ký tự']
    },
    plantingDate:{
        type:Date,
        required:[true,'Vui lòng nhập ngày trồng cây'],
        validate:{
            validator:function(value){
                return value <= new Date(); 
            },
            message:'Ngày trồng cây không được lớn hơn ngày hiện tại'  
        }
    },
    location:{
        type:String,
        required:[true,'Vui lòng nhập vị trí trồng cây'],
        trim:true,
        maxLength:[200,'Vị trí trồng cây không được vượt quá 200 ký tự']
    },
    harvestDate:{
        type:Date,
        validate:{  
            validator:function(value){
                return !value || value >= this.plantingDate;
            },
            message:'Ngày thu hoạch phải lớn hơn hoặc bằng ngày trồng cây'
        }
    },
    status:{
        type:String,
        enum:['Đang trồng','Đã thu hoạch','Bị hỏng'],
        default:'Đang trồng'    
    },
    notes:{
        type:String,
        trim:true,
        maxLength:[500,'Ghi chú không được vượt quá 500 ký tự']
    },
    
}, { timestamps: true });

export default mongoose.model('Crop',cropSchema);