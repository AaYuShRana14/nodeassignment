const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { z } = require("zod");
const jwt=require('jsonwebtoken');
const Users=require('../Model/user');
const bcrypt = require('bcryptjs');
const isLoggedin = require('../Middlewares/isLoggedin');
require('dotenv').config();
const jwtsecret=process.env.SECRET;
const userdata = z.object({
    username:z.string().min(5),
    email: z.string().email(),
    password: z.string().min(5).max(25)
})
const logincredentials=z.object({
    username:z.string().min(5),
    password: z.string().min(5).max(25)
})
router.post('/register',async(req,res)=>{
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
            const {_id}=await newUser.save();
            const token=jwt.sign({_id},jwtsecret, { expiresIn: '12h' });
            res.status(200).json({message:'registered successfully',token:token});
            return;
        }

    }
    return res.status(422).json({error:"invalid input"});
});
router.post('/login',async(req,res)=>{
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
        const token=jwt.sign({_id:user._id},jwtsecret, { expiresIn: '12h' });
        res.status(200).json({message:"logged in successfully",token});
        return;
    }
    return res.status(422).json({error:"invalid input"});
})

router.post('/forgot-password',async(req,res)=>{
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
    const resetpasswordlink=`http://localhost:3000/${userid}/${token}`;
    return res.status(200).json({resetpasswordlink});
})
router.post('/reset-password/:id/:token',async(req,res)=>{ // the link wont be valid after one time as the secret used will change.
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
router.get('/all-posts',isLoggedin,async(req,res)=>{
    try{
    const user=await Users.findById(req.userId);
    const posts= await user.populate('posts'); 
    console.log(posts);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json(user.posts);
    }
    catch(error){
        res.send(error.message);
    }
});
module.exports = router;                                                                               
