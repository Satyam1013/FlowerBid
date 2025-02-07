import { Router } from "express";
import { placeBid } from "../controller/bid.controller";
import { bidRateLimiter } from "../middleware/rate.limiter";

const bidRouter = Router();

bidRouter.post("/:flowerId/bid", bidRateLimiter, placeBid);

export default bidRouter;
