import { Router } from "express";
import { updateUserDetails, getUserProfile } from "../controller/user.controller";

const userRouter: Router = Router();

userRouter.put("/update", updateUserDetails);

userRouter.get("/profile", getUserProfile);

export default userRouter;
