import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel id");
    }

    const channel=await User.findById(channelId);
    if(!channel){
        throw new ApiError(400,"channel not found")
    }

    const {userId} =req.user;
    const existingSubscription=await Subscription.findOne({
        user:channelId,
        subscriber:userId
    })

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200,"unsubscribed successfully"))
    }

    try {
        const newSubscription=new Subscription({
            user:channelId,
            subscriber:userId
        })
        await newSubscription.save();
        return res.status(200).json(new ApiResponse(200,"subscribed successfully"))

    } catch (error) {
        throw new ApiError(500,"something went wrong while subscribing"); 
    }
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}