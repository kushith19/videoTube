// owner ObjectId users
//   videoFile string
//   thumbnail string
//   title string
//   description string
//   duration string
//   views number 
//   isPublished boolean
//   createdAt Date
//   updateAt Date

import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema=new Schema({
    videoFile:{
        type:String, //cloudinary url
        required:true,
    },
    thumbnail:{
        type:String, //cloudinary url
        required:true,
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    duration:{ 
        type:Number,
        required:true
    },
    isPublished:{
        type:Number,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

VideoSchema.plugin(mongooseAggregatePaginate)// aggregation pipeline


export const Video=mongoose.model("Video",VideoSchema)