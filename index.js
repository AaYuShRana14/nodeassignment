const { z } = require("zod");
const express=require('express');
const app=express();
const { ObjectId } = require('mongodb');
const mongoose=require('mongoose');
const Users=require('./Model/user');
const bcrypt = require('bcryptjs');
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
    const data=userdata.safeParse({email,username,password}); // validating input fields
    if(data.success){
        const user=await Users.findOne({email});
        if(user){
            res.status(403).send({message:"User already exists"}); // not letting to create a user if the email is used
            return;
        }
        else{
            const hashpassword = await bcrypt.hash(password, 10); // hashing the password before storing in database
            const newUser=new Users({email,username,password:hashpassword}); // create new user
            await newUser.save();
            res.status(200).json({message:'registered successfully'});
            return;
        }

    }
    return res.status(422).json({error:"invalid input"});
});
app.post('/login',async(req,res)=>{
    const{username,password}=req.body;
    const data=logincredentials.safeParse({username,password});// validating input fields
    if(data.success){
        const user=await Users.findOne({username}); // finding if username exists in database
        if(!user){
            return res.status(401).json({error:"Invalid credentials"});
        }
        const passwordMatched = await bcrypt.compare(password, user.password);
        if(!passwordMatched){ //checking whether the provided plain text password matches the hashed password stored
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
    const token=jwt.sign({userid},secret, { expiresIn: '5m' }); // creating a new token for reseting password link
    const resetpasswordlink=`http://nodeassignmentt.onrender.com/reset-password/${userid}/${token}`;
    return res.status(200).json({resetpasswordlink});
})
app.get('/reset-password/:id/:token',async(req,res)=>{ // the link wont be valid after one time as the secret used will change.
    const{id,token}=req.params;
    const{password}=req.body;
    if (!ObjectId.isValid(id)) { // checking if the user id is valid
        res.status(400).send('Invalid user ID');
        return;
    }
    const user=await User.findById(id); // finding user in the database using userid

    if(!user){
        res.send("Invalid user");
        return;
    }
    const secret=jwtsecret+user.password; // recreating the secret used to create jwt token earlier
    try{
        const verified=jwt.verify(token,secret);// verifying the token if link is used once and password is changed the token will change and link cant be used again
        const hashpassword = await bcrypt.hash(password, 10);// hashing the password before storing in database
        user.password=hashpassword;// upadting the password 
        user.save();// saving user
        res.send(user);
    }
    catch(error){
        res.send(error.message);
    }
})
app.listen(3000,()=>{
    console.log("app running");
});
