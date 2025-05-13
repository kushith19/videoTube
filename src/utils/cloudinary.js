import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET  
});

const uploadONCloudinary=async (localFilePath) =>{
    try {
        if(!localFilePath) return null;
       const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("File uploaded on cloudinary,File src:"+response.url);
        
        //after file is uploaded,it gets deleted from our server
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.error("Error uploading to Cloudinary:", error);
        return null;
    }
}

const deleteFromCloudinary=async (publicId)=>{
    try {
        const result =await cloudinary.uploader.destroy(publicId)
        console.log("deleted from cloudinary..public_id:",publicId);
        
    } catch (error) {
        console.log("Error deleting from cloudinary",error);
        return null
    }
}

export {uploadONCloudinary,deleteFromCloudinary}