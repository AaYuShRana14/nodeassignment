const { z } = require("zod");
const express=require('express');
const app=express();
const { ObjectId } = require('mongodb');
const mongoose=require('mongoose');
const Users=require('./Model/user');
const bcrypt = require('bcrypt');
const cors=require('cors');
const jwt=require('jsonwebtoken');
const User = require("./Model/user");
require('dotenv').config();
const jwtsecret=process.env.SECRET;
app.use(cors());
app.use(express.json());

const userdata = z.object({
    username:z.string().min(5),
    email: z.string().email(),
    password: z.string().min(5).max(25)
})
const logincredentials=z.object({
    username:z.string().min(5),
    password: z.string().min(5).max(25)
})

mongoose.connect('mongodb+srv://antineutrino1464:tvEdj7tV3HY@cluster.4ipxphf.mongodb.net/?retryWrites=true&w=majority',
{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    console.log("Db connected")
}).catch((e)=>{
    console.log(e);
})


app.post('/register',async(req,res)=>{
    const {email,username,password}=req.body;
    const data=userdata.safeParse({email,username,password});
    if(data.success){
        const user=await Users.findOne({email});
        if(user){
            res.status(403).send({message:"User already exists"});
            return;
        }
        else{
            const hashpassword = await bcrypt.hash(password, 10);
            const newUser=new Users({email,username,password:hashpassword});
            await newUser.save();
            res.status(200).json({message:'registered successfully'});
            return;
        }

    }
    return res.status(422).json({error:"invalid input"});
});
app.post('/login',async(req,res)=>{
    const{username,password}=req.body;
    const data=logincredentials.safeParse({username,password});
    if(data.success){
        const user=await Users.findOne({username});
        if(!user){
            return res.status(401).json({error:"Invalid credentials"});
        }
        const passwordMatched = await bcrypt.compare(password, user.password);
        if(!passwordMatched){
            return res.status(401).json({error:"Invalid credentials"});
        }
        res.status(200).json({"message":"logged in successfully"});
        return;
    }
    return res.status(422).json({error:"invalid input"});
})

app.post('/forgot-password',async(req,res)=>{
    const{username}=req.body;
    if(username===undefined){
        return res.status(422).json({error:"invalid input!!"});
    }
    const user=await Users.findOne({username});
    if(!user){
        return res.status(401).json({error:"No user found"});
    }
    const secret=jwtsecret+user.password;
    const userid=user._id.toString();
    const token=jwt.sign({userid},secret, { expiresIn: '5m' });
    const resetpasswordlink=`http://localhost:3000/reset-password/${userid}/${token}`;
    return res.status(200).json({resetpasswordlink});
})
app.get('/reset-password/:id/:token',async(req,res)=>{
    const{id,token}=req.params;
    const{password}=req.body;
    if (!ObjectId.isValid(id)) {
        res.status(400).send('Invalid user ID');
        return;
    }
    const user=await User.findById(id);
    if(!user){
        res.send("Invalid user");
        return;
    }
    const secret=jwtsecret+user.password;
    try{
        const verified=jwt.verify(token,secret);
        const hashpassword = await bcrypt.hash(password, 10);
        user.password=hashpassword;
        user.save();
        res.send(user);
    }
    catch(error){
        res.send(error.message);
    }
})
app.listen(3000,()=>{
    console.log("app running");
});