const mongoose=require('mongoose');
const {Schema}=mongoose;
const userSchema=new Schema({
    username:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    posts:[
        {
            type:Schema.Types.ObjectId,
            ref:'Post'
        }
    ],
    default:[]
})
const User=mongoose.model('User',userSchema);
module.exports=User;