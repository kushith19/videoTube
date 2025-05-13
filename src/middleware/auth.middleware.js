import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/aynchandler.js";

export const verifyJWT=asyncHandler(async (req,_,next)=>{
    const token=req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","")
    console.log("real token",token);
    
    if(!token){
        throw new ApiError(401,"unauthorized")
    }
    try {
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        console.log("decoded token",decodedToken);
        
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"unauthorized")
        }

        req.user=user //new enity added to req
        //transfer the control from middleware to controller
        next()
    } catch (error) {
        throw new ApiError(401,"Invalid access token")
    }
})
