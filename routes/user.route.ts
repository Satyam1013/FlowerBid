import { Router } from "express";
import {
  updateUserDetails,
  getUserProfile,
} from "../controller/user.controller";

const userRouter: Router = Router();

userRouter.get("/profile/:userId", getUserProfile);

userRouter.put("/update", updateUserDetails);

export default userRouter;
