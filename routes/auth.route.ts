import { Router } from "express";
import {
  userSignup,
  userLogin,
  sellerLogin,
  adminLogin,
} from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/user/signup", userSignup);

authRouter.post("/user/login", userLogin);

authRouter.post("/seller/login", sellerLogin);

authRouter.post("/admin/login", adminLogin);

export default authRouter;
