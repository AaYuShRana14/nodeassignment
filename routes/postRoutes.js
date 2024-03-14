const express = require('express');
const isLoggedin = require('../Middlewares/isLoggedin');
const User = require('../Model/user');
const Post=require('../Model/post');
const router = express.Router();
const { z } = require("zod");
const postdata=z.object({
    title:z.string().min(5),
    content:z.string().min(5),
    img:z.string()
})
router.post("/create", isLoggedin, async (req, res) => {
    try {
        const user= await User.findById(req.userId);
        if (!user) {
            return res.status(401).send("User not found");
        }
        const { title, content, img } = req.body;
        const data = postdata.safeParse({ title, content, img });

        if (data.success) {
            const newPost = new Post({title,content,img,owner: user._id,likes: [],comments: []});
            await newPost.save();
            user.posts.push(newPost._id);
            await user.save(); 
            res.send({ message: "Post created successfully", Post: newPost });
        } else {
            res.status(400).send("Invalid post data");
        }
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).send("Internal Server Error");
    }
});
router.get("/:id",async(req,res)=>{ 
    try {
        const post=await Post.findById(req.params.id);
        if(!post){
            return res.status(404).send("Post not found");
        }
        res.send(post);
    } catch (error) {
        console.error("Error getting post:", error);
        res.status(500).send("Internal Server Error");
    }
}); 
router.put('/:id',isLoggedin,async(req,res)=>{
    try {
        const user=await User.findById(req.userId);
        if(!user){
            return res.status(401).send("User not found");
        }
        const post=await Post.findById(req.params.id);
        if(!post){
            return res.status(404).send("Post not found");
        }
        if(post.owner.toString()!==user._id.toString()){
            return res.status(403).send("You are not allowed to update this post");
        }
        const { title, content, img } = req.body;
        const data = postdata.safeParse({ title, content, img });
        if (data.success) {
            post.title=title;
            post.content=content;
            post.img=img;
            await post.save();
            res.send({ message: "Post updated successfully", post });
        } else {
            res.status(400).send("Invalid post data");
        }
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send("Internal Server Error");
    }
});
router.delete('/:id',isLoggedin,async(req,res)=>{
    try {
        const user=await User.findById(req.userId);
        if(!user){
            return res.status(401).send("User not found");
        }
        const post=await Post.findById(req.params.id);
        if(!post){
            return res.status(404).send("Post not found");
        }
        if(post.owner.toString()!==user._id.toString()){
            return res.status(403).send("You are not allowed to delete this post");
        }
        await Post.deleteOne({_id:post._id});
        await user.posts.pull(post._id);
        await user.save();
        res.send({ message: "Post deleted successfully", post });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});
router.post("/like/:postId", isLoggedin, async (req, res) => {
    try {
        const user= await User.findById(req.userId);
        if (!user) {
            return res.status(401).send("User not found");
        }
        const postId=req.params.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(400).send("Post not found");
        }
        if (post.likes.includes(user._id)) {
            post.likes = post.likes.filter((id) => id.toString() !== user._id.toString());
        } else {
            post.likes.push(user._id);
        }
        await post.save();
        res.send({ message: "Post liked / unliked successfully", likes: post.likes.length, post});
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).send("Internal Server Error");
    }
});
router.post("/comment/:postId", isLoggedin, async (req, res) => {
    try {
        const user=await User.findById(req.userId);
        if (!user) {
            return res.status(401).send("User not found");
        }
        const postId=req.params.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(400).send("Post not found");
        }
        const { text } = req.body;
        if (!text) {
            return res.status(400).send("Invalid comment");
        }
        post.comments.push({ text, owner: user._id });
        await post.save();
        res.send({ message: "Comment added successfully", comments: post.comments.length, post});
    } catch (error) {
        console.error("Error commenting post:", error);
        res.status(500).send("Internal Server Error");
    }
});
module.exports = router;