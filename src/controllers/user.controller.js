import { asyncHandler } from "../utils/aynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { deleteFromCloudinary, uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken=async(userId)=>{
   try {
     const user=await User.findById(userId)
     if(!user){
         throw new ApiError(404,"user not found")
     }
     const accessToken=user.generateAccessToken()
     const refreshToken=user.generateRefereshToken()
 
     user.refreshToken=refreshToken
     await user.save({validateBeforeSave:false})
     return {accessToken,refreshToken}
   } catch (error) {
    throw new ApiError(500,"something went wrong while generating access and refesh token") 
   }
}

const registerUser=asyncHandler(async (req ,res)=>{
     const {fullname,email,username,password}=req.body;

     //validation
     if(
        [fullname,username,email,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"user already exists")
    }

    
    
    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverLocalPath=req.files?.coverImage?.[0]?.path
    
//    const avatar=await uploadONCloudinary(avatarLocalPath)

//     //upload cover image to cloudinary
//    let cover=""
//     if(coverLocalPath){
//         cover= await uploadONCloudinary(coverLocalPath)
//     }

let avatar;
if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
}

try {
    avatar = await uploadONCloudinary(avatarLocalPath);
    console.log("Uploaded avatar", avatar);

    if (!avatar?.url) { // Important check
        throw new ApiError(400, "Avatar upload failed");
    }

} catch (error) {
    console.log("Error uploading avatar", error);
    throw new ApiError(500, "Failed to upload avatar");
}

    let coverImage = { url: "" };
   if(coverLocalPath){
    try {
        coverImage=await uploadONCloudinary(coverLocalPath)
        console.log("Uploaded cover image",coverImage);
        
        
    } catch (error) {
        console.log("Error uploading cover image",error);
        throw new ApiError(500,"failed to upload cover image")
    }
   }

   try {
     //creatind a user
     const user=await User.create({
         fullname,
         avatar:avatar?.url || "",
         coverImage:coverImage?.url || "",
         email,
         password,
         username:username.toLowerCase()
     })
 
     const createdUser= await User.findById(user._id).select(
         "-password -refreshToken"
     )
 
     if(!createdUser){
         throw new ApiError(500,"something went wrong while registering the user")
     }
 
     return res.status(201).json(new ApiResponse(201,createdUser,"User registered successfully"))
 
   } catch (error) {
    console.log("user creation failed");
    if(avatar){
        await deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage){
        await deleteFromCloudinary(coverImage.public_id)
    }
    throw new ApiError(500,"something went wrong while registering the user and images were deleted")

   }


})

const loginUser=asyncHandler(async (req,res)=>{
    //get data from body
    const {username,email,password}=req.body
    if(!email){
        throw new ApiError(400,"email is required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })
    console.log(user);
    

    if(!user){
        throw new ApiError(400,"user does not exist")
    }

    //validate password
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(400,"not a valid password")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id)
    .select("-password -refreshToken");
    if(!loggedInUser){
        throw new ApiError(400,"user login failed")
    }

    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,loggedInUser,"user logged in successfully"))

})

const logOutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {new:true}
    ) 
    
    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"refesh token is required")
    }

    try {
       const decodedToken= jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")

        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Invalid refresh token")
        }
       
    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }

    const {accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(500,"something went wrong while refreshing access token")
    }
})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldpass,newpass}=req.body
    const user=await User.findById(req.user?._id)

    const isPasswordValid=await user.isPasswordCorrect(oldpass);

    if(!isPasswordValid){
        throw new ApiError(401,"old password is incorrect")
    }

    user.password= newpass
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current user details"))

})
const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new ApiError(401,"Fullname and email are  required")
    }
   const user=await  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Account deetails updated successfully"))
})

const updateUserAvatar=asyncHandler(async (req,res)=>{
  const avatarLocalPath=  req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(401,"avatar not available")
  }
const avatar=await uploadONCloudinary(avatarLocalPath)
if(!avatar.url){
    throw new ApiError(500,"something went wrong while uploading avatar")
}

const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}

).select("-password -refreshToken")

 return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))

})
const updateUserCoverImage=asyncHandler(async (req,res)=>{
  const coverImagePath=req.file?.path
  if(!coverImagePath){
    throw new ApiError(400,"File is required")
  }

  const coverImage=await uploadONCloudinary(coverImagePath);
  if(!coverImage.url){
    throw new ApiError(500,"Something went wrong while uploadinng cover image")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }
    },
    {new:true}
  ).select("-password -refreshToken")

  return res.status(200).json(new ApiResponse(200,user,"uploaded cover image successfully"))
})

const getuserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(401,"username is required")
    }
    const channel=await User.aggregate(
        [
            {$match:{
                username:username?.toLowerCase()
            }},
            {
                $lookup:{
                    from:"subscriptions" ,
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelSubscribedToCount:{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                //project only the necessary data
                $project:{
                    fullname:1,
                    username:1,
                    avatar:1,
                    subscribersCount:1,
                    channelSubscribedToCount:1,
                    isSubscribed:1,
                    coverImage:1,
                    email:1

                }

            }
        ]
    )

    // console.log("channel",channel[0]);
    
 
    if(!channel?.length){
        throw new ApiError(404,"channel not found")
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"channel profile fetched successfully"))


})


const getWatchHisstory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                fromm:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                     }
                ]
            }
        },
    ])
    
    return res.status(200).json(new ApiResponse(200,user[0]?.watchHistory,"watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logOutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getuserChannelProfile,
    getWatchHisstory

}