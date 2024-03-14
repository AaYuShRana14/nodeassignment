const express=require('express');
const app=express();
const mongoose=require('mongoose');
const cors=require('cors');
app.use(cors());
app.use(express.json());


mongoose.connect('mongodb+srv://antineutrino1464:tvEdj7tV3HY@cluster.4ipxphf.mongodb.net/?retryWrites=true&w=majority').then(()=>{
    console.log("Db connected")
}).catch((e)=>{
    console.log(e);
})
app.use('/user',require('./routes/userRoutes'));
app.use('/post',require('./routes/postRoutes'));
app.listen(3000,()=>{
    console.log("app running");
});
         