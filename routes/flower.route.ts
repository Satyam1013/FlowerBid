import { Router } from "express";
import {
  getLiveFlowers,
  getUpcomingFlowers,
  placeBid,
  favoriteFlowers,
} from "../controller/flower.controller";

const flowerRouter: Router = Router();

flowerRouter.get("/live", getLiveFlowers);

flowerRouter.get("/upcoming", getUpcomingFlowers);

flowerRouter.post("/:flowerId/bid", placeBid);

flowerRouter.post("/favorites", favoriteFlowers);

export default flowerRouter;
