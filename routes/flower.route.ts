import { Router } from "express";
import {
  getAvailableFlowers,
  placeBid,
  favoriteFlowers,
} from "../controller/flower.controller";
import { authenticator } from "../middleware/authenticator";
import { bidRateLimiter } from "../middleware/rate.limiter";


const flowerRouter: Router = Router();

flowerRouter.get("/", getAvailableFlowers);

// POST /flowers/:flowerId/bid - Place a bid on a specific flower.
flowerRouter.post("/:flowerId/bid", bidRateLimiter, placeBid);

flowerRouter.post("/favorites", favoriteFlowers);

export default flowerRouter;
