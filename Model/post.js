const mongoose  = require('mongoose');
const { Schema } = mongoose;
const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    img:{
        type:String,
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    likes:[
        {
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    comments:[
        {
            text:String,
            owner:{
                type:Schema.Types.ObjectId,
                ref:'User'
            }
        }
    ]
});
const Post = mongoose.model('Post', postSchema);
module.exports = Post;