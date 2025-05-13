// id string pk
//   username string
//   email string
//   fullName string
//   avatar string 
//   coverImage string
//   watchHistory ObjectId[] videos
//   password string
//   refreshToken string
//   createdAt Date
//   updateAt Date

import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },

        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },

        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinary url
            required:true,  
        },
        coverImage:{
            type:String
        },
        watchHistory: [{
            type:Schema.Types.ObjectId,
            ref:"Video" 
        }],
        password:{
            type:String,
            required:[true,"password is required"],
        },
        refreshToken:{
            type:String 
        }
    },
    {timestamps:true}
)
//middle ware
//(pre hoook)
 userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)

    next()// passes to next middleware or pre hook
 })

 userSchema.methods.isPasswordCorrect=async function(password){
   return await  bcrypt.compare(password,this.password)
 }

 //JWT token
 userSchema.methods.generateAccessToken=function(){
 return jwt.sign({
    _id:this._id,
    email:this.email,
    username:this.username,
    fullname:this.fullname
},'secret1',{expiresIn:'1h'});
 }

 userSchema.methods.generateRefereshToken=function(){
    return jwt.sign({
       _id:this._id,
   },'secret2',{expiresIn:'1h'});
    } 
   

export const User=mongoose.model("User",userSchema)