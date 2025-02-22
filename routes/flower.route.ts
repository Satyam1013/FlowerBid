import { Router } from "express";
import {
  getLiveFlowers,
  getUpcomingFlowers,
  placeBid,
  favoriteFlowers,
  addFavoriteFlower,
  getFlowersGroupedByCategory,
  getAvailableFlowers,
} from "../controller/flower.controller";
import { authenticator } from "../middleware/authenticator";

const flowerRouter: Router = Router();

flowerRouter.get("/available", getAvailableFlowers);

flowerRouter.get("/live", getLiveFlowers);

flowerRouter.get("/upcoming", getUpcomingFlowers);

flowerRouter.post("/:flowerId/bid", authenticator, placeBid);

flowerRouter.get("/favorites", authenticator, favoriteFlowers);

flowerRouter.post("/:flowerId/add-favorite", authenticator, addFavoriteFlower);

flowerRouter.get("/category", getFlowersGroupedByCategory);

export default flowerRouter;
