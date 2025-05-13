import { Router } from "express";
import { registerUser,logOutUser, getuserChannelProfile, getWatchHisstory, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";
const router =Router();

//  /api/v1/healthcheck/
router.route("/register").post(
    upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
    ]),
    registerUser)

    router.route("/login").post(loginUser)
    router.route("/refresh-token").post(refreshAccessToken)

    //secured routes
    router.route("/logout").post(verifyJWT,logOutUser)
    router.route("/change-password").post(verifyJWT,changeCurrentPassword)
    router.route("/current-user").post(verifyJWT,getCurrentUser)

    router.route("/profile/:username").get(verifyJWT,getuserChannelProfile)
    router.route("/history/:username").get(verifyJWT,getWatchHisstory)

    router.route("/update-acc").patch(verifyJWT,updateAccountDetails)

    router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
    router.route("/update-cover").patch(verifyJWT,upload.single("cover"),updateUserCoverImage)


    

 
export default router