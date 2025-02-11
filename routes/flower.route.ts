import { Router } from "express";
import {
  getAvailableFlowers,
  placeBid,
  favoriteFlowers,
} from "../controller/flower.controller";
import { bidRateLimiter } from "../middleware/rate.limiter";


const flowerRouter: Router = Router();

flowerRouter.get("/", getAvailableFlowers);

flowerRouter.post("/:flowerId/bid", bidRateLimiter, placeBid);

flowerRouter.post("/favorites", favoriteFlowers);

export default flowerRouter;
